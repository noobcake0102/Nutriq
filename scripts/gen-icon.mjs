// Render the Violet Direction bloom to a 1024x1024 App Store icon.
// App Store rules: opaque, square, no rounded corners (Apple masks it).
import sharp from 'sharp'

const C = 512, RX = 150, RY = 342
const petals = [18, 90, 162, 234, 306]
  .map((a, i) =>
    `<ellipse cx="${C}" cy="${C}" rx="${RX}" ry="${RY}" fill="${i === 4 ? '#A8C5A0' : '#9B8EC4'}" opacity="0.7" transform="rotate(${a} ${C} ${C})"/>`
  )
  .join('')

const svg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#46426E"/><stop offset="1" stop-color="#2D2B4E"/>
  </linearGradient></defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  ${petals}
  <circle cx="${C}" cy="${C}" r="128" fill="#1E1C35"/>
  <circle cx="${C}" cy="${C}" r="81" fill="#F2EFE8"/>
  <circle cx="${C}" cy="${C}" r="28" fill="#9B8EC4"/>
</svg>`

await sharp(Buffer.from(svg)).flatten({ background: '#2D2B4E' }).png().toFile('public/logo.png')
const meta = await sharp('public/logo.png').metadata()
console.log(`wrote public/logo.png ${meta.width}x${meta.height} alpha=${meta.hasAlpha}`)
