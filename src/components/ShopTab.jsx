import { useState, useEffect, useRef } from 'react'
import { krogerApi } from '../lib/kroger.js'
import { cleanIngredient } from '../lib/ingredients.js'
import { streamClaude } from '../lib/claude.js'
import { supa } from '../lib/supabase.js'
import { I } from './Icons.jsx'
import EmptyState from './EmptyState.jsx'
import { logError } from '../lib/sentry.js'

export default function ShopTab({ shop, notify, session, preferredStore, setTab }) {
  const [productPrefs, setProductPrefs] = useState({}) // ingredient_key -> { chosen_upc, chosen_brand, chosen_name }
  const lastAiRaw = useRef('') // last raw AI matcher response, for the debug report
  // Kroger is the only supported grocery integration. Other stores (Instacart,
  // Walmart, etc.) have no backend and crashed the order flow, so the picker was
  // removed and the store is hardcoded. Ignore any stale `preferredStore`.
  const [store] = useState('kroger')
  const [method, setMethod] = useState('pickup')
  const [checked, setChk] = useState({})
  const [ordered, setOrd] = useState(false)
  const [krogerToken, setKrogerToken] = useState(() => localStorage.getItem('nq_kroger_token'))
  const [krogerClientToken, setKrogerClientToken] = useState(() => localStorage.getItem('nq_kroger_client_token'))
  const [krogerStore, setKrogerStore] = useState(() => JSON.parse(localStorage.getItem('nq_kroger_store') || 'null'))

  // Auto-fetch client credentials token for product search (no user auth needed)
  const getSearchToken = () => krogerToken || krogerClientToken
  const [matchedProducts, setMatchedProducts] = useState({})
  const [matching, setMatching] = useState(false)
  const [refining, setRefining] = useState(false)
  const [substituting, setSubstituting] = useState(false)
  const [matchProgress, setMatchProgress] = useState({ done: 0, total: 0 })
  const [placingOrder, setPlacingOrder] = useState(false)
  const [stores, setStores] = useState([])
  const [showStores, setShowStores] = useState(false)

  const toggle = i => setChk(c => ({ ...c, [i]: !c[i] }))
  const unc = shop.filter((_, i) => !checked[i])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code && window.location.pathname === '/kroger-callback') {
      exchangeKrogerCode(code)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // Auto-fetch client token if we don't have any token yet
  useEffect(() => {
    if (store !== 'kroger') return
    if (krogerToken || krogerClientToken) return
    krogerApi('get_client_token').then(data => {
      if (data.access_token) {
        localStorage.setItem('nq_kroger_client_token', data.access_token)
        setKrogerClientToken(data.access_token)
      }
    }).catch(() => {})
  }, [store])

  // Silently exchange the stored refresh token for a fresh access token so the
  // user stays connected (Kroger access tokens expire ~30 min; refresh tokens
  // last far longer and rotate on use). Returns the new token or null.
  const refreshKrogerToken = async () => {
    const refresh = localStorage.getItem('nq_kroger_refresh')
    if (!refresh) return null
    const data = await krogerApi('refresh_token', { refresh_token: refresh })
    if (data.access_token) {
      localStorage.setItem('nq_kroger_token', data.access_token)
      if (data.refresh_token) localStorage.setItem('nq_kroger_refresh', data.refresh_token)
      setKrogerToken(data.access_token)
      return data.access_token
    }
    return null
  }

  // Auto-match products whenever we have any token + shop items
  useEffect(() => {
    const token = getSearchToken()
    if (token && shop.length > 0 && store === 'kroger' && Object.keys(matchedProducts).length === 0) {
      matchAllProducts()
    }
  }, [krogerToken, krogerClientToken, shop, store])

  const connectKroger = async () => {
    const data = await krogerApi('get_auth_url')
    if (data.auth_url) window.location.href = data.auth_url
    else notify('Could not connect to Kroger', 'err')
  }

  const exchangeKrogerCode = async code => {
    notify('Connecting Kroger account...')
    const data = await krogerApi('exchange_code', { code })
    if (data.access_token) {
      localStorage.setItem('nq_kroger_token', data.access_token)
      if (data.refresh_token) localStorage.setItem('nq_kroger_refresh', data.refresh_token)
      setKrogerToken(data.access_token)
      notify('Kroger connected!')
      findNearestStore(data.access_token)
    } else { notify('Kroger connection failed', 'err') }
  }

  const disconnectKroger = () => {
    localStorage.removeItem('nq_kroger_token')
    localStorage.removeItem('nq_kroger_refresh')
    localStorage.removeItem('nq_kroger_store')
    setKrogerToken(null); setKrogerStore(null); setMatchedProducts({})
    notify('Kroger disconnected')
  }

  const findNearestStore = async token => {
    const t = token || krogerToken
    if (!t) return
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async pos => {
            const data = await krogerApi('find_stores', { access_token: t, lat: pos.coords.latitude, lng: pos.coords.longitude })
            if (data.stores?.length > 0) { setStores(data.stores); setShowStores(true) }
          },
          async () => {
            const data = await krogerApi('find_stores', { access_token: t })
            if (data.stores?.length > 0) { setStores(data.stores); setShowStores(true) }
          }
        )
      }
    } catch (e) { console.error('Store search error:', e) }
  }

  const selectStore = s => {
    setKrogerStore(s)
    localStorage.setItem('nq_kroger_store', JSON.stringify(s))
    setShowStores(false)
    notify('Store set: ' + s.name)
    if (shop.length > 0) matchAllProducts()
  }

  // Load this user's learned product/brand preferences
  useEffect(() => {
    if (!session) return
    supa.from('product_preferences').select('*').eq('user_id', session.user.id)
      .then(({ data }) => {
        if (!data) return
        const map = {}
        data.forEach(p => { map[p.ingredient_key] = { chosen_upc: p.chosen_upc, chosen_brand: p.chosen_brand, chosen_name: p.chosen_name } })
        setProductPrefs(map)
      })
  }, [session])

  // Save a brand pick so it's remembered next time this ingredient appears
  const saveProductPick = async (ingredientKey, prod) => {
    const next = { chosen_upc: prod.upc, chosen_brand: prod.brand, chosen_name: prod.name }
    setProductPrefs(p => ({ ...p, [ingredientKey]: next }))
    if (!session) return
    try {
      await supa.rpc('record_product_pick', {
        p_user_id: session.user.id, p_ingredient_key: ingredientKey,
        p_upc: prod.upc, p_brand: prod.brand || '', p_name: prod.name || '',
      })
    } catch (e) { console.error('saveProductPick error:', e) }
  }

  // Given search results + the ingredient key, pick the index of the user's
  // preferred product if it's present (match by UPC first, then brand).
  const preferredIndex = (options, ingredientKey) => {
    const pref = productPrefs[ingredientKey]
    if (!pref) return 0
    const byUpc = options.findIndex(o => o.upc && o.upc === pref.chosen_upc)
    if (byUpc >= 0) return byUpc
    const byBrand = options.findIndex(o => o.brand && pref.chosen_brand && o.brand.toLowerCase() === pref.chosen_brand.toLowerCase())
    return byBrand >= 0 ? byBrand : 0
  }

  const matchAllProducts = async (opts = {}) => {
    const token = opts.token || getSearchToken()
    const didRefresh = opts.didRefresh || false
    if (!token || shop.length === 0) return
    setMatching(true)
    setMatchedProducts({})
    setMatchProgress({ done: 0, total: shop.length })
    let authFailed = false
    const allResults = {}
    const BATCH = 5
    for (let i = 0; i < shop.length; i += BATCH) {
      const batch = shop.slice(i, i + BATCH)
      const batchResults = {}
      await Promise.all(batch.map(async (item, idx) => {
        try {
          const key = cleanIngredient(item.item)
          const data = await krogerApi('search_products', {
            access_token: token,
            query: key,
            location_id: krogerStore?.id,
          })
          if (data.needs_reauth) { authFailed = true; return }
          if (data.products?.length > 0) {
            const options = data.products.slice(0, 10)
            batchResults[i + idx] = { selected: preferredIndex(options, key), options, key, term: data.term }
          }
        } catch (e) { console.error('Match error for', item.item, e) }
      }))
      Object.assign(allResults, batchResults)
      // Stream each batch into the UI so matches appear as they arrive
      setMatchedProducts(prev => ({ ...prev, ...batchResults }))
      setMatchProgress({ done: Math.min(i + BATCH, shop.length), total: shop.length })
      if (i + BATCH < shop.length) await new Promise(r => setTimeout(r, 120))
    }
    setMatching(false)
    if (authFailed) {
      // Token likely expired mid-run — refresh once and retry transparently
      if (!didRefresh) {
        const newTok = await refreshKrogerToken()
        if (newTok) return matchAllProducts({ token: newTok, didRefresh: true })
      }
      notify('Your Kroger session expired — reconnect to match products', 'err'); return
    }
    if (Object.keys(allResults).length === 0) { notify('No product matches found — try re-matching', 'err'); return }
    // Let Claude pick the best real product per ingredient (fresh > deli, etc.)
    const noMatchIdx = (await refineMatchesWithAI(allResults)) || []
    // Items Kroger returned nothing for at all
    const missingIdx = shop.map((_, i) => i).filter(i => !allResults[i])
    const toSubstitute = [...new Set([...noMatchIdx, ...missingIdx])]
    if (toSubstitute.length > 0) suggestSubstitutes(toSubstitute, token)
  }

  // For items with no real grocery match (specialty ingredients like ghee),
  // ask Claude for a common substitute that stores actually carry, then search
  // and match THAT so the item still makes it onto the list.
  const suggestSubstitutes = async (indices, token) => {
    setSubstituting(true)
    try {
      const list = indices.map((i, n) => `${n}: "${shop[i].item}"`).join('\n')
      const sys = `Some ingredients had no grocery-store match, usually because they're specialty items. For each, give the single best everyday substitute that ANY standard US supermarket reliably stocks, as a plain grocery product name. Examples: ghee -> "unsalted butter"; gochujang -> "sriracha"; mascarpone -> "cream cheese"; shallot -> "yellow onion"; buttermilk -> "plain yogurt"; crème fraîche -> "sour cream". OUTPUT raw JSON only, mapping each number to a substitute string: {"0":"unsalted butter","1":"sriracha"}`
      const usr = `Return the JSON object only.\n${list}`
      let full = ''
      await streamClaude(sys, usr, c => { full += c })
      const objMatch = full.replace(/```json/gi, '').replace(/```/g, '').trim().match(/\{[\s\S]*\}/)
      const subs = JSON.parse(objMatch ? objMatch[0] : '{}')
      // Search Kroger for each substitute and attach the top result
      await Promise.all(indices.map(async (i, n) => {
        const subName = subs[n]
        if (!subName) return
        try {
          const data = await krogerApi('search_products', { access_token: token, query: subName, location_id: krogerStore?.id })
          if (data.products?.length > 0) {
            const options = data.products.slice(0, 8)
            setMatchedProducts(prev => ({ ...prev, [i]: { options, selected: 0, key: cleanIngredient(subName), substitute: subName, noMatch: false } }))
          } else {
            // Substitute also not found — at least surface the suggestion as text
            setMatchedProducts(prev => ({ ...prev, [i]: { ...(prev[i] || {}), noMatch: true, substitute: subName } }))
          }
        } catch (e) { logError(e, { where: 'substituteSearch', item: shop[i]?.item }) }
      }))
    } catch (e) { logError(e, { where: 'suggestSubstitutes', count: indices.length }) }
    setSubstituting(false)
  }

  // Send the real Kroger candidates back to Claude. Correctness FIRST: the
  // product must genuinely be the ingredient. If Kroger returned junk (e.g.
  // cheese for "ghee", onions for "garlic"), Claude returns -1 and we flag the
  // item as "no match" rather than buying the wrong thing. Saved picks skipped.
  const refineMatchesWithAI = async (results) => {
    const entries = Object.entries(results).filter(([, m]) => !productPrefs[m.key])
    if (entries.length === 0) return
    setRefining(true)
    try {
      const lines = entries.map(([i, m], n) => {
        const opts = m.options.slice(0, 8).map((o, oi) =>
          `  ${oi}: ${o.name}${o.brand ? ` — ${o.brand}` : ''}${o.size ? `, ${o.size}` : ''}`).join('\n')
        return `Ingredient ${n}: "${shop[i].item}"\n${opts}`
      }).join('\n\n')
      const sys = `You match a recipe ingredient to the correct real grocery product from a list.

RULE 1 — CORRECTNESS first: the product MUST be the same food as the ingredient. A DIFFERENT food is NEVER acceptable, however fresh or cheap. Reject: onions for "garlic"; cheese for "ghee"; soda for "lemon"; pickles for "dill"; chips or sour cream for "yogurt".
RULE 2 — the specific CUT / TYPE / ANIMAL matters. Chicken THIGHS are NOT chicken breasts. GROUND LAMB is NOT ground beef. GREEK yogurt is NOT sour cream. CURRY POWDER is NOT garam masala. If the exact cut/type isn't present, return -1 (a substitute is handled elsewhere).
RULE 3 — form is flexible: a frozen, farmed, previously-frozen, jarred, canned, or store-brand version of the SAME food/cut is a VALID match. Don't reject just for not being "fresh". Among valid matches, mildly prefer fresh/whole.
RULE 4 — HONOR modifiers in the ingredient name. "plain"/"unsweetened" → do NOT pick a flavored/sweetened version (e.g. for "plain greek yogurt", reject orange-creme or strawberry yogurt). "unsalted" → not salted. "low-sodium" → not regular. If only modified-wrong versions exist, return -1.
RULE 6 — BRAND preference for plain Greek yogurt: prefer Fage Total Plain or Chobani Plain over Yoplait. Yoplait Greek is acceptable ONLY if no Fage/Chobani plain option exists in the list.
RULE 5 — use -1 when no product is genuinely the same food, cut, AND modifier. Never force a wrong match; -1 is correct and expected.

OUTPUT: ONLY a raw JSON object, nothing else — no prose, no code fences, no explanation. For EVERY ingredient number from 0 to ${entries.length - 1}, return an ARRAY of the option indices that genuinely ARE that ingredient (same food, cut, and modifier), ranked best first — the first element is the top pick. Return an empty array [] if NONE of the options are correct. Exclude anything that isn't the actual food (e.g. for "fresh mint", exclude gum, toothpaste, and mouthwash). Example: {"0":[1,3],"1":[],"2":[0]}`
      const usr = `Return ONLY the JSON object.\n\n${lines}`
      let full = ''
      // Sonnet for the match decision — accuracy matters and it's one call per list
      await streamClaude(sys, usr, c => { full += c }, 'sonnet')
      lastAiRaw.current = full
      // Bulletproof parse: try direct, then code-fence strip, then JSON extraction
      let picks
      const tryParse = s => { try { return JSON.parse(s) } catch { return null } }
      const cleaned = full.replace(/```json/gi, '').replace(/```/g, '').trim()
      picks = tryParse(cleaned) || tryParse((cleaned.match(/\{[\s\S]*\}/) || [])[0] || '')
      if (!picks) throw new Error('AI match response did not parse: ' + full.slice(0, 200))
      // Normalize a pick to an array of valid option indices (accepts the new
      // array format and the legacy single-number/-1 format).
      const toValid = (choice, len) => {
        const arr = Array.isArray(choice) ? choice : (typeof choice === 'number' ? [choice] : [])
        return arr.filter(x => Number.isInteger(x) && x >= 0 && x < len)
      }
      const noMatchIndices = []
      entries.forEach(([i], n) => {
        const valid = toValid(picks[n], results[i]?.options.length || 0)
        if (valid.length === 0) noMatchIndices.push(Number(i))
      })
      setMatchedProducts(prev => {
        const next = { ...prev }
        entries.forEach(([i], n) => {
          if (!next[i]) return
          const valid = toValid(picks[n], next[i].options.length)
          if (valid.length > 0) {
            // selected = best pick; validIndices = only the real alternatives
            next[i] = { ...next[i], selected: valid[0], validIndices: valid, aiPicked: true, noMatch: false }
          } else {
            next[i] = { ...next[i], noMatch: true, validIndices: [] }
          }
        })
        return next
      })
      setRefining(false)
      return noMatchIndices
    } catch (e) { logError(e, { where: 'refineMatchesWithAI', items: entries.length }) }
    setRefining(false)
    return []
  }

  // Debug helper: copies exactly what each ingredient searched and what came
  // back, so matching issues can be diagnosed from real data (not screenshots).
  const copyMatchReport = async () => {
    const lines = shop.map((item, i) => {
      const m = matchedProducts[i]
      if (!m) return `• "${item.item}" → searched "${cleanIngredient(item.item)}" → NO RESULTS`
      const picked = m.noMatch ? 'NO MATCH (flagged)' : (m.options[m.selected]?.name || '?')
      const opts = m.options.map(o => `${o.name}${o.brand ? ` [${o.brand}]` : ''}`).join(' | ')
      return `• "${item.item}" → searched "${m.term || cleanIngredient(item.item)}" → picked: ${picked}\n    options: ${opts}`
    }).join('\n')
    const report = `NUTRIQ MATCH REPORT\nstore: ${krogerStore?.name || 'default'}\n\n${lines}\n\n--- AI matcher raw output ---\n${lastAiRaw.current || '(none)'}`
    try { await navigator.clipboard.writeText(report); notify('Match report copied — paste it to Claude') }
    catch { notify('Copy failed', 'err') }
  }

  const placeKrogerOrder = async () => {
    if (!krogerToken) { notify('Connect Kroger first', 'err'); return }
    setPlacingOrder(true)
    try {
      const items = shop.map((item, i) => {
        const m = matchedProducts[i]
        if (!m || m.noMatch) return null
        const prod = m.options[m.selected]
        return prod ? { upc: prod.upc, quantity: 1 } : null
      }).filter(Boolean)
      if (items.length === 0) { notify('No matched products to order', 'err'); setPlacingOrder(false); return }
      const data = await krogerApi('add_to_cart', { access_token: krogerToken, items })
      if (data.success) { setOrd(true); notify(`Added ${data.items_added} items to your Kroger cart!`) }
      else notify(data.error || 'Order failed', 'err')
    } catch (e) { notify('Order failed: ' + e.message, 'err') }
    setPlacingOrder(false)
  }

  const matchedCount = Object.values(matchedProducts).filter(m => !m.noMatch).length
  const totalEstimate = shop.reduce((sum, _, i) => {
    const m = matchedProducts[i]
    if (!m || m.noMatch) return sum
    const p = m.options?.[m.selected]
    return sum + (p?.promo_price || p?.price || 0)
  }, 0)

  if (ordered) return (
    <div className="page">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', textAlign: 'center' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 20 }}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 28, color: 'var(--plum)', marginBottom: 8 }}>Added to your cart!</div>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 8 }}>Your items are waiting in your Kroger cart.</p>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>Open the Kroger app or kroger.com to complete checkout.</p>
        <button className="btn-full" style={{ maxWidth: 220, marginBottom: 12 }} onClick={() => window.open('https://www.kroger.com/cart', '_blank')}>Open Kroger cart</button>
        <button className="btn-full blue" style={{ maxWidth: 220 }} onClick={() => setOrd(false)}>Back to list</button>
      </div>
    </div>
  )

  return (
    <div className="page">
      <div className="page-label">Grocery</div>
      <h1 className="page-title">Shopping list</h1>
      <p className="page-sub">From your meal plan</p>

      {store === 'kroger' && (
        <div className="card" style={{ marginBottom: 14 }}>
          {krogerToken ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage)' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Kroger connected</span>
                </div>
                <button className="btn-sm" onClick={disconnectKroger} style={{ fontSize: 11, padding: '4px 10px' }}>Disconnect</button>
              </div>
              {krogerStore ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{krogerStore.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{krogerStore.address}</div>
                  </div>
                  <button className="btn-sm" onClick={() => findNearestStore()} style={{ fontSize: 11, padding: '4px 10px' }}>Change</button>
                </div>
              ) : (
                <button className="btn-sm" onClick={() => findNearestStore()} style={{ width: '100%', textAlign: 'center', marginTop: 4 }}>Find nearest store</button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Products are matched automatically.</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Connect your Kroger account to add items to your cart.</div>
              <button className="btn-full" onClick={connectKroger}>Connect Kroger to order</button>
            </div>
          )}
        </div>
      )}

      {showStores && stores.length > 0 && (
        <div className="card" style={{ marginBottom: 14, border: '1px solid var(--plum3)44' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--plum)', marginBottom: 10 }}>Select your store</div>
          {stores.map(s => (
            <button key={s.id} onClick={() => selectStore(s)} style={{ width: '100%', background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', marginBottom: 6, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.address}{s.distance ? ` · ${s.distance.toFixed(1)} mi` : ''}</div>
            </button>
          ))}
          <button className="btn-ghost" style={{ marginBottom: 0, marginTop: 4 }} onClick={() => setShowStores(false)}>Cancel</button>
        </div>
      )}

      {shop.length === 0 ? (
        <EmptyState emoji="🛒" title="Nothing to shop for yet" sub="Plan your meals and we'll build the list — matched to real products at your store, ready for pickup." cta="Plan meals" onCta={() => setTab && setTab('meals')} />
      ) : (<>
        <div className="seg">
          <button className={`seg-btn${method === 'pickup' ? ' on' : ''}`} onClick={() => setMethod('pickup')}>Pickup</button>
          <button className={`seg-btn${method === 'delivery' ? ' on' : ''}`} onClick={() => setMethod('delivery')}>Delivery</button>
        </div>
        <div className="shop-summary">
          <div className="sum-cell"><div className="sum-val">{shop.length}</div><div className="sum-lbl">items</div></div>
          <div className="sum-cell"><div className="sum-val" style={{ color: 'var(--red)' }}>{shop.filter(i => i.priority === 'high').length}</div><div className="sum-lbl">urgent</div></div>
          <div className="sum-cell"><div className="sum-val" style={{ color: 'var(--sage)' }}>{matchedCount}</div><div className="sum-lbl">matched</div></div>
          <div className="sum-cell"><div className="sum-val" style={{ color: 'var(--plum)', fontSize: totalEstimate > 0 ? 18 : 22 }}>{totalEstimate > 0 ? `$${totalEstimate.toFixed(2)}` : '-'}</div><div className="sum-lbl">est. total</div></div>
        </div>
        {matching && (
          <div style={{ padding: '12px 14px', background: 'var(--plumLL)', borderRadius: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--plum)', marginBottom: 8 }}>
              <span className="spin" style={{ borderTopColor: 'var(--plum)', borderColor: 'var(--plum3)44' }} />
              Matching {matchProgress.done} of {matchProgress.total} items...
            </div>
            <div style={{ height: 4, background: 'var(--plum3)22', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--plum2)', borderRadius: 4, width: `${matchProgress.total ? (matchProgress.done / matchProgress.total) * 100 : 0}%`, transition: 'width .2s' }} />
            </div>
          </div>
        )}
        {refining && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--sageL)', borderRadius: 12, marginBottom: 12, fontSize: 13, color: 'var(--sage)' }}>
            <span className="spin" style={{ borderTopColor: 'var(--sage)', borderColor: 'var(--sage)44' }} />
            AI is picking the best match for each item...
          </div>
        )}
        {substituting && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--plumLL)', borderRadius: 12, marginBottom: 12, fontSize: 13, color: 'var(--plum)' }}>
            <span className="spin" style={{ borderTopColor: 'var(--plum)', borderColor: 'var(--plum3)44' }} />
            Finding substitutes for specialty items...
          </div>
        )}
        {shop.map((item, i) => {
          const matched = matchedProducts[i]
          return (
            <div key={i} className={`shop-row${checked[i] ? ' done' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }} onClick={() => toggle(i)}>
                <div className={`check-ring${checked[i] ? ' on' : ''}`}>{checked[i] ? '✓' : ''}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: checked[i] ? 'var(--muted2)' : 'var(--text)', textDecoration: checked[i] ? 'line-through' : 'none' }}>{item.item}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{item.quantity} · {item.reason}</div>
                </div>
                {item.priority === 'high' && !checked[i] && <span className="urgent-tag">urgent</span>}
              </div>
              {matched && !checked[i] && (
                <div style={{ background: matched.noMatch ? '#fef7ed' : 'var(--warm)', borderTop: '1px solid var(--border)', padding: '8px 14px 10px' }}>
                  {matched.noMatch ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 16, lineHeight: 1.2 }}>⚠️</span>
                      <div style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 600, color: 'var(--orange)' }}>No confident match for "{item.item}"</div>
                        <div style={{ color: 'var(--muted)', marginTop: 1 }}>
                          {matched.substitute
                            ? <>We'd suggest <strong>{matched.substitute}</strong> as a substitute, but couldn't find it either — grab it in store.</>
                            : <>Searched Kroger for "{matched.term || item.item}". Pick one below if any fit — otherwise grab it in store.</>}
                        </div>
                      </div>
                    </div>
                  ) : (() => {
                    const prod = matched.options[matched.selected]
                    return prod ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        {prod.image && <img src={prod.image} alt={prod.name} style={{ width: 58, height: 58, objectFit: 'contain', borderRadius: 8, background: 'white', flexShrink: 0, border: '1px solid var(--border)' }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{prod.brand}{prod.size ? ` · ${prod.size}` : ''}</div>
                          {matched.substitute
                            ? <div style={{ fontSize: 10, color: 'var(--orange)', fontWeight: 500, marginTop: 1 }}>↔ Substitute for {item.item}</div>
                            : (productPrefs[matched.key] && prod.upc && productPrefs[matched.key].chosen_upc === prod.upc)
                              ? <div style={{ fontSize: 10, color: 'var(--sage)', fontWeight: 500, marginTop: 1 }}>★ Your usual</div>
                              : matched.aiPicked && <div style={{ fontSize: 10, color: 'var(--plum3)', fontWeight: 500, marginTop: 1 }}>✦ AI matched</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {prod.promo_price ? (<><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--sage)' }}>${prod.promo_price.toFixed(2)}</div><div style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'line-through' }}>${prod.price?.toFixed(2)}</div></>) : prod.price ? <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>${prod.price.toFixed(2)}</div> : null}
                          {!prod.in_stock && <div style={{ fontSize: 10, color: 'var(--red)' }}>Out of stock</div>}
                        </div>
                      </div>
                    ) : null
                  })()}
                  {(() => {
                    // Only show real alternatives the AI deemed the same food. For
                    // no-match items we show all (closest results); for AI matches
                    // we show only the valid set, so no Mentos/Listerine for mint.
                    const swapIdx = (matched.validIndices && matched.validIndices.length > 0)
                      ? matched.validIndices
                      : matched.options.map((_, oi) => oi)
                    if (!(swapIdx.length > 1 || matched.noMatch)) return null
                    return (
                      <>
                        <div style={{ fontSize: 10, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{matched.noMatch ? 'Closest results · tap if one fits' : `Swap · ${swapIdx.length} option${swapIdx.length !== 1 ? 's' : ''}`}</div>
                        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                          {swapIdx.map(oi => {
                            const opt = matched.options[oi]
                            if (!opt) return null
                            return (
                              <button key={oi} onClick={() => { setMatchedProducts(mp => ({ ...mp, [i]: { ...mp[i], selected: oi, noMatch: false } })); saveProductPick(matched.key, opt) }}
                                style={{ flexShrink: 0, width: 96, background: !matched.noMatch && matched.selected === oi ? 'var(--plumL)' : 'var(--card)', border: `1px solid ${!matched.noMatch && matched.selected === oi ? 'var(--plum3)' : 'var(--border)'}`, borderRadius: 8, padding: 6, cursor: 'pointer', textAlign: 'center', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
                                {opt.image
                                  ? <img src={opt.image} alt={opt.name} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, background: 'white', display: 'block', margin: '0 auto 4px' }} />
                                  : <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--warm)', margin: '0 auto 4px' }} />}
                                <div style={{ fontSize: 10, fontWeight: 500, color: !matched.noMatch && matched.selected === oi ? 'var(--plum2)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.brand || opt.name.split(' ').slice(0, 2).join(' ')}</div>
                                <div style={{ fontSize: 10, color: !matched.noMatch && matched.selected === oi ? 'var(--plum3)' : 'var(--muted)' }}>{opt.promo_price ? `$${opt.promo_price.toFixed(2)}` : opt.price ? `$${opt.price.toFixed(2)}` : '—'}</div>
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
              {!matched && !matching && getSearchToken() && !checked[i] && (
                <div style={{ padding: '6px 14px 10px', background: 'var(--warm)', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>No match found</span>
                </div>
              )}
            </div>
          )
        })}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {store === 'kroger' && getSearchToken() && (<>
            {!matching && Object.keys(matchedProducts).length < shop.length && (
              <button className="btn-full" style={{ background: 'none', border: '1px solid var(--plum3)', color: 'var(--plum2)' }} onClick={matchAllProducts}>Re-match products</button>
            )}
            <button className="btn-full" onClick={placeKrogerOrder} disabled={placingOrder || matchedCount === 0}>
              {placingOrder ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><span className="spin" />Adding to cart...</span> : `Add to Kroger cart · ${matchedCount} items`}
            </button>
          </>)}
          {!krogerToken && <button className="btn-full" onClick={connectKroger}>Connect Kroger to place order</button>}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--muted2)', fontSize: 11, marginTop: 8 }}>{krogerToken && krogerStore ? `${krogerStore.name} · ${method}` : `Kroger · ${method}`}</p>
        {Object.keys(matchedProducts).length > 0 && (
          <button onClick={copyMatchReport} style={{ display: 'block', margin: '10px auto 0', background: 'none', border: 'none', color: 'var(--muted2)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
            Copy match report (for debugging)
          </button>
        )}
      </>)}
    </div>
  )
}
