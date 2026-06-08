// size: pixels (default 34 for header, pass larger for hero contexts)
export default function BloomLogo({ size = 34 }) {
  const radius = Math.round(size * 0.22) // iOS icon corner radius ~22%
  return (
    <img
      src="/logo.png"
      alt="Nutriq"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        display: 'block',
        objectFit: 'cover',
      }}
    />
  )
}
