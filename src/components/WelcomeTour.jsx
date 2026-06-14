import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'

// Fully interactive walkthrough. The tour highlights a real button, makes ONLY
// that button clickable (the rest of the screen is masked), and advances when
// the user actually performs the action — driving the real planning flow end to
// end. Every step also has a "Next" fallback so it can never get stuck, and it
// polls for each target so async/screen transitions (e.g. AI generation) resolve.
//
// Step fields:
//   sel     — data-tour selector to highlight (null = centered card, no spotlight)
//   action  — 'click': advance when the user clicks the highlighted element
//   nav     — tab to auto-switch to before the step (used for the opening step)
//   hint    — short "do this" line shown under the description on action steps
const STEPS = [
  { page: 'Welcome', nav: 'home', sel: null, e: '🌸', t: 'Let\'s plan your first week',
    d: 'I\'ll walk you through it for real — tap along with me and you\'ll have a week of meals and a grocery list by the end.' },

  { page: 'Meals', sel: '[data-tour="nav-meals"]', action: 'click', e: '🍽️', t: 'Open Meals',
    d: 'Everything starts here.', hint: 'Tap the highlighted Meals tab to continue.' },

  { page: 'Meals', sel: '[data-tour="plan-week"]', action: 'click', e: '✨', t: 'Start your week',
    d: 'This kicks off a fresh weekly plan.', hint: 'Tap "Plan this week".' },

  { page: 'Meals', sel: '[data-tour="meal-types"]', e: '🥗', t: 'Choose what you need',
    d: 'Tap the meals you want (breakfast, dinner, snacks…) and use +/− to set how many of each. Pick at least one.', hint: 'Select your meals above, then tap Next.' },

  { page: 'Meals', sel: '[data-tour="prefs-next"]', action: 'click', e: '➡️', t: 'Keep going',
    d: 'Next you can reuse meals you\'ve saved before — for your first week there won\'t be any yet.', hint: 'Tap "Next: reuse your saved meals".' },

  { page: 'Meals', sel: '[data-tour="generate-btn"]', action: 'click', e: '🤖', t: 'Generate your meals',
    d: 'Our AI builds a week of real meals around your goals and what\'s in your pantry — in seconds.', hint: 'Tap "Generate" to build your week.' },

  { page: 'Meals', sel: null, freeform: true, e: '👍', t: 'Pick the ones you like',
    d: 'For each meal type, tap the options that look good — they get added to your week. Once you\'ve picked them all, you\'ll land on your weekly plan. Tap Next when you\'re there.' },

  { page: 'Meals', sel: '[data-tour="order-ingredients"]', action: 'click', e: '🛒', t: 'Turn it into groceries',
    d: 'Your plan becomes a shopping list, matched to real products.', hint: 'Tap "Order ingredients".' },

  { page: 'Shop', sel: '[data-tour="shop-add"]', e: '🧺', t: 'Your shopping list',
    d: 'Every item is matched to a real Kroger product. Connect Kroger to send it to pickup — and add your own staples (milk, OJ, coffee) right here. They won\'t come from your meal plan, so this is where you top them up.' },

  { page: 'Meals', sel: '[data-tour="nav-meals"]', action: 'click', e: '📖', t: 'Now, your cookbook',
    d: 'Let\'s look at where your recipes live.', hint: 'Tap the Meals tab again.' },

  { page: 'Meals', sel: '[data-tour="open-cookbook"]', action: 'click', e: '🔍', t: 'Open your cookbook',
    d: 'Your saved meals live here. You can search by ingredient ("salmon", "beef", "orzo"), rate meals so Nutriq learns your taste, and browse Nutriq\'s 48 hand-picked favorites.', hint: 'Tap "Cookbook".' },

  { page: 'Meals', sel: '[data-tour="add-own"]', action: 'click', e: '✍️', t: 'Add your own recipes',
    d: 'Enter a recipe by hand, or import one from any web link — Pinterest, a blog, anywhere.', hint: 'Tap "+ Add your own".' },

  { page: 'Meals', sel: '[data-tour="save-recipe"]', e: '💾', t: 'Save & reuse',
    d: 'Fill in the details and save. Your recipe flows into weekly plans and shopping lists like any other meal — and after a year as a subscriber, we mail you a printed copy of your personal cookbook to pass down.' },

  { page: 'All set', sel: '[data-tour="acct-btn"]', e: '✅', t: 'You\'re all set',
    d: 'That\'s the whole flow! Replay this tour anytime from this menu in the top-right. Happy cooking. 🌸' },
]

const PAD = 8
const DIM = 'rgba(30,16,40,.62)'

export default function WelcomeTour({ onClose, onNavigate }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const [vp, setVp] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 430, h: typeof window !== 'undefined' ? window.innerHeight : 800 })
  const [cardTop, setCardTop] = useState(120)
  const cardRef = useRef(null)
  const last = i === STEPS.length - 1
  const s = STEPS[i]
  const go = n => setI(Math.max(0, Math.min(STEPS.length - 1, n)))

  const measure = useCallback(() => {
    if (!s.sel) { setRect(r => (r === null ? r : null)); return }
    const el = document.querySelector(s.sel)
    if (!el) { setRect(r => (r === null ? r : null)); return }
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return
    const next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2, cy: r.top + r.height / 2 }
    setRect(prev => (prev && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.height === next.height) ? prev : next)
  }, [s.sel])

  // On step change: optionally switch tab, then keep polling for the target so
  // it resolves even after a screen change or async AI generation.
  useEffect(() => {
    if (s.nav && onNavigate) onNavigate(s.nav)
    setRect(null)
    const raf = requestAnimationFrame(measure)
    const id = setInterval(measure, 300)
    return () => { cancelAnimationFrame(raf); clearInterval(id) }
  }, [i, s.nav, onNavigate, measure])

  // Track viewport for the mask.
  useEffect(() => {
    const onResize = () => { setVp({ w: window.innerWidth, h: window.innerHeight }); measure() }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  // Advance when the user actually clicks the highlighted element.
  useEffect(() => {
    if (s.action !== 'click' || !rect || !s.sel) return
    const el = document.querySelector(s.sel)
    if (!el) return
    const handler = () => setTimeout(() => go(i + 1), 90) // let the app's own handler run first
    el.addEventListener('click', handler, { capture: true, once: true })
    return () => el.removeEventListener('click', handler, { capture: true })
  }, [i, rect, s.action, s.sel])

  // Place the card opposite the spotlight so it never covers the highlight.
  // Freeform steps (user must use the real screen) pin the card to the bottom.
  useLayoutEffect(() => {
    const ch = cardRef.current?.offsetHeight || 240
    if (s.freeform) { setCardTop(vp.h - ch - 18); return }
    if (!rect) { setCardTop(Math.max(24, vp.h / 2 - ch / 2)); return }
    if (rect.cy > vp.h / 2) setCardTop(Math.max(16, rect.top - ch - 16))
    else setCardTop(Math.min(vp.h - ch - 16, rect.top + rect.height + 16))
  }, [rect, i, vp.h, s.freeform])

  // Build the dim mask. With a target, four rects surround the hole so ONLY the
  // highlighted element is clickable; without one, a single full-screen dim.
  // Freeform steps render NO mask so the user can use the whole screen.
  const masks = []
  if (s.freeform) {
    // no mask — full app interactivity
  } else if (rect) {
    const right = rect.left + rect.width, bottom = rect.top + rect.height
    masks.push({ top: 0, left: 0, width: vp.w, height: Math.max(0, rect.top) })
    masks.push({ top: bottom, left: 0, width: vp.w, height: Math.max(0, vp.h - bottom) })
    masks.push({ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height })
    masks.push({ top: rect.top, left: right, width: Math.max(0, vp.w - right), height: rect.height })
  } else {
    masks.push({ top: 0, left: 0, width: vp.w, height: vp.h })
  }

  // Root is pointer-transparent; only masks + card capture events. This makes the
  // spotlight hole (and freeform mode) pass clicks straight through to the app.
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>
      {/* Dim mask (click-blocking) — leaves the highlighted element clickable. */}
      {masks.map((m, n) => (
        <div key={n} onClick={() => {}} style={{ position: 'fixed', top: m.top, left: m.left, width: m.width, height: m.height, background: DIM, pointerEvents: 'auto' }} />
      ))}

      {/* Highlight ring (visual only). */}
      {rect && (
        <div style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: 12, border: '2.5px solid var(--rose)', boxShadow: '0 0 0 3px rgba(239,77,138,.25)', pointerEvents: 'none', transition: 'top .3s cubic-bezier(.4,0,.2,1), left .3s, width .3s, height .3s' }} />
      )}

      {/* Coaching card */}
      <div ref={cardRef} style={{ position: 'fixed', top: cardTop, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 36px)', maxWidth: 372, background: 'var(--card)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 14px 44px rgba(30,16,40,.34)', transition: 'top .3s cubic-bezier(.4,0,.2,1)', zIndex: 1001, pointerEvents: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--plum3)' }}>{s.page} · {i + 1} of {STEPS.length}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted2)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>Skip tour</button>
        </div>
        <div key={i} style={{ animation: 'pop .35s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
            <span style={{ fontSize: 28 }}>{s.e}</span>
            <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, fontWeight: 600, color: 'var(--plum)' }}>{s.t}</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: s.hint ? 10 : 16 }}>{s.d}</div>
          {s.hint && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--roseL)', border: '1px solid var(--rose)33', borderRadius: 10, padding: '9px 12px', marginBottom: 16 }}>
              <span style={{ fontSize: 15 }}>👆</span>
              <span style={{ fontSize: 12.5, color: 'var(--blushD)', fontWeight: 500 }}>{s.hint}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
          {STEPS.map((_, n) => <div key={n} style={{ width: n === i ? 18 : 6, height: 6, borderRadius: 6, background: n === i ? 'var(--plum2)' : 'var(--border2)', transition: 'all .25s' }} />)}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {i > 0 && (
            <button className="btn-full" onClick={() => go(i - 1)} style={{ flex: '0 0 auto', width: 84, background: 'var(--warm)', color: 'var(--muted)', border: '1px solid var(--border)' }}>Back</button>
          )}
          <button className="btn-full" style={{ flex: 1 }} onClick={() => last ? onClose() : go(i + 1)}>
            {last ? "Let's cook 🌸" : s.action === 'click' ? 'Skip step →' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
