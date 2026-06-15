import { useState, useEffect } from 'react'
import BloomLogo from './BloomLogo.jsx'

const STEPS = [
  { t: 'Checking your pantry', e: '🧺' },
  { t: 'Balancing your macros', e: '🎯' },
  { t: "Finding meals you'll love", e: '🍽️' },
  { t: 'Plating your week', e: '🌸' },
]

export default function GeneratingSequence() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI(n => (n + 1) % STEPS.length), 1300)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '62vh', textAlign: 'center', gap: 22 }}>
      <BloomLogo size={96} style={{ animation: 'genBloom 1.6s ease-in-out infinite, genGlow 1.6s ease-in-out infinite', borderRadius: 24 }} />
      <div style={{ minHeight: 70 }}>
        <div key={i} style={{ animation: 'pop .45s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{STEPS[i].e}</div>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 25, fontWeight: 600, color: 'var(--plum)' }}>{STEPS[i].t}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 7 }}>
        {STEPS.map((_, n) => (
          <div key={n} style={{ width: 7, height: 7, borderRadius: '50%', background: n === i ? 'var(--plum2)' : 'var(--border2)', transform: n === i ? 'scale(1.3)' : 'scale(1)', transition: 'all .3s' }} />
        ))}
      </div>
    </div>
  )
}
