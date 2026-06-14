import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'

// Coachmark walkthrough: navigates the app to each tab and spotlights the real
// button it's describing. Runs once for new users (gated by nq_seen_tour in
// App.jsx) and is replayable from the account menu. `sel` is a data-tour CSS
// selector for the element to highlight; null = a centered card (no spotlight).
const STEPS = [
  { page: 'Welcome', tab: 'home', sel: null, e: '🌸',
    t: 'Welcome to Nutriq',
    d: 'Quick tour — I\'ll walk you through each screen and point out the buttons you\'ll use. Takes about a minute.' },
  { page: 'Pantry', tab: 'pantry', sel: '[data-tour="nav-pantry"]', e: '🧺',
    t: 'Your Pantry',
    d: 'Track what\'s perishable here — produce, dairy, meat, leftovers. Skip staples you always have like spices, oil, and flour. Nutriq plans meals around what\'s about to expire first.' },
  { page: 'Pantry', tab: 'pantry', sel: '[data-tour="pantry-scan"]', e: '📷',
    t: 'Scan, then tap Add',
    d: 'Tap Scan to barcode an item — then you must tap Add to save it. An expiration date is optional, but it\'s how Nutriq helps you use food before it spoils.' },
  { page: 'Meals', tab: 'meals', sel: '[data-tour="nav-meals"]', e: '🍽️',
    t: 'Meals',
    d: 'Build your week three ways: generate AI meals, add meals from your cookbook, or a mix of both.' },
  { page: 'Meals', tab: 'meals', sel: '[data-tour="meals-seg"]', e: '📖',
    t: 'This Week & Cookbook',
    d: 'Toggle between "This week" (your plan) and "Cookbook" (everything you\'ve saved). In the cookbook you can search by food — type "salmon", "beef", or "orzo" to find a recipe instantly, rate meals, and share them.' },
  { page: 'Meals', tab: 'meals', sel: '[data-tour="plan-week"]', e: '✨',
    t: 'Plan your week',
    d: 'Tap here to start a fresh week. Rate the meals you cook so Nutriq learns your taste. Heads-up: AI meals you never rate or cook are auto-removed after 60 days to keep your cookbook tidy.' },
  { page: 'Meals', tab: 'meals', sel: null, e: '🎁',
    t: 'Favorites & your printed cookbook',
    d: 'Browse 48 hand-picked, 5-star recipes under "Nutriq\'s Favorites," and add your own recipes manually or import them from any link. After one year as a subscriber, we\'ll mail you a printed copy of your personal Nutriq cookbook — your favorite meals to pass down.' },
  { page: 'Shop', tab: 'shop', sel: '[data-tour="nav-shop"]', e: '🛒',
    t: 'Shop',
    d: 'Right now we partner with Kroger (more stores coming). Connect Kroger, pick your store, and we match every ingredient to a real product — then load your pickup cart in one tap. You can add your own staples to the list too.' },
  { page: 'Goals', tab: 'goals', sel: '[data-tour="nav-goals"]', e: '🎯',
    t: 'Goals',
    d: 'Set your weight, activity, and goal. Nutriq calculates your daily calorie and macro targets, and every meal plan is built to fit them. Update them anytime — the whole app adjusts.' },
  { page: 'All set', tab: 'home', sel: '[data-tour="acct-btn"]', e: '✅',
    t: 'You\'re ready to cook',
    d: 'That\'s the whole app! You can replay this tour anytime from this menu in the top-right corner. Now let\'s plan your first week.' },
]

const PAD = 8

export default function WelcomeTour({ onClose, onNavigate }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const [cardTop, setCardTop] = useState(120)
  const cardRef = useRef(null)
  const last = i === STEPS.length - 1
  const s = STEPS[i]

  const measure = useCallback(() => {
    if (!s.sel) { setRect(null); return }
    const el = document.querySelector(s.sel)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) { setRect(null); return }
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2, cy: r.top + r.height / 2 })
  }, [s.sel])

  // Navigate to the step's tab, then measure the target (with retries so the
  // newly-mounted tab has time to render before we read its position).
  useEffect(() => {
    if (s.tab && onNavigate) onNavigate(s.tab)
    setRect(null)
    const raf = requestAnimationFrame(measure)
    const t1 = setTimeout(measure, 200)
    const t2 = setTimeout(measure, 450)
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2) }
  }, [i, measure, onNavigate, s.tab])

  // Position the card opposite the spotlight so it never covers the highlight.
  useLayoutEffect(() => {
    const vh = window.innerHeight
    const ch = cardRef.current?.offsetHeight || 240
    if (!rect) { setCardTop(Math.max(24, vh / 2 - ch / 2)); return }
    if (rect.cy > vh / 2) setCardTop(Math.max(20, rect.top - ch - 18))      // target low → card above
    else setCardTop(Math.min(vh - ch - 20, rect.top + rect.height + 18))     // target high → card below
  }, [rect, i])

  useEffect(() => {
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  const go = n => setI(Math.max(0, Math.min(STEPS.length - 1, n)))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
      {/* Click-capture base. Transparent when a spotlight is shown (the ring's
          box-shadow does the dimming); dims itself when there's no target. */}
      <div style={{ position: 'fixed', inset: 0, background: rect ? 'transparent' : 'rgba(30,16,40,.62)' }} />

      {/* Spotlight ring — the huge box-shadow dims everything except the hole. */}
      {rect && (
        <div style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: 12, boxShadow: '0 0 0 9999px rgba(30,16,40,.62)', border: '2.5px solid var(--rose)', pointerEvents: 'none', transition: 'top .35s cubic-bezier(.4,0,.2,1), left .35s cubic-bezier(.4,0,.2,1), width .35s, height .35s' }} />
      )}

      {/* Coaching card */}
      <div ref={cardRef} style={{ position: 'fixed', top: cardTop, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 36px)', maxWidth: 372, background: 'var(--card)', borderRadius: 18, padding: '18px 20px 18px', boxShadow: '0 14px 44px rgba(30,16,40,.34)', transition: 'top .35s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--plum3)' }}>{s.page} · {i + 1} of {STEPS.length}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted2)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>Skip</button>
        </div>
        <div key={i} style={{ animation: 'pop .35s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
            <span style={{ fontSize: 30 }}>{s.e}</span>
            <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 21, fontWeight: 600, color: 'var(--plum)' }}>{s.t}</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>{s.d}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
          {STEPS.map((_, n) => <div key={n} style={{ width: n === i ? 18 : 6, height: 6, borderRadius: 6, background: n === i ? 'var(--plum2)' : 'var(--border2)', transition: 'all .25s' }} />)}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {i > 0 && (
            <button className="btn-full" onClick={() => go(i - 1)} style={{ flex: '0 0 auto', width: 92, background: 'var(--warm)', color: 'var(--muted)', border: '1px solid var(--border)' }}>Back</button>
          )}
          <button className="btn-full" style={{ flex: 1 }} onClick={() => last ? onClose() : go(i + 1)}>{last ? "Let's cook 🌸" : 'Next'}</button>
        </div>
      </div>
    </div>
  )
}
