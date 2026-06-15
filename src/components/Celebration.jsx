import { useEffect } from 'react'
import BloomLogo from './BloomLogo.jsx'

const COLORS = ['#9B8EC4', '#C9BEEA', '#A8C5A0', '#6B8F6B', '#D98AB5', '#E0C050']

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
      <BloomLogo size={120} className="celebrate-bloom" />
      <div className="celebrate-text">{message}</div>
    </div>
  )
}
