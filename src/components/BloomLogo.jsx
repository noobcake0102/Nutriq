// Nutriq mark — the bloom, in the Violet Direction palette.
// Overlapping translucent petals (lavender + one sage accent) with a cream
// center eye, on a deep-violet app-icon tile.
// size: pixels (default 34 for header, larger for hero contexts).
// className/style pass through so callers can animate it (generating / celebration).
const PETALS = [
  { angle: 18, fill: '#9B8EC4' },
  { angle: 90, fill: '#9B8EC4' },
  { angle: 162, fill: '#9B8EC4' },
  { angle: 234, fill: '#9B8EC4' },
  { angle: 306, fill: '#A8C5A0' }, // sage accent
]

export default function BloomLogo({ size = 34, className, style }) {
  const radius = Math.round(size * 0.22) // iOS icon corner radius ~22%
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0, borderRadius: radius, ...style }}
      role="img"
      aria-label="Nutriq"
    >
      <defs>
        <linearGradient id="bloomTile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#46426E" />
          <stop offset="1" stopColor="#2D2B4E" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="url(#bloomTile)" />
      <g style={{ mixBlendMode: 'screen' }}>
        {PETALS.map((p, i) => (
          <ellipse
            key={i}
            cx="24"
            cy="24"
            rx="7"
            ry="16"
            fill={p.fill}
            opacity="0.55"
            transform={`rotate(${p.angle} 24 24)`}
          />
        ))}
      </g>
      {/* center eye */}
      <circle cx="24" cy="24" r="6" fill="#1E1C35" />
      <circle cx="24" cy="24" r="3.8" fill="#F2EFE8" />
      <circle cx="24" cy="24" r="1.3" fill="#9B8EC4" />
    </svg>
  )
}
