import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../marketing/screenshots')
mkdirSync(OUT, { recursive: true })

// 6.7" iPhone App Store size
const W = 1290, H = 2796

// Each frame: a branded headline band up top + a device-screen placeholder below.
// Drop a real 1170x2532-ish capture into the placeholder area (centered).
const FRAMES = [
  { file: '1-hero.png',     headline: 'Dinner, decided.',            sub: 'AI plans your week around your goals & pantry', grad: ['#6a1fd0', '#e83a82'] },
  { file: '2-plan.png',     headline: 'A week of meals\nin one tap', sub: 'Pick what you need — AI fills the rest',         grad: ['#7b2fd6', '#b13fd0'] },
  { file: '3-cart.png',     headline: 'Your cart, filled\nfor pickup', sub: 'Every ingredient matched to real products',    grad: ['#9b2bd6', '#e83a82'] },
  { file: '4-pantry.png',   headline: 'Uses what you\nalready have',  sub: 'Scan your pantry — waste less, spend less',      grad: ['#6a1fd0', '#9d5cf0'] },
  { file: '5-learns.png',   headline: 'It learns what\nyou love',     sub: 'Rate meals — it gets sharper every week',         grad: ['#7b2fd6', '#ef4d8a'] },
  { file: '6-goals.png',    headline: 'Hit your goals,\nskip the math', sub: 'Calories & macros calculated for you',         grad: ['#9b2bd6', '#b13fd0'] },
]

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function svgFor({ headline, sub, grad }) {
  const lines = headline.split('\n')
  const headSvg = lines.map((l, i) =>
    `<text x="${W / 2}" y="${300 + i * 130}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="108" font-weight="700" fill="#ffffff">${esc(l)}</text>`
  ).join('\n')
  // device placeholder: rounded white card the real screenshot sits in
  const dvW = 980, dvH = 1900, dvX = (W - dvW) / 2, dvY = 740
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${grad[0]}"/>
        <stop offset="1" stop-color="${grad[1]}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    ${headSvg}
    <text x="${W / 2}" y="${320 + (lines.length - 1) * 130 + 70}" text-anchor="middle" font-family="'Segoe UI', Helvetica, Arial, sans-serif" font-size="46" fill="#ffffffcc">${esc(sub)}</text>
    <rect x="${dvX}" y="${dvY}" width="${dvW}" height="${dvH}" rx="56" fill="#ffffff" opacity="0.16"/>
    <rect x="${dvX + 4}" y="${dvY + 4}" width="${dvW - 8}" height="${dvH - 8}" rx="52" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="3" stroke-dasharray="14 14"/>
    <text x="${W / 2}" y="${dvY + dvH / 2}" text-anchor="middle" font-family="'Segoe UI', Helvetica, Arial, sans-serif" font-size="40" fill="#ffffffaa">drop screenshot here</text>
  </svg>`
}

for (const f of FRAMES) {
  await sharp(Buffer.from(svgFor(f))).png().toFile(resolve(OUT, f.file))
  console.log('✓', f.file)
}
