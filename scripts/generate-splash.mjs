import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SPLASH_DIR = resolve(__dirname, '../ios/App/App/Assets.xcassets/Splash.imageset')

// Splash is 2732x2732 — bloom logo centered, smaller than icon (25% of canvas)
function buildSVG(size) {
  const scale = size / 1024
  const petalRx = Math.round(105 * scale)
  const petalRy = Math.round(215 * scale)
  const petalOffset = Math.round(150 * scale)
  const darkR = Math.round(88 * scale)
  const creamR = Math.round(38 * scale)

  const colors = ['#e8a4c8', '#d4a0e8', '#b87fd4', '#9b72cf', '#c9a0dc']
  const petals = colors.map((c, i) => {
    const deg = 90 + i * 72
    return `<ellipse cx="0" cy="-${petalOffset}" rx="${petalRx}" ry="${petalRy}" fill="${c}" fill-opacity="0.92" transform="rotate(${deg} 0 0)"/>`
  }).join('\n    ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-${size/2} -${size/2} ${size} ${size}">
  <rect x="-${size/2}" y="-${size/2}" width="${size}" height="${size}" fill="#faf8f5"/>
  <g transform="scale(0.42)">
    ${petals}
    <circle cx="0" cy="0" r="${darkR}" fill="#4a1a6e"/>
    <circle cx="0" cy="0" r="${darkR - 4}" fill="none" stroke="#7a3aaa" stroke-width="3" opacity="0.5"/>
    <circle cx="0" cy="0" r="${creamR}" fill="#faf5fd"/>
    <circle cx="0" cy="0" r="${Math.round(10 * scale)}" fill="#6b2fa0" opacity="0.6"/>
  </g>
</svg>`
}

// All three splash sizes use the same 2732 image — different scales in Xcode
const svg = buildSVG(2732)
const buf = Buffer.from(svg)

for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await sharp(buf).resize(2732, 2732).png().toFile(resolve(SPLASH_DIR, name))
  console.log('✓', name)
}
