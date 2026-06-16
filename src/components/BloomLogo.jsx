// Nutriq mark — the bloom.
// size: pixels (default 34 for header, pass larger for hero contexts).
// className/style pass through so callers can animate it (generating / celebration).
export default function BloomLogo({ size = 34, className, style }) {
  const radius = Math.round(size * 0.22) // iOS icon corner radius ~22%
  return (
    <img
      src="/logo.png"
      alt="Nutriq"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        display: 'block',
        objectFit: 'cover',
        ...style,
      }}
    />
  )
}
