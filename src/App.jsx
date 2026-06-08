import { useState, useEffect } from 'react'
import { supa } from './lib/supabase.js'
import { DB } from './lib/db.js'
import { calcBMR, ACT, calcMacros } from './lib/nutrition.js'
import { SP, DG, du } from './constants.js'
import { initPurchases, isPaidUser } from './lib/purchases.js'
import { requestNotificationPermission, syncExpiryReminders, scheduleWeeklyPlanReminder } from './lib/notifications.js'
import { setUserContext } from './lib/sentry.js'
import BloomLogo from './components/BloomLogo.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import Onboarding from './components/Onboarding.jsx'
import AccountModals from './components/AccountModals.jsx'
import PaywallModal from './components/PaywallModal.jsx'
import HomeTab from './components/HomeTab.jsx'
import ScannerTab from './components/ScannerTab.jsx'
import PantryTab from './components/PantryTab.jsx'
import MealsTab from './components/MealsTab.jsx'
import ShopTab from './components/ShopTab.jsx'
import GoalsTab from './components/GoalsTab.jsx'
import { I } from './components/Icons.jsx'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [needsOnboard, setNeedsOnboard] = useState(false)
  const [tab, setTab] = useState('home')
  const [pantry, setPantry] = useState(() => DB.get('nq_p', SP))
  const [goals, setGoals] = useState(() => DB.get('nq_g', DG))
  const [weights, setWeights] = useState(() => DB.get('nq_w', []))
  const [meal, setMeal] = useState(() => DB.get('nq_m', null))
  const [shop, setShop] = useState(() => DB.get('nq_s', []))
  const [toast, setToast] = useState(null)
  const [showAcctMenu, setShowAcctMenu] = useState(false)
  const [acctModal, setAcctModal] = useState(null)
  const [pantryEnabled, setPantryEnabled] = useState(() => DB.get('nq_pantry_on', true))
  const [preferredStore, setPreferredStore] = useState(() => DB.get('nq_store', 'kroger'))
  const [userName, setUserName] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [generationsUsed, setGenerationsUsed] = useState(0)
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    supa.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
    })
    const { data: { subscription } } = supa.auth.onAuthStateChange((_, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setNeedsOnboard(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { setUserName(profile?.name || session?.user?.email?.split('@')[0] || '') }, [profile, session])
  useEffect(() => { setUserContext(session?.user || null) }, [session])

  // Init RevenueCat + check entitlement on login
  useEffect(() => {
    if (!session) return
    initPurchases(session.user.id).then(() => isPaidUser().then(setIsPaid))
    // Ask for notification permission once, then schedule the weekly planner nudge
    requestNotificationPermission().then(granted => { if (granted) scheduleWeeklyPlanReminder() })
  }, [session])

  // Keep on-device expiry reminders in sync with the pantry
  useEffect(() => {
    if (!session) return
    syncExpiryReminders(pantry, 3)
  }, [session, pantry])

  // Load generation counter from Supabase profile
  useEffect(() => {
    if (!session) return
    const loadCounter = async () => {
      const { data } = await supa.from('profiles')
        .select('monthly_generations, generations_reset_at')
        .eq('id', session.user.id).maybeSingle()
      if (!data) return
      // Reset locally if new month
      const resetAt = new Date(data.generations_reset_at)
      const now = new Date()
      if (resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
        setGenerationsUsed(0)
      } else {
        setGenerationsUsed(data.monthly_generations || 0)
      }
    }
    loadCounter()
  }, [session])
  useEffect(() => DB.set('nq_p', pantry), [pantry])
  useEffect(() => DB.set('nq_g', goals), [goals])
  useEffect(() => DB.set('nq_m', meal), [meal])
  useEffect(() => DB.set('nq_s', shop), [shop])

  const loadProfile = async uid => {
    const { data, error } = await supa.from('profiles').select('*').eq('id', uid).maybeSingle()
    if (error) console.error('loadProfile error:', error)
    if (!data || !data.onboarding_complete) { setNeedsOnboard(true); return }
    setProfile(data)
    // Backend source of truth for paid status (works on web too, where the
    // RevenueCat native SDK can't run). The webhook keeps profiles.plan current.
    if (data.plan === 'plus' && (!data.plan_expires_at || new Date(data.plan_expires_at) > new Date())) setIsPaid(true)
    const { data: g } = await supa.from('goals').select('*').eq('user_id', uid).maybeSingle()
    if (g) setGoals({ weight: g.weight, goalWeight: g.goal_weight, height: g.height, age: g.age, sex: g.sex, activity: g.activity, goalType: g.goal_type, diet: g.diet, allergies: g.allergies || [], householdSize: g.household_size, meal_cuisines: g.meal_cuisines || [], meal_preferences: g.meal_preferences || {} })
    if (data.household_id) loadPantry(data.household_id)
    loadWeights(uid)
  }

  const loadPantry = async hid => {
    const { data } = await supa.from('pantry_items').select('*').eq('household_id', hid).order('created_at', { ascending: false })
    if (data?.length > 0) setPantry(data.map(i => ({ id: i.id, name: i.name, brand: i.brand, calories: i.calories, protein: i.protein, carbs: i.carbs, fat: i.fat, category: i.category, perishable: i.perishable, price: i.price, qty: i.qty, unit: i.unit, expiry: i.expiry ? new Date(i.expiry).getTime() : null, by: i.added_by, added: new Date(i.created_at).getTime() })))
  }

  const loadWeights = async uid => {
    const { data } = await supa.from('weight_logs').select('*').eq('user_id', uid).order('logged_at', { ascending: true })
    if (data) setWeights(data.map(w => ({ date: w.logged_at, weight: w.weight })))
  }

  const saveGoals = async g => {
    if (!session) return
    const { data: prof } = await supa.from('profiles').select('household_id').eq('id', session.user.id).maybeSingle()
    await supa.from('goals').upsert({ user_id: session.user.id, household_id: prof?.household_id, weight: g.weight || 0, goal_weight: g.goalWeight || 0, height: g.height || 0, age: g.age || 0, sex: g.sex || 'female', activity: g.activity || 'moderate', goal_type: g.goalType || 'lose', diet: g.diet || 'balanced', allergies: g.allergies || [], household_size: g.householdSize || 1, meal_cuisines: g.meal_cuisines || [], meal_preferences: g.meal_preferences || {}, updated_at: new Date().toISOString() }, { onConflict: 'user_id', ignoreDuplicates: false })
  }

  const savePantryItem = async item => {
    if (!session) return item
    const { data: prof } = await supa.from('profiles').select('household_id').eq('id', session.user.id).maybeSingle()
    const { data } = await supa.from('pantry_items').insert({ household_id: prof?.household_id, name: item.name, brand: item.brand, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, category: item.category, perishable: item.perishable, price: item.price || 0, qty: item.qty, unit: item.unit, expiry: item.expiry ? new Date(item.expiry).toISOString() : null, added_by: item.by || 'Me' }).select().single()
    return data ? { ...item, id: data.id } : item
  }

  const incrementGenerations = async () => {
    if (!session || isPaid) return
    try {
      const { data } = await supa.rpc('increment_generation_count', { p_user_id: session.user.id })
      if (data) setGenerationsUsed(data)
    } catch { setGenerationsUsed(g => g + 1) } // fallback: local only
  }

  const deletePantryItem = async id => { if (session) await supa.from('pantry_items').delete().eq('id', id) }
  const updatePantryQty = async (id, qty) => { if (session) await supa.from('pantry_items').update({ qty }).eq('id', id) }
  const logWeight = async (w, date) => { if (!session) return; await supa.from('weight_logs').insert({ user_id: session.user.id, weight: w, logged_at: date }) }

  const notify = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }
  const exp = pantry.filter(i => { const d = du(i.expiry); return d !== null && d <= 5 })
  const bmr = calcBMR(goals), tdee = Math.round(bmr * (ACT[goals.activity]?.mult || 1.55)), macros = calcMacros(tdee, goals.diet, goals.goalType)

  // Bottom nav. Scan is reachable from inside Pantry (it's how you add items),
  // so it isn't a top-level tab — keeps the bar to a clean 5.
  const TABS = [
    { id: 'home', label: 'Home', icon: on => <svg viewBox="0 0 24 24" fill="none" stroke={on ? '#4a1a6e' : '#c0b0d0'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
    { id: 'pantry', label: 'Pantry', icon: on => I.pantry(on ? '#4a1a6e' : '#c0b0d0') },
    { id: 'meals', label: 'Meals', icon: on => I.meals(on ? '#4a1a6e' : '#c0b0d0') },
    { id: 'shop', label: 'Shop', icon: on => I.shop(on ? '#4a1a6e' : '#c0b0d0') },
    { id: 'goals', label: 'Goals', icon: on => I.goals(on ? '#4a1a6e' : '#c0b0d0') },
  ]
  // Highlight the Pantry nav item while the Scan sub-view is open
  const navActive = tab === 'scan' ? 'pantry' : tab

  if (session === undefined) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}><BloomLogo size={72} /><div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading...</div></div>
    </div>
  )

  if (!session) return <AuthScreen />
  if (needsOnboard) return <Onboarding user={session.user} onComplete={g => { setGoals(g); setNeedsOnboard(false) }} />

  return (
    <div>
      <div className="hdr">
        <div className="hdr-logo">
          <BloomLogo />
          <div><div className="logo-name">Nutriq</div><div className="logo-tag">Feed your family better, without the mental math.</div></div>
        </div>
        <div className="hdr-right" style={{ position: 'relative' }}>
          {exp.length > 0 && <div className="expiry-chip" onClick={() => setTab('pantry')} style={{ cursor: 'pointer' }}><div className="expiry-dot" />{exp.length} expiring</div>}
          <button className="acct-btn" onClick={() => setShowAcctMenu(m => !m)}>{userName ? userName[0].toUpperCase() : '?'}</button>
          {showAcctMenu && (<>
            <div className="acct-overlay" onClick={() => setShowAcctMenu(false)} />
            <div className="acct-dropdown">
              <div className="acct-header">
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--plum)' }}>{userName || 'Your account'}</div>
                <div className="acct-email">{session?.user?.email}</div>
              </div>
              <button className="acct-menu-item" onClick={() => { setShowAcctMenu(false); setAcctModal('profile') }}>👤 Edit profile</button>
              <button className="acct-menu-item" onClick={() => { setShowAcctMenu(false); setAcctModal('password') }}>🔒 Change password</button>
              <button className="acct-menu-item" onClick={() => { setShowAcctMenu(false); setAcctModal('subscription') }}>⭐ Manage subscription</button>
              <div className="acct-divider" />
              <div style={{ padding: '8px 16px' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Preferred store</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[['kroger','Kroger'],['harris_teeter','Harris Teeter'],['instacart','Instacart'],['walmart','Walmart']].map(([k, l]) => (
                    <button key={k} onClick={() => { setPreferredStore(k); DB.set('nq_store', k); notify(`${l} set as default`) }}
                      style={{ background: preferredStore === k ? 'var(--plumL)' : 'var(--warm)', border: `1px solid ${preferredStore === k ? 'var(--plum3)' : 'var(--border)'}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: preferredStore === k ? 'var(--plum2)' : 'var(--muted)', cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><div style={{ fontSize: 13, color: 'var(--text)' }}>Pantry tracking</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Track inventory and expiry dates</div></div>
                <button onClick={() => { const n = !pantryEnabled; setPantryEnabled(n); DB.set('nq_pantry_on', n); notify(n ? 'Pantry enabled' : 'Pantry disabled') }}
                  style={{ width: 44, height: 24, borderRadius: 12, background: pantryEnabled ? 'var(--sage)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: pantryEnabled ? 23 : 3, transition: 'left .2s' }} />
                </button>
              </div>
              <a href="https://nutriqai.com/privacy" target="_blank" rel="noreferrer" className="acct-menu-item" style={{ textDecoration: 'none', color: 'var(--muted)' }}>📄 Privacy policy</a>
              <a href="https://nutriqai.com/terms" target="_blank" rel="noreferrer" className="acct-menu-item" style={{ textDecoration: 'none', color: 'var(--muted)' }}>📋 Terms of service</a>
              <div className="acct-divider" />
              <button className="acct-menu-item" onClick={() => { setShowAcctMenu(false); supa.auth.signOut() }}>🚪 Sign out</button>
              <button className="acct-menu-item danger" onClick={() => { setShowAcctMenu(false); setAcctModal('delete') }}>🗑 Delete account</button>
            </div>
          </>)}
        </div>
      </div>

      <AccountModals acctModal={acctModal} setAcctModal={setAcctModal} session={session} userName={userName} setUserName={setUserName} notify={notify} />
      {showPaywall && <PaywallModal generationsUsed={generationsUsed} onClose={() => setShowPaywall(false)} onSuccess={() => { setIsPaid(true); notify('Welcome to Nutriq Premium! 🎉') }} />}

      {tab === 'home'   && <HomeTab    pantry={pantry} goals={goals} weights={weights} meal={meal} macros={macros} setTab={setTab} userName={userName} notify={notify} />}
      {tab === 'scan'   && <ScannerTab pantry={pantry} setPantry={setPantry} savePantryItem={savePantryItem} deletePantryItem={deletePantryItem} updatePantryQty={updatePantryQty} notify={notify} setTab={setTab} />}
      {tab === 'pantry' && <PantryTab  pantry={pantry} setPantry={setPantry} deletePantryItem={deletePantryItem} updatePantryQty={updatePantryQty} notify={notify} setTab={setTab} />}
      {tab === 'meals'  && <MealsTab   pantry={pantry} goals={goals} macros={macros} meal={meal} setMeal={setMeal} setShop={setShop} setTab={setTab} notify={notify} session={session} isPaid={isPaid} generationsUsed={generationsUsed} onShowPaywall={() => setShowPaywall(true)} onGenerate={incrementGenerations} />}
      {tab === 'shop'   && <ShopTab    shop={shop} notify={notify} session={session} preferredStore={preferredStore} setTab={setTab} />}
      {tab === 'goals'  && <GoalsTab   goals={goals} setGoals={setGoals} weights={weights} setWeights={setWeights} macros={macros} tdee={tdee} bmr={bmr} logWeight={logWeight} saveGoals={saveGoals} notify={notify} />}

      <div className="nav">
        {TABS.map(t => <button key={t.id} className={`nb${navActive === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>{t.icon(navActive === t.id)}<span>{t.label}</span></button>)}
      </div>

      {toast && <div className={`toast${toast.type === 'err' ? ' err' : ''}`}>{toast.msg}</div>}
    </div>
  )
}
