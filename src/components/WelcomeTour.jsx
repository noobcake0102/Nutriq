import { useState, useEffect } from 'react'

// Page-by-page walkthrough. Runs once for new users (gated by nq_seen_tour in
// App.jsx) and is replayable from the account menu. Each step can navigate the
// app to the relevant tab via onNavigate so the page shows behind the card.
const STEPS = [
  {
    page: 'Welcome', tab: 'home', e: '🌸',
    t: 'Welcome to Nutriq',
    d: 'Let\'s take a quick tour of each screen so you know exactly how to plan meals, cut food waste, and send groceries to pickup. Takes about a minute.',
  },
  {
    page: 'Pantry', tab: 'pantry', e: '🧺',
    t: 'Track what\'s perishable',
    d: 'Your pantry works best with perishable items — produce, dairy, meat, leftovers. Skip staples you always have like spices, oil, and flour. Nutriq plans meals around what\'s about to expire first.',
  },
  {
    page: 'Pantry', tab: 'pantry', e: '📷',
    t: 'Scan, then tap Add',
    d: 'Tap Scan to barcode an item — then you must tap Add to save it to your pantry. Setting an expiration date is optional, but it\'s how Nutriq helps you use food before it spoils and reduce waste.',
  },
  {
    page: 'Meals', tab: 'meals', e: '🍽️',
    t: 'Three ways to plan a week',
    d: 'Build your week by generating AI meals, adding meals from your cookbook, or a combination of both. Mix and match however you like.',
  },
  {
    page: 'Meals', tab: 'meals', e: '📖',
    t: 'This Week & your Cookbook',
    d: 'Toggle between "This week" (your current plan) and "Cookbook" (every recipe you\'ve saved). In the cookbook you can search by food — type "salmon", "beef", or "orzo" to find a recipe instantly.',
  },
  {
    page: 'Meals', tab: 'meals', e: '⭐',
    t: 'Rate the meals you make',
    d: 'Rating meals teaches Nutriq your taste, so every plan gets better. One heads-up: AI meals you never rate or cook are automatically removed after 60 days to keep your cookbook tidy — so rate or cook the ones you love to keep them forever.',
  },
  {
    page: 'Meals', tab: 'meals', e: '✍️',
    t: 'Make it your own',
    d: 'Add your own recipes manually, or import any recipe straight from a link on the web. You can also share your recipes with friends right from the recipe page.',
  },
  {
    page: 'Meals', tab: 'meals', e: '🎁',
    t: 'Nutriq\'s Favorites & your printed cookbook',
    d: 'Browse 48 hand-picked, 5-star recipes under "Nutriq\'s Favorites." And after one year as a subscriber, we\'ll mail you a printed copy of your personal Nutriq cookbook — your favorite meals to share with friends and pass down through generations.',
  },
  {
    page: 'Shop', tab: 'shop', e: '🛒',
    t: 'Grocery pickup with Kroger',
    d: 'Right now we partner with Kroger (more stores are coming). Connect your Kroger account, pick your local store, and Nutriq matches every ingredient on your list to a real product — then loads your pickup cart in one tap. Add your own staples to the list too.',
  },
  {
    page: 'Goals', tab: 'goals', e: '🎯',
    t: 'Your goals drive everything',
    d: 'Set your weight, activity level, and goal. Nutriq calculates your daily calorie and macro targets, and every meal plan is built to fit them. Update your goals anytime — the whole app adjusts automatically.',
  },
  {
    page: 'All set', tab: 'home', e: '✅',
    t: 'You\'re ready to cook',
    d: 'That\'s the whole app. You can replay this tour anytime from the menu in the top-right corner. Now let\'s plan your first week!',
  },
]

export default function WelcomeTour({ onClose, onNavigate }) {
  const [i, setI] = useState(0)
  const last = i === STEPS.length - 1
  const s = STEPS[i]

  // Drive the app to the relevant tab as the user steps through.
  useEffect(() => {
    if (s.tab && onNavigate) onNavigate(s.tab)
  }, [i])

  const go = n => setI(Math.max(0, Math.min(STEPS.length - 1, n)))

  return (
    <div className="modal-backdrop" style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="modal-sheet" style={{ borderRadius: '22px 22px 0 0', maxWidth: 430, width: '100%', textAlign: 'center', padding: '26px 24px 22px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--plum3)' }}>{s.page} · {i + 1} of {STEPS.length}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted2)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>Skip</button>
        </div>
        <div key={i} style={{ animation: 'pop .4s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ fontSize: 54, marginBottom: 12 }}>{s.e}</div>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 23, fontWeight: 600, color: 'var(--plum)', marginBottom: 8 }}>{s.t}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20, minHeight: 88 }}>{s.d}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
          {STEPS.map((_, n) => <div key={n} style={{ width: n === i ? 20 : 6, height: 6, borderRadius: 6, background: n === i ? 'var(--plum2)' : 'var(--border2)', transition: 'all .25s' }} />)}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {i > 0 && (
            <button className="btn-full" onClick={() => go(i - 1)} style={{ flex: '0 0 auto', width: 96, background: 'var(--warm)', color: 'var(--muted)', border: '1px solid var(--border)' }}>Back</button>
          )}
          <button className="btn-full" style={{ flex: 1 }} onClick={() => last ? onClose() : go(i + 1)}>{last ? "Let's cook 🌸" : 'Next'}</button>
        </div>
      </div>
    </div>
  )
}
