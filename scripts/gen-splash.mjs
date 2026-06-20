// Render a dark Violet Direction launch splash (2732x2732, used by Capacitor's
// Splash.imageset at all scales via aspectFill) with the bloom centered.
import sharp from 'sharp'

const S = 2732, C = S / 2
const RX = 197, RY = 450 // bloom ~900px tall, ~33% of canvas
const petals = [18, 90, 162, 234, 306]
  .map((a, i) =>
    `<ellipse cx="${C}" cy="${C}" rx="${RX}" ry="${RY}" fill="${i === 4 ? '#A8C5A0' : '#9B8EC4'}" opacity="0.7" transform="rotate(${a} ${C} ${C})"/>`
  )
  .join('')

const svg = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1E1C35"/><stop offset="1" stop-color="#2D2B4E"/>
  </linearGradient></defs>
  <rect width="${S}" height="${S}" fill="url(#g)"/>
  ${petals}
  <circle cx="${C}" cy="${C}" r="168" fill="#1E1C35"/>
  <circle cx="${C}" cy="${C}" r="106" fill="#F2EFE8"/>
  <circle cx="${C}" cy="${C}" r="37" fill="#9B8EC4"/>
</svg>`

const buf = await sharp(Buffer.from(svg)).flatten({ background: '#1E1C35' }).png().toBuffer()
const dir = 'ios/App/App/Assets.xcassets/Splash.imageset'
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await sharp(buf).toFile(`${dir}/${f}`)
}
console.log('wrote 3 splash PNGs (2732x2732, dark)')
