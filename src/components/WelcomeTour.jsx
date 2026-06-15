import { useState } from 'react'

// Self-contained interactive demo. Instead of driving the real app (with real
// async AI calls and waits), the tour renders mock screens with canned data and
// advances the instant the user taps the glowing button — deterministic, no
// waiting, and the same every time. Runs once for new users (nq_seen_tour) and
// is replayable from the account menu. There is no skip: forward-only.

const RING = {
  boxShadow: '0 0 0 3px var(--card), 0 0 0 6px var(--rose), 0 0 22px rgba(239,77,138,.45)',
  position: 'relative', zIndex: 1,
}

// Tiny presentational helpers to keep the mock screens compact + on-brand.
const Label = ({ children }) => <div className="page-label">{children}</div>
const Title = ({ children }) => <h1 className="page-title" style={{ marginBottom: 12 }}>{children}</h1>

function MealCard({ tag, name, macros, fav }) {
  return (
    <div className="card" style={{ marginBottom: 8, padding: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <div style={{ fontSize: 10, color: 'var(--rose)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>{tag}</div>
        {fav && <span style={{ fontSize: 9, fontWeight: 600, color: '#E0C050', background: '#33301a', borderRadius: 5, padding: '1px 6px' }}>NUTRIQ ★</span>}
      </div>
      <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{name}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{macros}</div>
    </div>
  )
}

const TABS = [['🏠', 'Home'], ['🧺', 'Pantry'], ['🍽️', 'Meals'], ['🛒', 'Shop'], ['🎯', 'Goals']]

export default function WelcomeTour({ onClose }) {
  const [i, setI] = useState(0)
  const next = () => setI(n => Math.min(STEPS.length - 1, n + 1))
  const back = () => setI(n => Math.max(0, n - 1))

  // Each step: which nav tab is active, the mock screen (gets `next` so the
  // glowing button advances), the coaching copy, and optional hint/cta.
  const STEPS = [
    {
      navTab: 'Pantry', page: 'Pantry', e: '🧺', t: 'Start with your pantry',
      d: 'Track what\'s perishable — produce, dairy, meat, leftovers. Skip staples you always have like spices and oil. Tap Scan to add an item by barcode, then tap Add. An expiry date is optional but helps cut waste.',
      hint: 'Tap "Scan" to add an item.',
      screen: (go) => (
        <>
          <Label>Kitchen</Label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title>Your pantry</Title>
            <button className="btn-sm" style={{ ...RING, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px' }} onClick={go}>📷 Scan</button>
          </div>
          {[['Chicken breast', '1.5 lb', 'in 3 days', 'var(--red)'], ['Baby spinach', '1 bag', 'in 2 days', 'var(--red)'], ['Greek yogurt', '32 oz', 'in 6 days', 'var(--muted)']].map(([n, q, exp, c]) => (
            <div key={n} className="card" style={{ marginBottom: 8, padding: 13, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--plumLL)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🥗</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{n}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{q} · expires <span style={{ color: c }}>{exp}</span></div>
              </div>
            </div>
          ))}
        </>
      ),
    },
    {
      navTab: 'Meals', page: 'Meals', e: '🍽️', t: 'Plan your week',
      d: 'Build a week three ways: generate AI meals, reuse meals from your cookbook, or a mix of both. Let\'s generate one.',
      hint: 'Tap "Plan this week".',
      screen: (go) => (
        <>
          <Label>AI Planner</Label>
          <Title>Meals</Title>
          <div className="seg" style={{ marginBottom: 18 }}>
            <button className="seg-btn on">This week</button>
            <button className="seg-btn">Cookbook</button>
          </div>
          <div style={{ textAlign: 'center', padding: '20px 10px 24px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🌸</div>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, color: 'var(--plum)', marginBottom: 4 }}>A fresh week awaits</div>
            <div style={{ fontSize: 13 }}>Tell us what you're craving and we'll build a week around your goals and pantry.</div>
          </div>
          <button className="btn-full" style={RING} onClick={go}>Plan this week →</button>
        </>
      ),
    },
    {
      navTab: 'Meals', page: 'Meals', e: '🥗', t: 'Choose what you need',
      d: 'Pick the meals you want and how many of each, plus any cuisines you love. We\'ve selected a couple for the demo.',
      hint: 'Tap "Next" to continue.',
      screen: (go) => (
        <>
          <Label>Step 1 of 3</Label>
          <Title>What do you need?</Title>
          <div className="section-label" style={{ marginBottom: 8 }}>Meals this week</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {[['Breakfast', true, 3], ['Dinner', true, 4], ['Snack', false, 0]].map(([n, on, ct]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className={`chip${on ? ' on' : ''}`} style={{ flex: 1, textAlign: 'left', borderRadius: 10 }}>{n}</button>
                {on && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ct}× needed</span>}
              </div>
            ))}
          </div>
          <div className="section-label" style={{ marginBottom: 8 }}>Cuisines</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {['Italian', 'Mexican', 'Asian', 'Healthy'].map((c, n) => <button key={c} className={`chip${n < 2 ? ' on' : ''}`}>{c}</button>)}
          </div>
          <button className="btn-generate" style={RING} onClick={go}>Next: reuse saved meals →</button>
        </>
      ),
    },
    {
      navTab: 'Meals', page: 'Meals', e: '🤖', t: 'Generate your meals',
      d: 'For your first week there are no saved meals to reuse yet, so we\'ll generate fresh ones. Our AI builds real meals around your goals and pantry — instantly.',
      hint: 'Tap "Generate".',
      screen: (go) => (
        <>
          <Label>Step 2 of 3</Label>
          <Title>Reuse saved meals</Title>
          <div style={{ background: 'var(--plumLL)', border: '1px solid var(--plum3)22', borderRadius: 12, padding: 14, fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            No saved meals yet — your first generated meals will land here for reuse next week.
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>Generating 7 meals</div>
          <button className="btn-generate" style={RING} onClick={go}>Generate 7 new meals →</button>
        </>
      ),
    },
    {
      navTab: 'Meals', page: 'Meals', e: '👍', t: 'Pick the ones you like',
      d: 'Tap the meals that look good for each type — they\'re added to your week. We\'ve picked a few for you.',
      hint: 'Tap "Add to my week".',
      screen: (go) => (
        <>
          <Label>Choose meals</Label>
          <Title>Your options</Title>
          {[['Garlic Butter Chicken Thighs', '480 cal · 38g protein', true], ['Chicken Stir Fry', '440 cal · 38g protein', true], ['Tuscan Salmon Bowl', '500 cal · 40g protein', false]].map(([n, m, on]) => (
            <div key={n} className="card" style={{ marginBottom: 8, padding: 13, display: 'flex', alignItems: 'center', gap: 12, border: on ? '1px solid var(--plum3)' : '1px solid var(--border)', background: on ? 'var(--plumLL)' : 'var(--card)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${on ? 'var(--plum2)' : 'var(--border2)'}`, background: on ? 'var(--plum2)' : 'transparent', color: '#1E1C35', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on ? '✓' : ''}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{n}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m}</div>
              </div>
            </div>
          ))}
          <button className="btn-generate" style={{ ...RING, marginTop: 8 }} onClick={go}>Add to my week →</button>
        </>
      ),
    },
    {
      navTab: 'Meals', page: 'Meals', e: '🛒', t: 'Turn it into groceries',
      d: 'Your week is planned. Rate meals you cook so Nutriq learns your taste. Now send the plan to your grocery list.',
      hint: 'Tap "Order ingredients".',
      screen: (go) => (
        <>
          <Label>AI Planner</Label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title>This week</Title>
            <button className="btn-sm" style={RING} onClick={go}>Order ingredients</button>
          </div>
          <MealCard tag="dinner" name="Garlic Butter Chicken Thighs" macros="480 cal · P 38g · C 4g" />
          <MealCard tag="dinner" name="Chicken Stir Fry" macros="440 cal · P 38g · C 42g" />
          <MealCard tag="breakfast" name="Greek Yogurt Parfait" macros="280 cal · P 18g · C 38g" />
        </>
      ),
    },
    {
      navTab: 'Shop', page: 'Shop', e: '🛍️', t: 'Your shopping list',
      d: 'Every ingredient is matched to a real Kroger product (more stores coming). Connect Kroger to load your pickup cart in one tap — and add your own staples like milk or coffee at the bottom.',
      hint: 'Tap "Add to Kroger cart".',
      screen: (go) => (
        <>
          <Label>Grocery</Label>
          <Title>Shopping list</Title>
          {[['Boneless chicken thighs', 'Kroger® · 2.5 lb', '$6.49'], ['White rice', 'Kroger® · 32 oz', '$2.49'], ['Broccoli florets', 'Fresh · 12 oz', '$1.99']].map(([n, b, p]) => (
            <div key={n} className="card" style={{ marginBottom: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 11 }}>
              <div className="check-ring on">✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{n}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{b}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--sage)' }}>{p}</div>
            </div>
          ))}
          <button className="btn-full" style={{ ...RING, marginTop: 8 }} onClick={go}>Add to Kroger cart · 3 items</button>
        </>
      ),
    },
    {
      navTab: 'Meals', page: 'Cookbook', e: '📖', t: 'Your cookbook',
      d: 'Every meal you save lives here. Search by ingredient ("salmon", "beef", "orzo"), rate meals, and browse Nutriq\'s 48 hand-picked favorites. Let\'s add one of your own.',
      hint: 'Tap "+ Add your own".',
      screen: (go) => (
        <>
          <Label>AI Planner</Label>
          <Title>Meals</Title>
          <div className="seg" style={{ marginBottom: 14 }}>
            <button className="seg-btn">This week</button>
            <button className="seg-btn on">Cookbook</button>
          </div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input value="salmon" readOnly style={{ paddingLeft: 14, fontSize: 14 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button className="btn-sm" style={RING} onClick={go}>+ Add your own</button>
          </div>
          <MealCard tag="dinner" name="Teriyaki Salmon Bowls" macros="500 cal · P 38g" fav />
          <MealCard tag="dinner" name="Sheet Pan Lemon Salmon" macros="420 cal · P 40g" fav />
        </>
      ),
    },
    {
      navTab: 'Meals', page: 'Cookbook', e: '✍️', t: 'Add or import recipes',
      d: 'Enter a recipe by hand, or import one from any web link — Pinterest, a blog, anywhere. It flows into your plans and shopping list like any other meal.',
      hint: 'Tap "Save to my cookbook".',
      screen: (go) => (
        <>
          <Label>Your cookbook</Label>
          <Title>Add a recipe</Title>
          <button className="btn-ghost" style={{ marginBottom: 14 }}>🔗 Import from a link</button>
          <div className="input-label">Recipe name</div>
          <input value="Grandma's Lasagna" readOnly style={{ marginBottom: 12 }} />
          <div className="input-label">Ingredients</div>
          <textarea readOnly rows={3} value={'1 lb ground beef\n12 lasagna noodles\n2 cups ricotta'} style={{ marginBottom: 14, resize: 'none' }} />
          <button className="btn-full" style={RING} onClick={go}>Save to my cookbook</button>
        </>
      ),
    },
    {
      navTab: 'Goals', page: 'Goals', e: '🎯', t: 'Your goals drive it all',
      d: 'Set your weight, activity, and goal. Nutriq calculates your daily calorie and macro targets — and every meal plan is built to fit them. Change them anytime and the whole app adjusts.',
      cta: 'Got it',
      screen: () => (
        <>
          <Label>You</Label>
          <Title>Goals</Title>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-title">Daily targets</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['1,850', 'cal'], ['140g', 'protein'], ['180g', 'carbs'], ['60g', 'fat']].map(([v, l]) => (
                <div key={l} style={{ flex: 1, background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 6px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 500, fontSize: 15, color: 'var(--plum2)' }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Goal</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>Lose weight · 150 → 135 lb · Moderately active</div>
          </div>
        </>
      ),
    },
    {
      navTab: 'Home', page: 'All set', e: '✅', t: 'You\'re ready to cook',
      d: 'That\'s the whole flow — plan, shop, and build your cookbook. After a year as a subscriber we\'ll even mail you a printed copy of your favorites. Replay this tour anytime from the top-right menu. 🌸',
      cta: "Let\'s cook 🌸", isLast: true,
      screen: () => (
        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🌸</div>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, color: 'var(--plum)', marginBottom: 8 }}>Welcome to Nutriq</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>Your kitchen, your week, your cart — sorted.</div>
        </div>
      ),
    },
  ]

  const step = STEPS[i]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--cream)', display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto' }}>
      {/* Mock app header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(250,248,245,.92)' }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--plum)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌸</div>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, fontWeight: 600, color: 'var(--plum)' }}>Nutriq</div>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--plum3)', background: 'var(--plumL)', padding: '3px 9px', borderRadius: 20 }}>Tour</span>
      </div>

      {/* Mock screen content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 0' }}>
        <div key={i} style={{ animation: 'fadeUp .25s ease' }}>{step.screen(next)}</div>
      </div>

      {/* Fake bottom nav for orientation */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'rgba(250,248,245,.96)' }}>
        {TABS.map(([icon, label]) => {
          const on = label === step.navTab
          return (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 4px 11px', borderTop: `2px solid ${on ? 'var(--plum)' : 'transparent'}`, opacity: on ? 1 : 0.45 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: .5, textTransform: 'uppercase', color: on ? 'var(--plum)' : 'var(--muted2)' }}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* Coaching card */}
      <div style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', boxShadow: '0 -8px 30px rgba(30,16,40,.12)', padding: '16px 20px 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--plum3)', marginBottom: 7 }}>{step.page} · {i + 1} of {STEPS.length}</div>
        <div key={i} style={{ animation: 'pop .35s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 26 }}>{step.e}</span>
            <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, fontWeight: 600, color: 'var(--plum)' }}>{step.t}</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55, marginBottom: step.hint ? 10 : 14 }}>{step.d}</div>
          {step.hint && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--roseL)', border: '1px solid var(--rose)33', borderRadius: 10, padding: '9px 12px', marginBottom: 14 }}>
              <span style={{ fontSize: 15 }}>👆</span>
              <span style={{ fontSize: 12.5, color: 'var(--blushD)', fontWeight: 500 }}>{step.hint}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
          {STEPS.map((_, n) => <div key={n} style={{ width: n === i ? 18 : 6, height: 6, borderRadius: 6, background: n === i ? 'var(--plum2)' : 'var(--border2)', transition: 'all .25s' }} />)}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {i > 0 && <button className="btn-full" onClick={back} style={{ flex: '0 0 auto', width: 84, background: 'var(--warm)', color: 'var(--muted)', border: '1px solid var(--border)' }}>Back</button>}
          {step.cta
            ? <button className="btn-full" style={{ flex: 1 }} onClick={() => step.isLast ? onClose() : next()}>{step.cta}</button>
            : <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--muted2)', padding: '12px 0' }}>👆 Tap the highlighted button above</div>}
        </div>
      </div>
    </div>
  )
}
