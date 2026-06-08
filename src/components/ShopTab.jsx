import { useState, useEffect } from 'react'
import { krogerApi } from '../lib/kroger.js'
import { cleanIngredient } from '../lib/ingredients.js'
import { I } from './Icons.jsx'

export default function ShopTab({ shop, notify, session, preferredStore }) {
  const [store, setStore] = useState(preferredStore || 'kroger')
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

  const matchAllProducts = async () => {
    const token = getSearchToken()
    if (!token || shop.length === 0) return
    setMatching(true)
    const results = {}
    for (let i = 0; i < shop.length; i += 3) {
      const batch = shop.slice(i, i + 3)
      await Promise.all(batch.map(async (item, idx) => {
        try {
          const data = await krogerApi('search_products', {
            access_token: token,
            query: cleanIngredient(item.item),
            location_id: krogerStore?.id,
          })
          if (data.products?.length > 0) {
            results[i + idx] = { selected: 0, options: data.products.slice(0, 3) }
          }
        } catch (e) { console.error('Match error for', item.item, e) }
      }))
      if (i + 3 < shop.length) await new Promise(r => setTimeout(r, 300))
    }
    setMatchedProducts(results)
    setMatching(false)
  }

  const placeKrogerOrder = async () => {
    if (!krogerToken) { notify('Connect Kroger first', 'err'); return }
    setPlacingOrder(true)
    try {
      const items = shop.map((item, i) => {
        const m = matchedProducts[i]
        if (!m) return null
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

  const totalEstimate = shop.reduce((sum, _, i) => {
    const m = matchedProducts[i]; const p = m?.options?.[m.selected]
    return sum + (p?.promo_price || p?.price || 0)
  }, 0)

  if (ordered) return (
    <div className="page">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', textAlign: 'center' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 20 }}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, color: 'var(--plum)', marginBottom: 8 }}>Added to your cart!</div>
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

      <div style={{ marginBottom: 14 }}>
        <div className="section-label">Choose store</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['kroger','Kroger'],['instacart','Instacart'],['walmart','Walmart'],['whole_foods','Whole Foods']].map(([k, l]) => (
            <button key={k} className={`store-btn${store === k ? ' on' : ''}`} onClick={() => setStore(k)}>{l}</button>
          ))}
        </div>
      </div>

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
        <div className="empty"><div className="empty-icon">{I.shop('#b0a0be')}</div><p>Generate a meal plan first to build your shopping list.</p></div>
      ) : (<>
        <div className="seg">
          <button className={`seg-btn${method === 'pickup' ? ' on' : ''}`} onClick={() => setMethod('pickup')}>Pickup</button>
          <button className={`seg-btn${method === 'delivery' ? ' on' : ''}`} onClick={() => setMethod('delivery')}>Delivery</button>
        </div>
        <div className="shop-summary">
          <div className="sum-cell"><div className="sum-val">{shop.length}</div><div className="sum-lbl">items</div></div>
          <div className="sum-cell"><div className="sum-val" style={{ color: 'var(--red)' }}>{shop.filter(i => i.priority === 'high').length}</div><div className="sum-lbl">urgent</div></div>
          <div className="sum-cell"><div className="sum-val" style={{ color: 'var(--sage)' }}>{Object.keys(matchedProducts).length}</div><div className="sum-lbl">matched</div></div>
          <div className="sum-cell"><div className="sum-val" style={{ color: 'var(--plum)', fontSize: totalEstimate > 0 ? 18 : 22 }}>{totalEstimate > 0 ? `$${totalEstimate.toFixed(2)}` : '-'}</div><div className="sum-lbl">est. total</div></div>
        </div>
        {matching && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--plumLL)', borderRadius: 12, marginBottom: 12, fontSize: 13, color: 'var(--plum)' }}>
            <span className="spin" style={{ borderTopColor: 'var(--plum)', borderColor: 'var(--plum3)44' }} />
            Matching items to Kroger products...
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
                <div style={{ background: 'var(--warm)', borderTop: '1px solid var(--border)', padding: '8px 14px 10px' }}>
                  {(() => {
                    const prod = matched.options[matched.selected]
                    return prod ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        {prod.image && <img src={prod.image} alt={prod.name} style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 6, background: 'white', flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{prod.brand}{prod.size ? ` · ${prod.size}` : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {prod.promo_price ? (<><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--sage)' }}>${prod.promo_price.toFixed(2)}</div><div style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'line-through' }}>${prod.price?.toFixed(2)}</div></>) : prod.price ? <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>${prod.price.toFixed(2)}</div> : null}
                          {!prod.in_stock && <div style={{ fontSize: 10, color: 'var(--red)' }}>Out of stock</div>}
                        </div>
                      </div>
                    ) : null
                  })()}
                  {matched.options.length > 1 && (
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                      {matched.options.map((opt, oi) => (
                        <button key={oi} onClick={() => setMatchedProducts(mp => ({ ...mp, [i]: { ...mp[i], selected: oi } }))}
                          style={{ flexShrink: 0, background: matched.selected === oi ? 'var(--plumL)' : 'var(--card)', border: `1px solid ${matched.selected === oi ? 'var(--plum3)' : 'var(--border)'}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
                          <div style={{ fontSize: 10, fontWeight: 500, color: matched.selected === oi ? 'var(--plum2)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{opt.name.split(' ').slice(0, 3).join(' ')}</div>
                          <div style={{ fontSize: 10, color: matched.selected === oi ? 'var(--plum3)' : 'var(--muted)' }}>{opt.promo_price ? `$${opt.promo_price.toFixed(2)}` : opt.price ? `$${opt.price.toFixed(2)}` : '—'}</div>
                        </button>
                      ))}
                    </div>
                  )}
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
            <button className="btn-full" onClick={placeKrogerOrder} disabled={placingOrder || Object.keys(matchedProducts).length === 0}>
              {placingOrder ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><span className="spin" />Adding to cart...</span> : `Add to Kroger cart · ${Object.keys(matchedProducts).length} items`}
            </button>
          </>)}
          {store === 'kroger' && !krogerToken && <button className="btn-full" onClick={connectKroger}>Connect Kroger to place order</button>}
          {store !== 'kroger' && <button className="btn-full" onClick={() => setOrd(true)} disabled={unc.length === 0}>Place order · {unc.length} item{unc.length !== 1 ? 's' : ''}</button>}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--muted2)', fontSize: 11, marginTop: 8 }}>{store === 'kroger' && krogerToken && krogerStore ? `${krogerStore.name} · ${method}` : `${store} · ${method}`}</p>
      </>)}
    </div>
  )
}
