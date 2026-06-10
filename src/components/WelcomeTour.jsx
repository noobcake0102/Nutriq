import { useState } from 'react'

const STEPS = [
  { e: '🧺', t: 'Start with your pantry', d: 'Scan or add what you already have. Nutriq plans meals to use it up first — less waste, smaller grocery bills.' },
  { e: '🍽️', t: 'Plan your week', d: 'Tell us how many meals you need and what you\'re craving. AI builds a week around your goals and pantry in seconds.' },
  { e: '🛒', t: 'Send it to pickup', d: 'Tap "Order ingredients" and every item is matched to real products at your store — your cart, filled for you.' },
  { e: '⭐', t: 'It learns you', d: 'Rate the meals you make. Nutriq remembers your favorites and your brands, getting sharper every single week.' },
]

export default function WelcomeTour({ onClose }) {
  const [i, setI] = useState(0)
  const last = i === STEPS.length - 1
  const s = STEPS[i]
  return (
    <div className="modal-backdrop" style={{ alignItems: 'center' }} onClick={onClose}>
      <div className="modal-sheet" style={{ borderRadius: 22, maxWidth: 380, margin: '0 18px', textAlign: 'center', padding: '32px 24px 24px' }} onClick={e => e.stopPropagation()}>
        <div key={i} style={{ animation: 'pop .4s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ fontSize: 60, marginBottom: 14 }}>{s.e}</div>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 24, fontWeight: 600, color: 'var(--plum)', marginBottom: 8 }}>{s.t}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 22 }}>{s.d}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 22 }}>
          {STEPS.map((_, n) => <div key={n} style={{ width: n === i ? 22 : 7, height: 7, borderRadius: 7, background: n === i ? 'var(--plum2)' : 'var(--border2)', transition: 'all .25s' }} />)}
        </div>
        <button className="btn-full" onClick={() => last ? onClose() : setI(i + 1)}>{last ? "Let's cook 🌸" : 'Next'}</button>
        {!last && <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted2)', fontSize: 13, cursor: 'pointer', padding: '10px 0 0', fontFamily: "'DM Sans',system-ui,sans-serif" }}>Skip tour</button>}
      </div>
    </div>
  )
}
