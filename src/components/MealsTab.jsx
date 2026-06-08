import { useState, useEffect } from 'react'
import { supa } from '../lib/supabase.js'
import { streamClaude } from '../lib/claude.js'
import { CUISINES, MEAL_TYPES, MEAL_TYPE_LABELS } from '../constants.js'
import { FREE_GENERATION_LIMIT } from '../lib/purchases.js'
import Celebration from './Celebration.jsx'
import GeneratingSequence from './GeneratingSequence.jsx'

export default function MealsTab({ pantry, goals, macros, meal, setMeal, setShop, setTab, notify, session, isPaid, generationsUsed, onShowPaywall, onGenerate }) {
  const [view, setView] = useState('plan')
  const [phase, setPhase] = useState('prefs')
  const [showPrefs, setShowPrefs] = useState(false)
  const [cuisines, setCuisines] = useState(goals.meal_cuisines || [])
  const [mealPrefs, setMealPrefs] = useState(goals.meal_preferences || {})
  const [options, setOptions] = useState({})
  const [selected, setSelected] = useState({})
  const [stepIdx, setStepIdx] = useState(0)
  const [savedMeals, setSavedMeals] = useState([])
  const [thisWeek, setThisWeek] = useState([])
  const [loadingMeals, setLoadingMeals] = useState(false)
  const [activeRecipe, setActiveRecipe] = useState(null)
  const [historyFilter, setHistoryFilter] = useState('all')
  const [savedRatings, setSavedRatings] = useState([])
  const [reuseSelected, setReuseSelected] = useState([]) // saved-meal ids reused this week
  const [celebrate, setCelebrate] = useState(false)

  const toggleCuisine = c => setCuisines(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c])
  const toggleMealType = t => setMealPrefs(mp => { const n = { ...mp }; if (n[t]) delete n[t]; else n[t] = 1; return n })
  const setMealCount = (t, v) => setMealPrefs(mp => ({ ...mp, [t]: Math.max(1, Math.min(7, +v || 1)) }))

  const mealTypeKeys = Object.keys(mealPrefs)
  const typeKeyFor = label => MEAL_TYPE_LABELS[label] || label.toLowerCase().replace(/\s+/g, '_')
  // How many of each requested type are already filled by reused saved meals
  const reusedCountForType = label => {
    const key = typeKeyFor(label)
    return reuseSelected.filter(id => savedMeals.find(x => x.id === id)?.meal_type === key).length
  }
  const remainingForType = label => Math.max(0, (mealPrefs[label] || 0) - reusedCountForType(label))
  const totalRemaining = mealTypeKeys.reduce((s, t) => s + remainingForType(t), 0)
  // Only types still needing generation drive the picking steps
  const genTypeKeys = mealTypeKeys.filter(t => remainingForType(t) > 0)

  const currentTypeLabel = genTypeKeys[stepIdx] || ''
  const currentTypeKey = typeKeyFor(currentTypeLabel)
  const currentOptions = options[currentTypeKey] || []
  const currentSelected = selected[currentTypeKey] || []
  const neededCount = remainingForType(currentTypeLabel) || 1
  const isFull = currentSelected.length >= neededCount

  useEffect(() => {
    if (!session) return
    loadSavedMeals()
    loadRatings()
  }, [session])

  const loadSavedMeals = async () => {
    setLoadingMeals(true)
    const { data } = await supa.from('saved_meals').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    if (data) { setSavedMeals(data); setThisWeek(data.filter(m => m.this_week)) }
    setLoadingMeals(false)
  }

  const loadRatings = async () => {
    const { data } = await supa.from('meal_ratings').select('*').eq('user_id', session.user.id).limit(100)
    if (data) setSavedRatings(data)
  }

  const addToThisWeek = async mealId => {
    await supa.from('saved_meals').update({ this_week: true }).eq('id', mealId)
    const m = savedMeals.find(x => x.id === mealId)
    setSavedMeals(ms => ms.map(x => x.id === mealId ? { ...x, this_week: true } : x))
    const nextWeek = [...thisWeek, m].filter(Boolean)
    setThisWeek(nextWeek)
    buildShoppingList(nextWeek)
    notify('Added to this week')
  }

  const removeFromThisWeek = async mealId => {
    await supa.from('saved_meals').update({ this_week: false }).eq('id', mealId)
    setSavedMeals(ms => ms.map(m => m.id === mealId ? { ...m, this_week: false } : m))
    const nextWeek = thisWeek.filter(m => m.id !== mealId)
    setThisWeek(nextWeek)
    buildShoppingList(nextWeek)
    notify('Removed from this week')
  }

  const deleteSavedMeal = async mealId => {
    await supa.from('saved_meals').delete().eq('id', mealId)
    setSavedMeals(ms => ms.filter(m => m.id !== mealId))
    const nextWeek = thisWeek.filter(m => m.id !== mealId)
    setThisWeek(nextWeek)
    buildShoppingList(nextWeek)
    notify('Meal removed')
  }

  // Start a fresh week: clear current week's flags (meals stay in your library),
  // reset reuse picks, and open the planning flow.
  const startFreshWeek = async () => {
    if (thisWeek.length && session) {
      const ids = thisWeek.map(m => m.id)
      await supa.from('saved_meals').update({ this_week: false }).in('id', ids)
      setSavedMeals(ms => ms.map(m => ids.includes(m.id) ? { ...m, this_week: false } : m))
      setThisWeek([])
      setShop([])
    }
    setReuseSelected([])
    setView('generate'); setPhase('prefs'); setShowPrefs(true)
  }

  // Mark reused saved meals as this-week, returns the reused meal objects
  const commitReused = async () => {
    if (!reuseSelected.length || !session) return []
    await supa.from('saved_meals').update({ this_week: true }).in('id', reuseSelected)
    setSavedMeals(ms => ms.map(m => reuseSelected.includes(m.id) ? { ...m, this_week: true } : m))
    return savedMeals.filter(m => reuseSelected.includes(m.id))
  }

  const finishWeek = (reusedMeals, newMeals) => {
    const all = [...thisWeek, ...reusedMeals, ...newMeals]
    setThisWeek(all)
    buildShoppingList(all)
    setView('plan'); setPhase('prefs'); setOptions({}); setSelected({}); setStepIdx(0); setReuseSelected([])
    setCelebrate(true)
  }

  const saveSelectedMeals = async selections => {
    if (!session) return
    const { data: prof } = await supa.from('profiles').select('household_id').eq('id', session.user.id).maybeSingle()
    const toInsert = []
    Object.entries(selections).forEach(([typeKey, idxs]) => {
      const typeOpts = options[typeKey] || []
      idxs.forEach(idx => {
        const m = typeOpts[idx]
        if (m) toInsert.push({ user_id: session.user.id, household_id: prof?.household_id, name: m.name, meal_type: typeKey, description: m.description, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat, ingredients: m.ingredients || [], uses_pantry: m.uses_pantry || [], this_week: true })
      })
    })
    let inserted = []
    if (toInsert.length > 0) {
      const { data } = await supa.from('saved_meals').insert(toInsert).select()
      if (data) { inserted = data; setSavedMeals(ms => [...data, ...ms]) }
    }
    const reusedMeals = await commitReused()
    finishWeek(reusedMeals, inserted.length ? inserted : toInsert)
    notify(`${reusedMeals.length + (inserted.length || toInsert.length)} meals set for this week!`)
  }

  const buildShoppingList = meals => {
    const allIngredients = {}
    meals.forEach(m => {
      const ings = Array.isArray(m.ingredients) ? m.ingredients : []
      ings.forEach(ing => {
        const name = typeof ing === 'string' ? ing.replace(/^[\d./\s]+(cup|tbsp|tsp|oz|lb|g|kg|clove|cloves|slice|slices|can|cans|bunch|bunches|piece|pieces|medium|large|small)s?\s*/i, '').trim() : ing
        if (name) allIngredients[name.toLowerCase()] = (allIngredients[name.toLowerCase()] || 0) + 1
      })
    })
    // Common pantry staples nobody adds to a weekly pickup — skip them so the
    // list stays short and we don't waste a Kroger lookup on each.
    const STAPLES = /\b(salt|pepper|black pepper|kosher salt|sea salt|water|ice|cooking spray|nonstick spray|salt and pepper)\b/i
    const pantryNames = pantry.map(p => p.name.toLowerCase())
    const needed = Object.keys(allIngredients)
      .filter(item => !STAPLES.test(item))
      .filter(item => !pantryNames.some(p => p.includes(item) || item.includes(p)))
    const using = Object.keys(allIngredients).filter(item => pantryNames.some(p => p.includes(item) || item.includes(p)))
    if (using.length > 0) notify(`Using ${using.length} pantry item${using.length !== 1 ? 's' : ''} you already have`)
    setShop(needed.map(item => ({ item, quantity: 'as needed', reason: 'For your meals this week', priority: 'high' })))
  }

  const buildRatingContext = () => {
    if (savedRatings.length === 0) return ''
    const loved = savedRatings.filter(r => r.rating === 5).slice(0, 5).map(r => r.meal_name)
    const exclude = savedRatings.filter(r => r.rating <= 2).map(r => r.meal_name)
    const modify = savedRatings.filter(r => r.rating === 3).slice(0, 3).map(r => `${r.meal_name}${r.note ? ` (${r.note})` : ''}`)
    let ctx = ''
    if (loved.length > 0) ctx += `User loves meals like: ${loved.join(', ')} — suggest inspired variations. `
    if (modify.length > 0) ctx += `Improve these: ${modify.join(', ')}. `
    if (exclude.length > 0) ctx += `NEVER suggest: ${exclude.join(', ')}. `
    const recentNames = savedMeals.slice(0, 20).map(m => m.name)
    if (recentNames.length > 0) ctx += `Already in meal history (avoid repeating): ${recentNames.slice(0, 10).join(', ')}. `
    return ctx
  }

  const generate = async () => {
    if (mealTypeKeys.length === 0) { notify('Set meal preferences first', 'err'); return }
    // If reused saved meals already cover everything, skip generation entirely
    if (totalRemaining === 0) {
      const reusedMeals = await commitReused()
      finishWeek(reusedMeals, [])
      notify(`${reusedMeals.length} meals set for this week!`)
      return
    }
    // Paywall gate: free users capped at FREE_GENERATION_LIMIT per month
    if (!isPaid && generationsUsed >= FREE_GENERATION_LIMIT) { onShowPaywall(); return }
    setPhase('generating')
    const ps = pantry.map(i => { const d = i.expiry ? Math.ceil((i.expiry - Date.now()) / 864e5) : null; return `- ${i.name} (${i.qty} ${i.unit}${d !== null ? `, expires ${d}d` : ''})` }).join('\n')
    const cuisineStr = cuisines.length ? `Preferred cuisines: ${cuisines.join(', ')}.` : ''
    const ratingCtx = buildRatingContext()
    // Only generate the REMAINING count per type (after reuse)
    const optionsSpec = genTypeKeys.map(t => { const key = typeKeyFor(t); const count = Math.min(remainingForType(t) * 2, 10); return `"${key}": ${count} options` }).join(', ')
    const exKey = typeKeyFor(genTypeKeys[0] || mealTypeKeys[0]) || 'dinner'
    const sys = `You are a home cooking expert. Respond with ONLY raw JSON. No markdown, no backticks, no explanation.\nStructure: {"options":{"${exKey}":[{"name":"...","description":"...","uses_pantry":["..."],"calories":500,"protein":35,"carbs":55,"fat":15,"ingredients":["1 cup white rice","2 boneless skinless chicken breasts"]}]}}\nRules: suggest FAMILIAR, PRACTICAL home meals that real families actually cook — like "Chicken Stir Fry", "Beef Tacos", "Pasta Bolognese", "Grilled Salmon", "Chicken Soup". Avoid exotic or unusual combinations. Names under 5 words, descriptions under 10 words, 4-8 common grocery ingredients per meal.\nCRITICAL — ingredient naming for grocery matching: write each ingredient as the EXACT phrase a shopper would type into a grocery search, specific enough that one obvious product comes back. Whenever a generic word maps to many different products, specify the variety, cut, or type. Examples of the rule (apply the same logic to every ingredient): "unsalted butter" not "butter"; "yellow onion" not "onion"; "boneless skinless chicken breast" not "chicken"; "whole milk" not "milk"; "extra virgin olive oil" not "oil"; "granulated sugar" not "sugar"; "all-purpose flour" not "flour"; "roma tomato" not "tomato"; "russet potato" not "potato"; "low-sodium chicken broth" not "broth"; "sharp cheddar cheese" not "cheese". Keep the quantity in the string (e.g. "2 tbsp unsalted butter").`
    const usr = `Generate meal options. Household: ${goals.householdSize}. Calorie target: ${macros.calories}/day. Goal: ${goals.goalType}. Diet: ${goals.diet}. Allergies: ${goals.allergies.join(',') || 'none'}. ${cuisineStr} ${ratingCtx}\nGenerate: ${optionsSpec}.\nPantry (prioritize expiring): ${ps.split('\n').slice(0, 8).join(', ')}.`
    let full = ''
    try {
      await streamClaude(sys, usr, c => { full += c })
      const cleaned = full.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setOptions(parsed.options || {}); setSelected({}); setStepIdx(0); setPhase('picking')
      if (onGenerate) onGenerate() // increment counter after successful generation
    } catch (e) {
      notify('Generation failed — try again', 'err'); console.error(e, full); setPhase('prefs')
    }
  }

  const toggleOption = (typeKey, idx) => {
    setSelected(s => {
      const cur = s[typeKey] || []
      const typeLabel = Object.keys(MEAL_TYPE_LABELS).find(k => MEAL_TYPE_LABELS[k] === typeKey) || typeKey
      const needed = remainingForType(typeLabel) || 1
      if (cur.includes(idx)) return { ...s, [typeKey]: cur.filter(i => i !== idx) }
      if (cur.length < needed) return { ...s, [typeKey]: [...cur, idx] }
      return s
    })
  }

  // Reuse step: toggle a saved meal in/out of this week's reuse set
  const toggleReuse = id => setReuseSelected(rs => rs.includes(id) ? rs.filter(x => x !== id) : [...rs, id])

  const advanceStep = () => {
    if (stepIdx < genTypeKeys.length - 1) setStepIdx(s => s + 1)
    else saveSelectedMeals(selected)
  }

  const generateRecipe = async mealItem => {
    if (mealItem.recipe) { setActiveRecipe({ ...mealItem, ...mealItem.recipe, loading: false }); setView('recipe'); return }
    setActiveRecipe({ ...mealItem, loading: true }); setView('recipe')
    const sys = `You are a chef. Respond with ONLY raw JSON. No markdown. Structure: {"title":"...","servings":4,"prep_time":"15 min","cook_time":"30 min","ingredients":[{"amount":"1 cup","name":"white rice"}],"steps":["Step 1: ..."]}\nIngredient "name" must be grocery-specific (the exact phrase a shopper searches): specify variety/cut/type for anything generic — "unsalted butter" not "butter", "yellow onion" not "onion", "boneless skinless chicken breast" not "chicken", "whole milk" not "milk", "extra virgin olive oil" not "oil", "roma tomato" not "tomato". Put only the measurement in "amount".`
    const usr = `Complete recipe for "${mealItem.name}" (${(mealItem.meal_type || '').replace(/_/g, ' ')}). Serves ${goals.householdSize}. Diet: ${goals.diet}. Known ingredients: ${(Array.isArray(mealItem.ingredients) ? mealItem.ingredients : []).join(', ') || 'standard'}.`
    let full = ''
    try {
      await streamClaude(sys, usr, c => { full += c })
      const recipe = JSON.parse(full.replace(/```json/g, '').replace(/```/g, '').trim())
      setActiveRecipe({ ...mealItem, ...recipe, loading: false })
      if (mealItem.id) {
        await supa.from('saved_meals').update({ recipe, times_made: (mealItem.times_made || 0) + 1, last_made: new Date().toISOString().split('T')[0] }).eq('id', mealItem.id)
        setSavedMeals(ms => ms.map(m => m.id === mealItem.id ? { ...m, recipe, times_made: (m.times_made || 0) + 1 } : m))
        setThisWeek(tw => tw.map(m => m.id === mealItem.id ? { ...m, recipe, times_made: (m.times_made || 0) + 1 } : m))
      }
    } catch (e) { notify('Recipe failed — try again', 'err'); setView('plan') }
  }

  const rateFromRecipe = async rating => {
    if (!activeRecipe || !session) return
    const { data: prof } = await supa.from('profiles').select('household_id').eq('id', session.user.id).maybeSingle()
    await supa.from('meal_ratings').delete().eq('user_id', session.user.id).eq('meal_name', activeRecipe.name).eq('meal_type', activeRecipe.meal_type || '')
    await supa.from('meal_ratings').insert({ user_id: session.user.id, household_id: prof?.household_id, meal_name: activeRecipe.name, meal_type: activeRecipe.meal_type || '', rating, never_again: rating <= 2 })
    if (activeRecipe.id) await supa.from('saved_meals').update({ rating }).eq('id', activeRecipe.id)
    setActiveRecipe(r => ({ ...r, rating }))
    notify(rating >= 4 ? 'Glad you loved it!' : 'Got it — noted for next time')
    loadRatings()
  }

  const hasMealPrefs = Object.keys(mealPrefs).length > 0
  const allTypesDone = genTypeKeys.every(t => { const key = typeKeyFor(t); return (selected[key] || []).length >= remainingForType(t) })

  if (view === 'recipe' && activeRecipe) {
    if (activeRecipe.loading) return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <span className="spin" style={{ width: 28, height: 28, borderWidth: 3, borderTopColor: 'var(--plum)', borderColor: 'var(--plum3)44' }} />
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, color: 'var(--plum)' }}>Writing your recipe...</div>
      </div>
    )
    return (
      <div className="page">
        <button className="btn-sm" style={{ marginBottom: 16 }} onClick={() => setView('plan')}>Back to plan</button>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 30, fontWeight: 600, color: 'var(--plum)', marginBottom: 4 }}>{activeRecipe.title || activeRecipe.name}</div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', marginBottom: 20, flexWrap: 'wrap' }}>
          {activeRecipe.servings && <span>Serves {activeRecipe.servings}</span>}
          {activeRecipe.prep_time && <span>Prep: {activeRecipe.prep_time}</span>}
          {activeRecipe.cook_time && <span>Cook: {activeRecipe.cook_time}</span>}
          <span style={{ color: 'var(--rose)', textTransform: 'capitalize' }}>{(activeRecipe.meal_type || '').replace(/_/g, ' ')}</span>
        </div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">Ingredients</div>
          {(activeRecipe.ingredients || []).map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ fontWeight: 500, color: 'var(--plum2)', minWidth: 80, flexShrink: 0 }}>{ing.amount}</span>
              <span style={{ color: 'var(--text)' }}>{ing.name}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">Instructions</div>
          {(activeRecipe.steps || []).map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--plumL)', border: '1px solid var(--plum3)44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--plum2)', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, flex: 1 }}>{step}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">How was it?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['Never again', 1], ['Meh', 2], ['OK', 3], ['Good', 4], ['Loved it', 5]].map(([label, r]) => (
              <button key={r} onClick={() => rateFromRecipe(r)}
                style={{ flex: 1, background: activeRecipe.rating === r ? 'var(--plumL)' : 'var(--warm)', border: `1px solid ${activeRecipe.rating === r ? 'var(--plum3)' : 'var(--border)'}`, borderRadius: 10, padding: '8px 4px', fontSize: 11, color: activeRecipe.rating === r ? 'var(--plum2)' : 'var(--muted)', fontWeight: activeRecipe.rating === r ? 500 : 400, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", transition: 'all .15s' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (view === 'generate' && phase === 'picking') {
    return (
      <div className="page">
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {genTypeKeys.map((t, i) => { const key = typeKeyFor(t); const done = (selected[key] || []).length >= remainingForType(t); return <div key={t} style={{ flex: 1, height: 3, borderRadius: 3, background: done ? 'var(--sage)' : i === stepIdx ? 'var(--plum2)' : 'var(--border)', transition: 'background .3s' }} /> })}
        </div>
        <div className="step-header">
          {stepIdx > 0 && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 22, padding: 0 }} onClick={() => setStepIdx(s => s - 1)}>←</button>}
          <div style={{ flex: 1 }}>
            <div className="step-counter">Step {stepIdx + 1} of {genTypeKeys.length}</div>
            <div className="step-title">Pick your {currentTypeLabel.toLowerCase()}s</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className={`sel-counter${isFull ? ' full' : ''}`}>{currentSelected.length} of {neededCount} selected{isFull ? ' ✓' : ''}</div>
          {isFull && <button className="btn-sm" onClick={advanceStep}>{stepIdx < genTypeKeys.length - 1 ? 'Next →' : 'Save to my meals →'}</button>}
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, marginBottom: 8 }}>
          {currentOptions.map((opt, idx) => {
            const isSelected = currentSelected.includes(idx), isDisabled = !isSelected && isFull
            return (
              <div key={idx} className={`opt-card${isSelected ? ' on' : ''}${isDisabled ? ' done' : ''}`} onClick={() => !isDisabled && toggleOption(currentTypeKey, idx)}>
                {opt.uses_pantry?.length > 0 && <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Uses pantry</div>}
                <div className="opt-card-name">{opt.name}</div>
                <div className="opt-card-desc">{opt.description}</div>
                <div className="opt-macros">{[`${opt.calories} cal`, `P ${opt.protein}g`, `C ${opt.carbs}g`, `F ${opt.fat}g`].map(t => <span key={t} className="opt-macro">{t}</span>)}</div>
                {opt.uses_pantry?.length > 0 && <div className="opt-pantry">Uses: {opt.uses_pantry.slice(0, 3).join(', ')}</div>}
                {isSelected && <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--plum2)', fontSize: 12, fontWeight: 500 }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--plum2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white' }}>✓</div>Selected</div>}
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted2)', textAlign: 'center', marginBottom: 16 }}>Scroll to see all · Select {neededCount} to continue</p>
        {allTypesDone && <button className="btn-full" onClick={() => saveSelectedMeals(selected)}>Save to my meals →</button>}
        <button className="btn-ghost" onClick={() => { setView('plan'); setPhase('prefs') }}>Cancel</button>
      </div>
    )
  }

  if (view === 'generate' && phase === 'generating') {
    return <GeneratingSequence />
  }

  if (view === 'history') {
    const types = ['all', ...new Set(savedMeals.map(m => m.meal_type).filter(Boolean))]
    const filtered = savedMeals.filter(m => historyFilter === 'all' || m.meal_type === historyFilter)
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20 }} onClick={() => setView('plan')}>←</button>
          <div><div className="page-label">Library</div><h1 className="page-title" style={{ marginBottom: 0 }}>Meal history</h1></div>
        </div>
        <div className="chips" style={{ marginBottom: 16 }}>
          {types.map(t => <button key={t} className={`chip${historyFilter === t ? ' on' : ''}`} onClick={() => setHistoryFilter(t)}>{t === 'all' ? 'All' : t.replace(/_/g, ' ')}</button>)}
        </div>
        {filtered.length === 0 ? (
          <div className="empty"><div style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>🍽</div><p>No saved meals yet. Generate your first plan to build your library.</p></div>
        ) : filtered.map(m => (
          <div key={m.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--rose)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{(m.meal_type || '').replace(/_/g, ' ')}</div>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 17, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{m.calories} cal · P {m.protein}g · C {m.carbs}g · F {m.fat}g</div>
              {m.times_made > 0 && <div style={{ fontSize: 11, color: 'var(--muted2)' }}>Made {m.times_made}x{m.last_made ? ` · last ${m.last_made}` : ''}</div>}
              {m.rating && <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2 }}>{'★'.repeat(m.rating)}{'☆'.repeat(5 - m.rating)}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              {m.this_week ? <button className="btn-sm" style={{ background: 'var(--sageL)', borderColor: 'var(--sage)55', color: 'var(--sage)' }} onClick={() => removeFromThisWeek(m.id)}>This week ✓</button> : <button className="btn-sm" onClick={() => addToThisWeek(m.id)}>Add to week</button>}
              <button className="btn-sm" style={{ background: 'none', borderColor: 'var(--border)' }} onClick={() => generateRecipe(m)}>Recipe</button>
              <button onClick={() => deleteSavedMeal(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--muted2)', padding: '4px 0' }}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (view === 'generate' && phase === 'prefs') {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20 }} onClick={() => setView('plan')}>←</button>
          <div><div className="page-label">New meals</div><h1 className="page-title" style={{ marginBottom: 0 }}>Generate options</h1></div>
        </div>
        {savedRatings.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--sageL)', borderRadius: 10, marginBottom: 12, fontSize: 12, color: 'var(--sage)' }}><span>★</span><span>Using {savedRatings.length} ratings to personalize your options</span></div>}
        <div className="card" style={{ marginBottom: 14 }}>
          <button style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans',system-ui,sans-serif" }} onClick={() => setShowPrefs(!showPrefs)}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--plum)', textAlign: 'left' }}>Meal preferences</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, textAlign: 'left' }}>{hasMealPrefs ? Object.entries(mealPrefs).map(([k, v]) => `${v}x ${k}`).join(' · ') : 'Tap to set'}{cuisines.length > 0 && ` · ${cuisines.slice(0, 2).join(', ')}${cuisines.length > 2 ? ' +more' : ''}`}</div>
            </div>
            <span style={{ fontSize: 14, color: 'var(--muted2)' }}>{showPrefs ? '▾' : '›'}</span>
          </button>
          {showPrefs && (
            <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Cuisine preferences</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>{CUISINES.map(c => <button key={c} className={`chip${cuisines.includes(c) ? ' on' : ''}`} onClick={() => toggleCuisine(c)}>{c}</button>)}</div>
              <div className="section-label" style={{ marginBottom: 8 }}>What do you need this week?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {MEAL_TYPES.map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className={`chip${mealPrefs[t] ? ' on' : ''}`} style={{ flex: 1, textAlign: 'left', borderRadius: 10 }} onClick={() => toggleMealType(t)}>{t}</button>
                    {mealPrefs[t] && <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button className="qty-btn" style={{ width: 30, height: 30, fontSize: 16 }} onClick={() => setMealCount(t, mealPrefs[t] - 1)}>-</button>
                      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--plum)', minWidth: 20, textAlign: 'center' }}>{mealPrefs[t]}</span>
                      <button className="qty-btn" style={{ width: 30, height: 30, fontSize: 16 }} onClick={() => setMealCount(t, mealPrefs[t] + 1)}>+</button>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>needed</span>
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {!isPaid && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8, fontSize: 12, color: generationsUsed >= FREE_GENERATION_LIMIT ? 'var(--red)' : 'var(--muted)' }}>
            <span>{generationsUsed}/{FREE_GENERATION_LIMIT} free plans used this month</span>
            {generationsUsed >= FREE_GENERATION_LIMIT && <span style={{ color: 'var(--plum2)', fontWeight: 500, cursor: 'pointer' }} onClick={onShowPaywall}>Upgrade →</span>}
          </div>
        )}
        <button className="btn-generate" onClick={() => { setReuseSelected([]); setPhase('reuse') }} disabled={!hasMealPrefs}>
          Next: reuse your saved meals →
        </button>
        {!hasMealPrefs && <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>Set preferences above to get started</p>}
      </div>
    )
  }

  // ── REUSE SAVED MEALS VIEW (step 2 of the weekly flow) ──
  if (view === 'generate' && phase === 'reuse') {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20 }} onClick={() => setPhase('prefs')}>←</button>
          <div><div className="page-label">Step 2 of 3</div><h1 className="page-title" style={{ marginBottom: 0 }}>Reuse saved meals</h1></div>
        </div>
        <p className="page-sub">Fill this week from meals you've saved. We'll only generate what's left.</p>
        {savedMeals.length === 0 && <div style={{ background: 'var(--plumLL)', border: '1px solid var(--plum3)22', borderRadius: 12, padding: 14, fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>No saved meals yet — your first generated meals will land here for reuse next week.</div>}
        {mealTypeKeys.map(label => {
          const key = typeKeyFor(label)
          const pool = savedMeals.filter(m => m.meal_type === key)
          const filled = reusedCountForType(label)
          const needed = mealPrefs[label] || 0
          if (pool.length === 0) return null
          return (
            <div key={label} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--plum)' }}>{label}</div>
                <div style={{ fontSize: 12, color: filled >= needed ? 'var(--sage)' : 'var(--muted)' }}>{filled} of {needed} filled</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pool.map(m => {
                  const on = reuseSelected.includes(m.id)
                  const blocked = !on && filled >= needed
                  return (
                    <button key={m.id} disabled={blocked} onClick={() => toggleReuse(m.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, background: on ? 'var(--plumLL)' : 'var(--card)', border: `1px solid ${on ? 'var(--plum3)' : 'var(--border)'}`, borderRadius: 12, padding: '10px 12px', cursor: blocked ? 'not-allowed' : 'pointer', opacity: blocked ? 0.4 : 1, textAlign: 'left', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${on ? 'var(--plum2)' : 'var(--border2)'}`, background: on ? 'var(--plum2)' : 'transparent', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on ? '✓' : ''}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.calories} cal · P {m.protein}g{m.rating ? ` · ${'★'.repeat(m.rating)}` : ''}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        <div style={{ position: 'sticky', bottom: 84, background: 'linear-gradient(transparent, var(--cream) 24%)', paddingTop: 12 }}>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
            Reusing {reuseSelected.length} · generating {totalRemaining} more
          </div>
          <button className="btn-generate" style={{ marginBottom: 0 }} onClick={generate} disabled={!hasMealPrefs}>
            {totalRemaining === 0 ? 'Finish week — all reused →' : (!isPaid && generationsUsed >= FREE_GENERATION_LIMIT ? '🔒 Upgrade to generate' : `Generate ${totalRemaining} new meal${totalRemaining !== 1 ? 's' : ''} →`)}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {celebrate && <Celebration message="Your week is planned! 🌸" onDone={() => setCelebrate(false)} />}
      <div className="page-label">AI Planner</div>
      <h1 className="page-title">This week's meals</h1>
      {thisWeek.length > 0 ? (<>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{thisWeek.length} meal{thisWeek.length !== 1 ? 's' : ''} planned</div>
          <button className="btn-sm" onClick={() => { buildShoppingList(thisWeek); setTab('shop') }}>Order ingredients</button>
        </div>
        {thisWeek.map(m => (
          <div key={m.id} className="plan-meal-card" style={{ cursor: 'pointer' }} onClick={() => generateRecipe(m)}>
            <div className="plan-meal-icon">{(m.meal_type || 'meal').replace(/_/g, ' ').split(' ').map(w => w[0] || '').join('').toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--rose)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{(m.meal_type || '').replace(/_/g, ' ')}</div>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 17, fontWeight: 500, color: 'var(--text)' }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.calories} cal · P {m.protein}g · C {m.carbs}g</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--plum3)' }}>Recipe →</span>
              <button onClick={e => { e.stopPropagation(); removeFromThisWeek(m.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--muted2)' }}>Remove</button>
            </div>
          </div>
        ))}
        <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
      </>) : (
        <div style={{ background: 'var(--plumLL)', border: '1px solid var(--plum3)22', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, color: 'var(--plum)', marginBottom: 6 }}>No meals planned yet</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Generate new options or add meals from your history</div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <button className="btn-full" onClick={startFreshWeek}>
          {thisWeek.length > 0 ? 'Plan a fresh week →' : 'Plan this week →'}
        </button>
        {thisWeek.length > 0 && (
          <button className="btn-sm" style={{ width: '100%', textAlign: 'center', padding: 11 }} onClick={() => { setReuseSelected([]); setView('generate'); setPhase('prefs'); setShowPrefs(true) }}>
            + Add more meals to this week
          </button>
        )}
      </div>
      {thisWeek.length > 0 && <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted2)', marginTop: -8, marginBottom: 14 }}>Planning fresh clears this week (meals stay in your library)</p>}
      <button className="btn-sm" style={{ width: '100%', textAlign: 'center', padding: 12 }} onClick={() => setView('history')}>Browse meal history ({savedMeals.length} saved)</button>
    </div>
  )
}
