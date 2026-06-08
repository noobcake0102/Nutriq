import { useEffect } from 'react'

const COLORS = ['#7b2fd6', '#ef4d8a', '#9d5cf0', '#5fb37a', '#e0b020', '#b13fd0']

export default function Celebration({ message = 'Your week is planned!', onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), 1700)
    return () => clearTimeout(t)
  }, [])

  // Spread confetti across the width with varied delays/colors
  const confetti = Array.from({ length: 28 }, (_, i) => ({
    left: (i * 7 + (i % 4) * 5) % 100,
    delay: (i % 7) * 0.07,
    color: COLORS[i % COLORS.length],
    w: 7 + (i % 3) * 3,
  }))

  return (
    <div className="celebrate">
      {confetti.map((c, i) => (
        <div key={i} className="confetti" style={{ left: `${c.left}%`, width: c.w, height: c.w, background: c.color, animationDelay: `${c.delay}s` }} />
      ))}
      <img src="/logo.png" alt="" className="celebrate-bloom" style={{ borderRadius: 28 }} />
      <div className="celebrate-text">{message}</div>
    </div>
  )
}
