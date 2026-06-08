import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')

// Build 5 petal ellipses rotated every 72 degrees.
// Each petal is an ellipse centered slightly above the origin, then rotated.
function petal(angleDeg, color) {
  // Petal: rx=108 ry=210, offset upward by 140 so its base stays near center
  const a = (angleDeg * Math.PI) / 180
  const cos = Math.cos(a).toFixed(6)
  const sin = Math.sin(a).toFixed(6)
  return `
    <ellipse cx="0" cy="-150" rx="105" ry="215"
      fill="${color}" fill-opacity="0.92"
      transform="rotate(${angleDeg} 0 0)"/>`
}

const petalColors = ['#e8a4c8', '#d4a0e8', '#b87fd4', '#9b72cf', '#c9a0dc']
const petals = petalColors.map((c, i) => petal(90 + i * 72, c)).join('\n')

// Subtle inner glow ring on the dark center circle
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-512 -512 1024 1024">
  <!-- Background -->
  <rect x="-512" y="-512" width="1024" height="1024" fill="#4a1a6e"/>

  <!-- Petals -->
  <g>
    ${petals}
  </g>

  <!-- Center dark circle -->
  <circle cx="0" cy="0" r="88" fill="#4a1a6e"/>

  <!-- Subtle glow ring -->
  <circle cx="0" cy="0" r="84" fill="none" stroke="#7a3aaa" stroke-width="3" opacity="0.5"/>

  <!-- Inner cream dot -->
  <circle cx="0" cy="0" r="38" fill="#faf5fd"/>

  <!-- Tiny plum center point for depth -->
  <circle cx="0" cy="0" r="10" fill="#6b2fa0" opacity="0.6"/>
</svg>`

await sharp(Buffer.from(svg))
  .resize(1024, 1024)
  .png()
  .toFile(OUT)

console.log('✓ App icon saved to', OUT)
