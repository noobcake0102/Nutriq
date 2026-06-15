// Line chart of weight over time. Plots every datapoint with a connecting
// trend line, a soft area fill, and a dashed goal-weight reference line.
export default function WeightChart({ weights, goalWeight }) {
  const pts = weights.slice(-30)
  if (pts.length < 2) return null

  const W = 320, H = 168, padL = 26, padR = 10, padT = 16, padB = 22
  const vals = pts.map(p => p.weight)
  let mn = Math.min(...vals), mx = Math.max(...vals)
  if (goalWeight) { mn = Math.min(mn, goalWeight); mx = Math.max(mx, goalWeight) }
  const span = (mx - mn) || 1
  mn -= span * 0.18; mx += span * 0.18
  const rng = mx - mn

  const x = i => padL + (i / (pts.length - 1)) * (W - padL - padR)
  const y = v => padT + (1 - (v - mn) / rng) * (H - padT - padB)

  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.weight).toFixed(1)}`).join(' ')
  const area = `${padL},${(H - padB).toFixed(1)} ${line} ${x(pts.length - 1).toFixed(1)},${(H - padB).toFixed(1)}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', marginBottom: 4 }}>
      <defs>
        <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9B8EC4" stopOpacity="0.28" />
          <stop offset="1" stopColor="#9B8EC4" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* goal reference line */}
      {goalWeight > 0 && (
        <>
          <line x1={padL} x2={W - padR} y1={y(goalWeight)} y2={y(goalWeight)} stroke="#D98AB5" strokeWidth="1" strokeDasharray="4 4" opacity="0.8" />
          <text x={W - padR} y={y(goalWeight) - 4} textAnchor="end" fontSize="8" fill="#D98AB5">goal {goalWeight}</text>
        </>
      )}

      {/* area + trend line */}
      <polygon points={area} fill="url(#wfill)" />
      <polyline points={line} fill="none" stroke="#9B8EC4" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

      {/* each datapoint */}
      {pts.map((p, i) => {
        const last = i === pts.length - 1
        return <circle key={i} cx={x(i)} cy={y(p.weight)} r={last ? 4.5 : 2.6} fill={last ? '#C9BEEA' : '#9B8EC4'} stroke="#1E1C35" strokeWidth={last ? 2 : 1} />
      })}

      {/* y range labels */}
      <text x={padL - 5} y={y(mx) + 9} textAnchor="end" fontSize="8" fill="#9C99BC">{Math.round(mx)}</text>
      <text x={padL - 5} y={y(mn) - 2} textAnchor="end" fontSize="8" fill="#9C99BC">{Math.round(mn)}</text>

      {/* x date labels */}
      <text x={padL} y={H - 6} textAnchor="start" fontSize="8" fill="#9C99BC">{pts[0].date?.slice(5)}</text>
      <text x={W - padR} y={H - 6} textAnchor="end" fontSize="8" fill="#9C99BC">{pts[pts.length - 1].date?.slice(5)}</text>
    </svg>
  )
}
