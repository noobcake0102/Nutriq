import { useState, useEffect, useRef } from 'react'
import { supa } from '../lib/supabase.js'
import { streamClaude } from '../lib/claude.js'
import { CUISINES, MEAL_TYPES, MEAL_TYPE_LABELS } from '../constants.js'
import { FREE_GENERATION_LIMIT } from '../lib/purchases.js'
import Celebration from './Celebration.jsx'
import GeneratingSequence from './GeneratingSequence.jsx'
import EmptyState from './EmptyState.jsx'
import { logError } from '../lib/sentry.js'
import { buildRecipePdf } from '../lib/recipePdf.js'
import { shareRecipePdf } from '../lib/share.js'
import { NUTRIQ_FAVORITES } from '../data/nutriqFavorites.js'

export default function MealsTab({ pantry, goals, macros, meal, setMeal, setShop, setTab, notify, session, isPaid, generationsUsed, onShowPaywall, onGenerate, onWeekChange }) {
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
  const [sharing, setSharing] = useState(false)
  const [historyRating, setHistoryRating] = useState('all') // all | 5 | 4 | unrated
  const [cookbookTab, setCookbookTab] = useState('mine') // 'mine' | 'favorites'
  const [addingFav, setAddingFav] = useState(null) // id of favorite being saved
  const [cookbookSearch, setCookbookSearch] = useState('') // search cookbook by name/ingredient
  const [cookForm, setCookForm] = useState({ name: '', meal_type: 'dinner', servings: '', ingredients: '', steps: '', calories: '', protein: '', carbs: '', fat: '' })
  const [savingCustom, setSavingCustom] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importSource, setImportSource] = useState(null) // source URL when prefilled from a link

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

  // Keep the Home dashboard in sync with this week's plan. Skip the initial
  // mount (thisWeek is still empty then) so we don't clobber App's loaded value.
  const didMountWeek = useRef(false)
  useEffect(() => {
    if (!didMountWeek.current) { didMountWeek.current = true; return }
    onWeekChange?.(thisWeek)
  }, [thisWeek])

  const loadSavedMeals = async () => {
    setLoadingMeals(true)
    const { data } = await supa.from('saved_meals').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    if (data) {
      const kept = await pruneStaleMeals(data)
      setSavedMeals(kept); setThisWeek(kept.filter(m => m.this_week))
    }
    setLoadingMeals(false)
  }

  // Auto-cleanup: delete AI-generated meals that are unrated, never cooked, not
  // on this week's plan, and older than 60 days. Recipes the user intentionally
  // added (custom, import, Nutriq favorites) are NEVER touched. Explained in the
  // tutorial so users know unrated, unused generated meals expire.
  const pruneStaleMeals = async (meals) => {
    const SIXTY_DAYS_MS = 60 * 864e5
    const cutoff = Date.now() - SIXTY_DAYS_MS
    const isStale = m => {
      if (m.source) return false            // custom / import / nutriq_favorite — keep
      if (m.this_week) return false           // on the current plan — keep
      if (m.rating) return false              // rated — keep
      if (m.times_made > 0) return false       // cooked at least once — keep
      const created = m.created_at ? new Date(m.created_at).getTime() : Date.now()
      return created < cutoff                  // older than 60 days — prune
    }
    const staleIds = meals.filter(isStale).map(m => m.id)
    if (staleIds.length === 0) return meals
    try {
      await supa.from('saved_meals').delete().in('id', staleIds)
    } catch (e) { logError(e, { where: 'pruneStaleMeals', count: staleIds.length }) }
    return meals.filter(m => !staleIds.includes(m.id))
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
    const sys = `You are a home cooking expert. Respond with ONLY raw JSON. No markdown, no backticks, no explanation.\nStructure: {"options":{"${exKey}":[{"name":"...","description":"...","uses_pantry":["..."],"calories":500,"protein":35,"carbs":55,"fat":15,"ingredients":["1 cup white rice","2 boneless skinless chicken breasts"]}]}}\nRules: suggest FAMILIAR, PRACTICAL home meals that real families actually cook — like "Chicken Stir Fry", "Beef Tacos", "Pasta Bolognese", "Grilled Salmon", "Chicken Soup". Avoid exotic or unusual combinations. Names under 5 words. The DESCRIPTION should read like a tempting restaurant menu blurb — make the reader hungry by evoking the flavor, texture, or finish that makes it crave-worthy (8–14 words). e.g. not "Chicken with rice and vegetables" but "Juicy seared chicken in a garlicky lemon-butter sauce over fluffy rice." Use vivid, sensory words (crispy, golden, smoky, silky, charred, bright) but stay honest to a simple home meal. 4-8 common grocery ingredients per meal.\nCRITICAL — ingredient naming for grocery matching: write each ingredient as the EXACT phrase a shopper would type into a grocery search, specific enough that one obvious product comes back. Whenever a generic word maps to many different products, specify the variety, cut, or type. Examples of the rule (apply the same logic to every ingredient): "unsalted butter" not "butter"; "yellow onion" not "onion"; "boneless skinless chicken breast" not "chicken"; "whole milk" not "milk"; "extra virgin olive oil" not "oil"; "granulated sugar" not "sugar"; "all-purpose flour" not "flour"; "roma tomato" not "tomato"; "russet potato" not "potato"; "low-sodium chicken broth" not "broth"; "sharp cheddar cheese" not "cheese"; "fresh dill" not "dill"; "fresh cilantro" not "cilantro"; "ground cumin" not "cumin"; "ground cinnamon" not "cinnamon". Herbs get "fresh", ground spices get "ground". Keep the quantity in the string (e.g. "2 tbsp unsalted butter").\nAVAILABILITY — every ingredient must be something reliably stocked at a standard US supermarket (Kroger, Walmart, Safeway). Do NOT use specialty items many stores don't carry — e.g. ghee, gochujang, fresh curry leaves, tamarind paste, miso, harissa, sumac, za'atar, fresh lemongrass. If a cuisine would normally call for one, substitute a common equivalent a typical shopper can actually buy (e.g. unsalted butter instead of ghee, sriracha instead of gochujang).`
    const usr = `Generate meal options. Household: ${goals.householdSize}. Calorie target: ${macros.calories}/day. Goal: ${goals.goalType}. Diet: ${goals.diet}. Allergies: ${goals.allergies.join(',') || 'none'}. ${cuisineStr} ${ratingCtx}\nGenerate: ${optionsSpec}.\nPantry (prioritize expiring): ${ps.split('\n').slice(0, 8).join(', ')}.`
    let full = ''
    try {
      await streamClaude(sys, usr, c => { full += c }, 'sonnet')
      const cleaned = full.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setOptions(parsed.options || {}); setSelected({}); setStepIdx(0); setPhase('picking')
      if (onGenerate) onGenerate() // increment counter after successful generation
    } catch (e) {
      notify('Generation failed — try again', 'err'); logError(e, { where: 'generate', raw: full.slice(0, 400) }); setPhase('prefs')
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
    const servings = goals.householdSize || 4
    const sys = `You are an award-winning chef writing a recipe a home cook can absolutely nail on the first try. Respond with ONLY raw JSON, no markdown. Structure: {"title":"...","servings":${servings},"prep_time":"15 min","cook_time":"30 min","ingredients":[{"amount":"1 lb","name":"boneless skinless chicken breast"}],"steps":["..."],"tip":"..."}

Make it genuinely DELICIOUS and reliable — restaurant quality, home-cook simple:
- Season properly and SAY SO: call out salt and black pepper amounts and exactly WHEN to add them. Build real flavor — sear proteins for deep color before simmering, sauté aromatics (onion/garlic) until soft, deglaze the pan, and finish with a brightener (a squeeze of lemon, a pat of butter, fresh herbs) where it fits the dish.
- Give exact technique with sensory cues: temperatures in °F, real times, and how to KNOW it's done — e.g. "sear 4–5 min per side until deep golden", "cook to an internal temp of 165°F", "simmer 12–15 min until the sauce coats the back of a spoon", "sauté until the onions turn translucent". Never write a vague "cook until done".
- 6–10 clear steps. Each step is one focused action, in order. Include resting/standing time for meats.
- Scale every ingredient amount precisely to ${servings} servings.
- "tip": ONE chef's secret that elevates THIS specific dish — a make-ahead note, the #1 mistake to avoid, or a finishing touch that makes people ask for the recipe.

Ingredient "name" must be grocery-specific (the exact phrase a shopper searches): "unsalted butter" not "butter", "yellow onion" not "onion", "boneless skinless chicken breast" not "chicken", "extra virgin olive oil" not "oil", "kosher salt", "freshly ground black pepper". Put only the measurement in "amount".`
    const usr = `Write the full recipe for "${mealItem.name}" (${(mealItem.meal_type || '').replace(/_/g, ' ')}), serving ${servings}. Diet: ${goals.diet}. ${goals.allergies?.length ? `Avoid (allergies): ${goals.allergies.join(', ')}. ` : ''}Work from these known ingredients where sensible: ${(Array.isArray(mealItem.ingredients) ? mealItem.ingredients : []).join(', ') || 'use your judgment'}. Make it a meal worth cooking again.`
    let full = ''
    try {
      await streamClaude(sys, usr, c => { full += c }, 'sonnet')
      const recipe = JSON.parse(full.replace(/```json/g, '').replace(/```/g, '').trim())
      setActiveRecipe({ ...mealItem, ...recipe, loading: false })
      if (mealItem.id) {
        await supa.from('saved_meals').update({ recipe, times_made: (mealItem.times_made || 0) + 1, last_made: new Date().toISOString().split('T')[0] }).eq('id', mealItem.id)
        setSavedMeals(ms => ms.map(m => m.id === mealItem.id ? { ...m, recipe, times_made: (m.times_made || 0) + 1 } : m))
        setThisWeek(tw => tw.map(m => m.id === mealItem.id ? { ...m, recipe, times_made: (m.times_made || 0) + 1 } : m))
      }
    } catch (e) { notify('Recipe failed — try again', 'err'); logError(e, { where: 'generateRecipe', meal: mealItem?.name }); setView('plan') }
  }

  // Reusable: rate any meal from anywhere (recipe view, plan card, history card)
  const rateMeal = async (mealObj, rating) => {
    if (!mealObj || !session) return
    const { data: prof } = await supa.from('profiles').select('household_id').eq('id', session.user.id).maybeSingle()
    await supa.from('meal_ratings').delete().eq('user_id', session.user.id).eq('meal_name', mealObj.name).eq('meal_type', mealObj.meal_type || '')
    await supa.from('meal_ratings').insert({ user_id: session.user.id, household_id: prof?.household_id, meal_name: mealObj.name, meal_type: mealObj.meal_type || '', rating, never_again: rating <= 2 })
    if (mealObj.id) await supa.from('saved_meals').update({ rating }).eq('id', mealObj.id)
    setSavedMeals(ms => ms.map(m => m.id === mealObj.id ? { ...m, rating } : m))
    setThisWeek(tw => tw.map(m => m.id === mealObj.id ? { ...m, rating } : m))
    notify(rating >= 4 ? 'Glad you loved it! 🌟' : 'Got it — noted for next time')
    loadRatings()
  }

  const rateFromRecipe = async rating => {
    if (!activeRecipe) return
    await rateMeal(activeRecipe, rating)
    setActiveRecipe(r => ({ ...r, rating }))
    // 4-5 star recipes get a branded, shareable PDF prepped in the background
    if (rating >= 4 && activeRecipe.recipe) {
      buildRecipePdf({ ...activeRecipe, ...activeRecipe.recipe }).catch(() => {})
    }
  }

  // Import a recipe from any URL — backend scrapes structured data or uses AI,
  // then we prefill the cookbook form for the user to review and save.
  const importFromLink = async () => {
    const url = importUrl.trim()
    if (!/^https?:\/\//i.test(url)) { notify('Paste a recipe link (https://…)', 'err'); return }
    setImporting(true)
    try {
      const res = await fetch('/api/import-recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
      const data = await res.json()
      if (data.error) { notify(data.error, 'err'); setImporting(false); return }
      const r = data.recipe
      setCookForm({
        name: r.name || '', meal_type: 'dinner', servings: r.servings || '',
        ingredients: (r.ingredients || []).join('\n'), steps: (r.steps || []).join('\n'),
        calories: '', protein: '', carbs: '', fat: '',
      })
      setImportSource(r.source_url || url)
      notify('Recipe imported — review and save')
    } catch (e) { notify('Could not import that link', 'err'); logError(e, { where: 'importFromLink' }) }
    setImporting(false)
  }

  // Save a user's own recipe into the cookbook (flows into reuse + shopping)
  const saveCustomRecipe = async () => {
    if (!session || !cookForm.name.trim()) { notify('Give your recipe a name', 'err'); return }
    setSavingCustom(true)
    try {
      const { data: prof } = await supa.from('profiles').select('household_id').eq('id', session.user.id).maybeSingle()
      const ingLines = cookForm.ingredients.split('\n').map(s => s.trim()).filter(Boolean)
      const stepLines = cookForm.steps.split('\n').map(s => s.trim()).filter(Boolean)
      const recipe = {
        title: cookForm.name.trim(),
        servings: +cookForm.servings || goals.householdSize || 4,
        ingredients: ingLines.map(l => ({ amount: '', name: l })),
        steps: stepLines,
      }
      const row = {
        user_id: session.user.id, household_id: prof?.household_id,
        name: cookForm.name.trim(), meal_type: cookForm.meal_type,
        description: '', calories: +cookForm.calories || 0, protein: +cookForm.protein || 0,
        carbs: +cookForm.carbs || 0, fat: +cookForm.fat || 0,
        ingredients: ingLines, recipe, source: importSource ? 'import' : 'custom', source_url: importSource || null, this_week: false,
      }
      const { data, error } = await supa.from('saved_meals').insert(row).select().single()
      if (error) throw error
      setSavedMeals(ms => [data, ...ms])
      notify('Added to your cookbook!')
      setCookForm({ name: '', meal_type: 'dinner', servings: '', ingredients: '', steps: '', calories: '', protein: '', carbs: '', fat: '' })
      setImportSource(null); setImportUrl('')
      setView('history')
    } catch (e) {
      notify('Could not save — did you run the recipe-source migration?', 'err')
      logError(e, { where: 'saveCustomRecipe' })
    }
    setSavingCustom(false)
  }

  // Build a shopping list from just this recipe and jump to Shop (the
  // recipe → shop step users couldn't find before)
  const shopForRecipe = () => {
    const ings = (activeRecipe?.ingredients || []).map(i => typeof i === 'string' ? i : i?.name).filter(Boolean)
    if (ings.length === 0) { notify('No ingredients to shop for', 'err'); return }
    buildShoppingList([{ ingredients: ings }])
    notify('Added to your shopping list')
    setTab('shop')
  }

  const previewRecipe = async () => {
    if (!activeRecipe) return
    setSharing(true)
    try {
      const blob = await buildRecipePdf(activeRecipe)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (e) { notify('Could not open the recipe card', 'err'); logError(e, { where: 'previewRecipe' }) }
    setSharing(false)
  }

  const shareRecipe = async () => {
    if (!activeRecipe) return
    setSharing(true)
    try {
      const blob = await buildRecipePdf(activeRecipe)
      const result = await shareRecipePdf(blob, activeRecipe.title || activeRecipe.name)
      notify(result === 'downloaded' ? 'Recipe saved as PDF' : 'Recipe shared!')
    } catch (e) { notify('Could not create the recipe PDF', 'err'); logError(e, { where: 'shareRecipe', meal: activeRecipe?.name }) }
    setSharing(false)
  }

  const addFavoriteToMyCookbook = async (fav) => {
    if (savedMeals.some(m => m.name === fav.name)) { notify('Already in your cookbook!'); return }
    setAddingFav(fav.id)
    try {
      const { data: prof } = await supa.from('profiles').select('household_id').eq('id', session.user.id).single()
      const row = {
        user_id: session.user.id,
        household_id: prof?.household_id,
        name: fav.name,
        meal_type: fav.meal_type,
        description: fav.description,
        calories: fav.calories,
        protein: fav.protein,
        carbs: fav.carbs,
        fat: fav.fat,
        ingredients: fav.ingredients,
        recipe: fav.recipe,
        source: 'nutriq_favorite',
        this_week: false,
      }
      const { data, error } = await supa.from('saved_meals').insert(row).select().single()
      if (error) throw error
      setSavedMeals(ms => [data, ...ms])
      notify(`"${fav.name}" added to your cookbook!`)
    } catch (e) {
      notify('Could not add recipe — try again', 'err')
      logError(e, { where: 'addFavoriteToMyCookbook', fav: fav.name })
    }
    setAddingFav(null)
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button className="btn-sm" onClick={() => setView('plan')}>Back to plan</button>
          <button className="btn-sm" onClick={shareRecipe} disabled={sharing} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {sharing ? <span className="spin" style={{ width: 12, height: 12, borderTopColor: 'var(--plum)', borderColor: 'var(--plum3)44' }} /> : <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
              Share</>}
          </button>
        </div>
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
              {typeof ing === 'string'
                ? <span style={{ color: 'var(--text)' }}>{ing}</span>
                : <>
                    <span style={{ fontWeight: 500, color: 'var(--plum2)', minWidth: 80, flexShrink: 0 }}>{ing.amount}</span>
                    <span style={{ color: 'var(--text)' }}>{ing.name}</span>
                  </>}
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
        {(activeRecipe.tip || activeRecipe.chef_tip) && (
          <div className="card" style={{ marginBottom: 14, background: 'var(--plumLL)', border: '1px solid var(--plum3)22' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>👨‍🍳</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--plum2)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>Chef's tip</div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{activeRecipe.tip || activeRecipe.chef_tip}</div>
              </div>
            </div>
          </div>
        )}
        <button className="btn-full" onClick={shopForRecipe} style={{ marginBottom: 10 }}>🛒 Shop for this recipe →</button>
        <button className="btn-sm" onClick={previewRecipe} disabled={sharing} style={{ width: '100%', textAlign: 'center', padding: 11, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          📄 View recipe card
        </button>
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
          {activeRecipe.rating >= 4 && (
            <div style={{ marginTop: 14, padding: 14, background: 'var(--plumLL)', border: '1px solid var(--plum3)22', borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 17, color: 'var(--plum)', marginBottom: 6 }}>A keeper! 🌟</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>We've made a beautiful recipe card. Send it to a friend.</div>
              <button className="btn-full" onClick={shareRecipe} disabled={sharing}>{sharing ? 'Preparing…' : 'Share this recipe'}</button>
            </div>
          )}
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

  if (view === 'createRecipe') {
    const cf = (k, v) => setCookForm(f => ({ ...f, [k]: v }))
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20 }} onClick={() => setView('history')}>←</button>
          <div><div className="page-label">Your cookbook</div><h1 className="page-title" style={{ marginBottom: 0 }}>Add a recipe</h1></div>
        </div>
        {/* Import from a link */}
        <div className="card" style={{ marginBottom: 12, background: 'var(--plumLL)', border: '1px solid var(--plum3)22' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--plum)', marginBottom: 8 }}>🔗 Import from a link</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Paste a recipe URL from any site (or a Pinterest pin) and we'll fill it in for you.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="https://…" onKeyDown={e => e.key === 'Enter' && importFromLink()} style={{ flex: 1 }} />
            <button className="btn-sm" onClick={importFromLink} disabled={importing} style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
              {importing ? <span className="spin" style={{ width: 12, height: 12, borderTopColor: 'var(--plum)', borderColor: 'var(--plum3)44' }} /> : 'Import'}
            </button>
          </div>
          {importSource && <div style={{ fontSize: 11, color: 'var(--sage)', marginTop: 8 }}>✓ Imported — review below and save</div>}
        </div>
        <div className="card">
          <div><label className="input-label">Recipe name *</label><input value={cookForm.name} onChange={e => cf('name', e.target.value)} placeholder="e.g. Grandma's Chili" /></div>
          <div className="form-row" style={{ marginTop: 10 }}>
            <div><label className="input-label">Meal type</label>
              <select value={cookForm.meal_type} onChange={e => cf('meal_type', e.target.value)}>
                {Object.values(MEAL_TYPE_LABELS).filter((v, i, a) => a.indexOf(v) === i).map(k => <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div><label className="input-label">Servings</label><input type="number" value={cookForm.servings} onChange={e => cf('servings', e.target.value)} placeholder={String(goals.householdSize || 4)} /></div>
          </div>
          <div style={{ marginTop: 10 }}><label className="input-label">Ingredients (one per line)</label>
            <textarea value={cookForm.ingredients} onChange={e => cf('ingredients', e.target.value)} rows={6} placeholder={'2 cups white rice\n1 lb ground beef\n1 yellow onion'} style={{ resize: 'vertical', minHeight: 110 }} />
          </div>
          <div style={{ marginTop: 10 }}><label className="input-label">Steps (one per line)</label>
            <textarea value={cookForm.steps} onChange={e => cf('steps', e.target.value)} rows={6} placeholder={'Brown the beef\nAdd onion and cook 5 min\nStir in rice and simmer'} style={{ resize: 'vertical', minHeight: 110 }} />
          </div>
          <div style={{ marginTop: 10 }}><label className="input-label">Nutrition per serving (optional)</label>
            <div className="form-row">
              <input type="number" value={cookForm.calories} onChange={e => cf('calories', e.target.value)} placeholder="Calories" />
              <input type="number" value={cookForm.protein} onChange={e => cf('protein', e.target.value)} placeholder="Protein g" />
            </div>
            <div className="form-row" style={{ marginTop: 8 }}>
              <input type="number" value={cookForm.carbs} onChange={e => cf('carbs', e.target.value)} placeholder="Carbs g" />
              <input type="number" value={cookForm.fat} onChange={e => cf('fat', e.target.value)} placeholder="Fat g" />
            </div>
          </div>
          <button className="btn-full" data-tour="save-recipe" style={{ marginTop: 16 }} onClick={saveCustomRecipe} disabled={savingCustom}>{savingCustom ? 'Saving…' : 'Save to my cookbook'}</button>
        </div>
      </div>
    )
  }

  if (view === 'history') {
    const types = ['all', ...new Set(savedMeals.map(m => m.meal_type).filter(Boolean))]
    const ratingMatch = m => historyRating === 'all' ? true : historyRating === 'unrated' ? !m.rating : m.rating >= +historyRating
    // Search by recipe name OR any ingredient (e.g. "salmon", "beef", "orzo")
    const q = cookbookSearch.trim().toLowerCase()
    const searchMatch = m => {
      if (!q) return true
      if (m.name?.toLowerCase().includes(q)) return true
      const ings = Array.isArray(m.ingredients) ? m.ingredients : []
      return ings.some(ing => (typeof ing === 'string' ? ing : ing?.name || '').toLowerCase().includes(q))
    }
    const filtered = savedMeals
      .filter(m => historyFilter === 'all' || m.meal_type === historyFilter)
      .filter(ratingMatch)
      .filter(searchMatch)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))

    // Nutriq Favorites filtered by type + search
    const favTypes = ['all', ...new Set(NUTRIQ_FAVORITES.map(f => f.meal_type))]
    const filteredFavs = NUTRIQ_FAVORITES
      .filter(f => historyFilter === 'all' || f.meal_type === historyFilter)
      .filter(searchMatch)

    return (
      <div className="page">
        <div className="page-label">AI Planner</div>
        <h1 className="page-title">Meals</h1>
        {/* Top nav: This week / Cookbook */}
        <div className="seg" style={{ marginBottom: 16 }}>
          <button className="seg-btn" onClick={() => setView('plan')}>This week</button>
          <button className="seg-btn on">Cookbook</button>
        </div>
        {/* Cookbook sub-tabs: My Recipes / Nutriq's Favorites */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setCookbookTab('mine')}
            style={{ flex: 1, padding: '9px 0', borderRadius: 12, border: `1.5px solid ${cookbookTab === 'mine' ? 'var(--plum3)' : 'var(--border)'}`, background: cookbookTab === 'mine' ? 'var(--plumL)' : 'var(--card)', color: cookbookTab === 'mine' ? 'var(--plum2)' : 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", transition: 'all .15s' }}>
            My Recipes {savedMeals.length > 0 && `(${savedMeals.length})`}
          </button>
          <button onClick={() => setCookbookTab('favorites')}
            style={{ flex: 1, padding: '9px 0', borderRadius: 12, border: `1.5px solid ${cookbookTab === 'favorites' ? 'var(--plum3)' : 'var(--border)'}`, background: cookbookTab === 'favorites' ? 'var(--plumL)' : 'var(--card)', color: cookbookTab === 'favorites' ? 'var(--plum2)' : 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", transition: 'all .15s' }}>
            ⭐ Nutriq's Favorites
          </button>
        </div>

        {/* Search by name or ingredient (e.g. "salmon", "beef", "orzo") */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={cookbookSearch}
            onChange={e => setCookbookSearch(e.target.value)}
            placeholder="Search by food — salmon, beef, orzo…"
            style={{ paddingLeft: 36, fontSize: 14 }}
          />
          {cookbookSearch && (
            <button onClick={() => setCookbookSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--muted2)', lineHeight: 1, padding: 4 }}>×</button>
          )}
        </div>

        {/* Type filter — shared across both tabs */}
        <div className="chips" style={{ marginBottom: 16 }}>
          {(cookbookTab === 'mine' ? types : favTypes).map(t => (
            <button key={t} className={`chip${historyFilter === t ? ' on' : ''}`} onClick={() => setHistoryFilter(t)}>
              {t === 'all' ? 'All' : t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* ── MY RECIPES TAB ── */}
        {cookbookTab === 'mine' && (<>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{savedMeals.length} saved meal{savedMeals.length !== 1 ? 's' : ''}</div>
            <button className="btn-sm" data-tour="add-own" onClick={() => setView('createRecipe')}>+ Add your own</button>
          </div>
          {/* Rating filter */}
          <div className="chips" style={{ marginBottom: 16 }}>
            {[['all', 'All'], ['5', '★★★★★'], ['4', '4★ & up'], ['unrated', 'Unrated']].map(([v, l]) => (
              <button key={v} className={`chip${historyRating === v ? ' on' : ''}`} onClick={() => setHistoryRating(v)}>{l}</button>
            ))}
          </div>
          {filtered.length === 0 ? (
            q
              ? <EmptyState emoji="🔍" title={`No recipes match "${cookbookSearch}"`} sub="Try a different ingredient, or check Nutriq's Favorites for new ideas." />
              : <EmptyState emoji="📖" title="Your recipe book is empty" sub="Generate your first plan and every meal lands here — ready to reuse, rate, and cook again." cta="Plan this week" onCta={startFreshWeek} />
          ) : filtered.map(m => (
            <div key={m.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <div style={{ fontSize: 10, color: 'var(--rose)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>{(m.meal_type || '').replace(/_/g, ' ')}</div>
                  {m.source === 'custom' && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--plum2)', background: 'var(--plumL)', borderRadius: 5, padding: '1px 6px' }}>YOURS</span>}
                  {m.source === 'import' && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--sage)', background: 'var(--sageL)', borderRadius: 5, padding: '1px 6px' }}>IMPORTED</span>}
                  {m.source === 'nutriq_favorite' && <span style={{ fontSize: 9, fontWeight: 600, color: '#b07d24', background: '#f7edd7', borderRadius: 5, padding: '1px 6px' }}>NUTRIQ ★</span>}
                </div>
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
        </>)}

        {/* ── NUTRIQ'S FAVORITES TAB ── */}
        {cookbookTab === 'favorites' && (<>
          <div style={{ background: 'linear-gradient(135deg, #f7edd7, #fdf5e6)', border: '1px solid #e8d5a0', borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⭐</span>
            <div style={{ fontSize: 13, color: '#7a5c1e', lineHeight: 1.5 }}>
              <strong>Hand-picked by Nutriq</strong> — 48 of the most loved home recipes, curated for real families. Add any to your cookbook to rate, reuse, and send to pickup.
            </div>
          </div>
          {filteredFavs.length === 0 && (
            <EmptyState emoji="🔍" title={`No favorites match "${cookbookSearch}"`} sub="Try a different ingredient or clear the search." />
          )}
          {filteredFavs.map(fav => {
            const alreadySaved = savedMeals.some(m => m.name === fav.name)
            const isAdding = addingFav === fav.id
            return (
              <div key={fav.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ fontSize: 10, color: 'var(--rose)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>{fav.meal_type.replace(/_/g, ' ')}</div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#b07d24', background: '#f7edd7', borderRadius: 5, padding: '1px 6px' }}>NUTRIQ ★</span>
                  </div>
                  <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 17, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{fav.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, lineHeight: 1.4 }}>{fav.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fav.calories} cal · P {fav.protein}g · C {fav.carbs}g · F {fav.fat}g</div>
                  <div style={{ fontSize: 11, color: '#b07d24', marginTop: 3 }}>★★★★★ Community favorite</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button className="btn-sm" onClick={() => generateRecipe(fav)} style={{ background: 'none', borderColor: 'var(--border)' }}>Recipe</button>
                  <button className="btn-sm"
                    disabled={alreadySaved || isAdding}
                    onClick={() => addFavoriteToMyCookbook(fav)}
                    style={{ background: alreadySaved ? 'var(--sageL)' : 'var(--plumL)', borderColor: alreadySaved ? 'var(--sage)55' : 'var(--plum3)', color: alreadySaved ? 'var(--sage)' : 'var(--plum2)', opacity: isAdding ? 0.6 : 1 }}>
                    {isAdding ? '…' : alreadySaved ? 'Saved ✓' : '+ My cookbook'}
                  </button>
                </div>
              </div>
            )
          })}
        </>)}
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
              <div data-tour="meal-types" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
        <button className="btn-generate" data-tour="prefs-next" onClick={() => { setReuseSelected([]); setPhase('reuse') }} disabled={!hasMealPrefs}>
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
          <button className="btn-generate" data-tour="generate-btn" style={{ marginBottom: 0 }} onClick={generate} disabled={!hasMealPrefs}>
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
      <h1 className="page-title">Meals</h1>
      <div className="seg" data-tour="meals-seg" style={{ marginBottom: 20 }}>
        <button className="seg-btn on">This week</button>
        <button className="seg-btn" data-tour="open-cookbook" onClick={() => setView('history')}>Cookbook {savedMeals.length > 0 && `(${savedMeals.length})`}</button>
      </div>
      {thisWeek.length > 0 ? (<>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{thisWeek.length} meal{thisWeek.length !== 1 ? 's' : ''} planned</div>
          <button className="btn-sm" data-tour="order-ingredients" onClick={() => { buildShoppingList(thisWeek); setTab('shop') }}>Order ingredients</button>
        </div>
        {thisWeek.filter(m => !m.rating).length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'var(--sageL)', border: '1px solid var(--sage)33', borderRadius: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>🍽️</span>
            <div style={{ fontSize: 12, color: 'var(--sage)', lineHeight: 1.4 }}>
              <strong>Made one already?</strong> Tap the stars to rate it — Nutriq learns your taste and only suggests meals you'll love.
            </div>
          </div>
        )}
        {thisWeek.map(m => (
          <div key={m.id} className="plan-meal-card" style={{ cursor: 'pointer' }} onClick={() => generateRecipe(m)}>
            <div className="plan-meal-icon">{(m.meal_type || 'meal').replace(/_/g, ' ').split(' ').map(w => w[0] || '').join('').toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--rose)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{(m.meal_type || '').replace(/_/g, ' ')}</div>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 17, fontWeight: 500, color: 'var(--text)' }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.calories} cal · P {m.protein}g · C {m.carbs}g</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }} onClick={e => e.stopPropagation()}>
                {[1, 2, 3, 4, 5].map(r => (
                  <button key={r} onClick={() => rateMeal(m, r)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1, color: (m.rating || 0) >= r ? 'var(--gold)' : 'var(--border2)' }}>★</button>
                ))}
                {!m.rating && <span style={{ fontSize: 10, color: 'var(--muted2)', marginLeft: 4 }}>rate it</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--plum3)' }}>Recipe →</span>
              <button onClick={e => { e.stopPropagation(); removeFromThisWeek(m.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--muted2)' }}>Remove</button>
            </div>
          </div>
        ))}
        <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
      </>) : (
        <EmptyState emoji="🌸" title="A fresh week awaits" sub="Tell us what you're craving and we'll build a week of meals around your pantry and goals — then send it to grocery pickup." />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <button className="btn-full" data-tour="plan-week" onClick={startFreshWeek}>
          {thisWeek.length > 0 ? 'Plan a fresh week →' : 'Plan this week →'}
        </button>
        {thisWeek.length > 0 && (
          <button className="btn-sm" style={{ width: '100%', textAlign: 'center', padding: 11 }} onClick={() => { setReuseSelected([]); setView('generate'); setPhase('prefs'); setShowPrefs(true) }}>
            + Add more meals to this week
          </button>
        )}
      </div>
      {thisWeek.length > 0 && <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted2)', marginTop: -8, marginBottom: 14 }}>Planning fresh clears this week (meals stay in your library)</p>}
    </div>
  )
}
