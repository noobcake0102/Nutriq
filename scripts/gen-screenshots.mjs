// Gen App Store screenshots (1290x2796, 6.7") — Violet Direction theme
import sharp from 'sharp'
import { mkdirSync } from 'fs'

const W = 1290, H = 2796
mkdirSync('marketing/screenshots', { recursive: true })

// ── Palette ──────────────────────────────────────────────────────────────────
const BG    = '#1E1C35'
const CARD  = '#2D2B4E'
const WARM  = '#252242'
const PLUM  = '#C9BEEA'
const PLUM2 = '#B7A9E2'
const PLUM3 = '#9B8EC4'
const PLUML = '#383461'
const PLUMLL= '#312D56'
const SAGE  = '#A8C5A0'
const SAGED = '#6B8F6B'
const SAGEL = '#2B3A2C'
const TEXT  = '#F2EFE8'
const MUTED = '#9C99BC'
const MUTED2= '#7C79A0'
const ORANGE= '#E0A84E'
const SERIF = "Georgia, 'Times New Roman', serif"
const SANS  = "Arial, Helvetica, sans-serif"

const esc = s => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

const rr = (x,y,w,h,r,fill,xtra='') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${xtra}/>`

const tx = (x,y,str,sz,col,anchor='start',wt=400,fam=SANS) =>
  `<text x="${x}" y="${y}" font-size="${sz}" fill="${col}" text-anchor="${anchor}" font-weight="${wt}" font-family="${fam}">${esc(str)}</text>`

// Bloom logo mark
function bloom(cx, cy, r) {
  const ps = [18,90,162,234,306].map((a,i) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${r*.22|0}" ry="${r*.5|0}" fill="${i===4?SAGE:PLUM3}" opacity="0.75" transform="rotate(${a} ${cx} ${cy})"/>`
  ).join('')
  return `<g>${ps}
    <circle cx="${cx}" cy="${cy}" r="${r*.19|0}" fill="${BG}"/>
    <circle cx="${cx}" cy="${cy}" r="${r*.12|0}" fill="${TEXT}"/>
    <circle cx="${cx}" cy="${cy}" r="${r*.042|0}" fill="${PLUM3}"/>
  </g>`
}

// Hero marketing band at top
function heroBand(id, line1, line2, sub, bandH=530) {
  return `
  <defs><linearGradient id="hg${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#26234E"/>
    <stop offset="1" stop-color="${BG}"/>
  </linearGradient></defs>
  ${rr(0,0,W,bandH,0,`url(#hg${id})`)}
  ${bloom(148, bandH/2 - 10, 90)}
  ${tx(266, bandH/2 - 72, line1, 100, TEXT, 'start', 700, SERIF)}
  ${tx(266, bandH/2 + 52, line2, 100, TEXT, 'start', 700, SERIF)}
  ${tx(266, bandH/2 + 152, sub, 40, MUTED, 'start')}`
}

// iOS status bar
function statusBar(y) {
  return `
  ${tx(70,y+52,'9:41',48,TEXT,'start',700)}
  ${rr(W-284,y+18,178,34,7,MUTED,'opacity="0.28"')}
  ${rr(W-284,y+18,122,34,7,TEXT,'opacity="0.62"')}
  ${rr(W-100,y+22,60,26,5,TEXT,'opacity="0.42"')}`
}

// App header bar
function appHdr(y, right='') {
  return `
  ${rr(0,y,W,114,0,'rgba(28,26,50,0.97)')}
  <line x1="0" y1="${y+113}" x2="${W}" y2="${y+113}" stroke="${PLUM3}" stroke-opacity="0.13" stroke-width="1"/>
  ${tx(70,y+74,'Nutriq',56,PLUM,'start',600,SERIF)}
  ${right ? tx(W-70,y+74,right,33,MUTED,'end') : ''}`
}

// Bottom nav
function navBar(y, active) {
  const labels = ['HOME','MEALS','PANTRY','SHOP','GOALS']
  const ids    = ['home','meals','pantry','shop','goals']
  const tw = W/5
  let o = `${rr(0,y,W,H-y,0,'rgba(24,22,46,0.98)')}`
  o += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${PLUM3}" stroke-opacity="0.15" stroke-width="1"/>`
  labels.forEach((l,i) => {
    const cx = tw*i + tw/2, on = ids[i]===active
    if (on) o += `<rect x="${cx-52}" y="${y}" width="104" height="4" rx="2" fill="${PLUM}"/>`
    o += tx(cx, y+88, l, 28, on?PLUM:MUTED2, 'middle', on?600:400)
  })
  return o
}

// Page header block (label + title + subtitle)
function pageHdr(y, label, title, sub='') {
  let o = tx(70, y, label, 26, MUTED, 'start', 500)
  o += tx(70, y+58, title, 62, TEXT, 'start', 600, SERIF)
  if (sub) o += tx(70, y+106, sub, 33, MUTED, 'start')
  return o
}

// ── SCREEN 1 : Home Dashboard ────────────────────────────────────────────────
function mkHome() {
  const BAND = 530, SB = 62, AH = 114
  const cy = BAND + SB + AH  // 706

  // 2×2 stat grid
  const GX = 60, GY = cy + 40
  const GW = (W - GX*2 - 20) / 2 | 0  // 555
  const GH = 330

  // Meal list card
  const ML_Y = GY + GH*2 + 20*2 + 48
  const MEALS = [
    { ty:'DINNER', name:'Lemon Herb Salmon',  cal:'520', mac:'P 42g  ·  C 28g  ·  F 22g' },
    { ty:'LUNCH',  name:'Greek Quinoa Bowl',   cal:'410', mac:'P 18g  ·  C 52g  ·  F 14g' },
    { ty:'DINNER', name:'Chicken Stir-Fry',    cal:'480', mac:'P 38g  ·  C 44g  ·  F 12g' },
    { ty:'LUNCH',  name:'Turkey Taco Wraps',   cal:'390', mac:'P 32g  ·  C 30g  ·  F 14g' },
  ]
  const RH = 188
  const ML_H = MEALS.length * RH + 100
  const NAV_Y = H - 138

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${rr(0,0,W,H,0,BG)}
  ${heroBand('h','Dinner,','planned.','AI builds your week around your pantry')}
  ${statusBar(BAND)}
  ${appHdr(BAND+SB)}

  <!-- Stat grid row 1 -->
  ${rr(GX,GY,GW,GH,32,CARD)}
  <rect x="${GX}" y="${GY}" width="${GW}" height="${GH}" rx="32" fill="none" stroke="${PLUM3}" stroke-opacity="0.18" stroke-width="1"/>
  ${tx(GX+36,GY+52,'WEIGHT',27,MUTED,'start',500)}
  ${tx(GX+36,GY+148,'183',84,PLUM,'start',700,SERIF)}
  ${tx(GX+36+155,GY+148,'lbs',34,MUTED,'start')}
  ${tx(GX+36,GY+202,'▼ 7.2 lbs total',30,SAGE,'start',600)}
  ${tx(GX+36,GY+244,'12 to goal',26,MUTED,'start')}

  ${rr(GX+GW+20,GY,GW,GH,32,CARD)}
  <rect x="${GX+GW+20}" y="${GY}" width="${GW}" height="${GH}" rx="32" fill="none" stroke="${PLUM3}" stroke-opacity="0.18" stroke-width="1"/>
  ${tx(GX+GW+56,GY+52,'MEAL PLAN',27,MUTED,'start',500)}
  ${tx(GX+GW+56,GY+148,'7',84,PLUM,'start',700,SERIF)}
  ${tx(GX+GW+56+72,GY+148,'meals',34,MUTED,'start')}
  ${tx(GX+GW+56,GY+202,'Plan ready',30,SAGE,'start',600)}
  ${tx(GX+GW+56,GY+244,'1,820 kcal target',26,MUTED,'start')}

  <!-- Stat grid row 2 -->
  ${rr(GX,GY+GH+20,GW,GH,32,CARD)}
  <rect x="${GX}" y="${GY+GH+20}" width="${GW}" height="${GH}" rx="32" fill="none" stroke="${PLUM3}" stroke-opacity="0.18" stroke-width="1"/>
  ${tx(GX+36,GY+GH+20+52,'PANTRY',27,MUTED,'start',500)}
  ${tx(GX+36,GY+GH+20+148,'24',84,PLUM,'start',700,SERIF)}
  ${tx(GX+36+74,GY+GH+20+148,'items',34,MUTED,'start')}
  ${tx(GX+36,GY+GH+20+202,'All fresh',30,SAGE,'start',600)}

  ${rr(GX+GW+20,GY+GH+20,GW,GH,32,CARD)}
  <rect x="${GX+GW+20}" y="${GY+GH+20}" width="${GW}" height="${GH}" rx="32" fill="none" stroke="${PLUM3}" stroke-opacity="0.18" stroke-width="1"/>
  ${tx(GX+GW+56,GY+GH+20+52,'EST. SAVINGS',27,MUTED,'start',500)}
  ${tx(GX+GW+56,GY+GH+20+148,'$56',84,SAGE,'start',700,SERIF)}
  ${tx(GX+GW+56,GY+GH+20+202,'vs eating out',28,MUTED,'start')}

  <!-- Meal list -->
  ${rr(GX,ML_Y,W-GX*2,ML_H,36,CARD)}
  <rect x="${GX}" y="${ML_Y}" width="${W-GX*2}" height="${ML_H}" rx="36" fill="none" stroke="${PLUM3}" stroke-opacity="0.16" stroke-width="1"/>
  ${tx(GX+38,ML_Y+64,'This week\'s meals',37,PLUM,'start',600)}
  ${MEALS.map((m,i) => {
    const ry = ML_Y + 94 + i*RH
    return `
    ${rr(GX+38,ry+16,90,76,14,PLUMLL)}
    ${tx(GX+38+45,ry+58,m.ty,20,PLUM2,'middle',500)}
    ${tx(GX+146,ry+50,m.name,42,TEXT,'start',600,SERIF)}
    ${tx(GX+146,ry+100,m.mac+'  ·  '+m.cal+' cal',28,MUTED,'start')}
    ${i<MEALS.length-1?`<line x1="${GX+38}" y1="${ry+RH}" x2="${W-GX-38}" y2="${ry+RH}" stroke="${PLUM3}" stroke-opacity="0.1" stroke-width="1"/>`:''}
    `
  }).join('')}

  ${navBar(NAV_Y,'home')}
  </svg>`
}

// ── SCREEN 2 : Meal Plan Generation ─────────────────────────────────────────
function mkMeals() {
  const BAND = 530, SB = 62, AH = 114
  const cy = BAND + SB + AH + 30

  const ITEMS = [
    { ty:'Dinner', name:'Pan-Seared Salmon',        cal:520, p:42, c:28, f:22, stars:5 },
    { ty:'Lunch',  name:'Greek Quinoa Power Bowl',   cal:410, p:18, c:52, f:14, stars:4 },
    { ty:'Dinner', name:'Teriyaki Chicken & Rice',   cal:540, p:40, c:58, f:12, stars:5 },
    { ty:'Lunch',  name:'Turkey Avocado Wrap',       cal:390, p:30, c:34, f:16, stars:4 },
    { ty:'Dinner', name:'Beef & Broccoli Stir-Fry',  cal:480, p:38, c:36, f:18, stars:5 },
  ]

  const CX = 60, CW = W - CX*2
  const RH = 220
  const NAV_Y = H - 138

  // Segment control
  const SEG_Y = cy
  const SEG_H = 88

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${rr(0,0,W,H,0,BG)}
  ${heroBand('m','One tap.','Seven meals.','Tell it your goals — it does the math')}
  ${statusBar(BAND)}
  ${appHdr(BAND+SB,'Week of Jun 16')}

  <!-- Segment: Plan | Cookbook -->
  ${rr(CX,SEG_Y,CW,SEG_H,18,WARM)}
  <rect x="${CX}" y="${SEG_Y}" width="${CW}" height="${SEG_H}" rx="18" fill="none" stroke="${PLUM3}" stroke-opacity="0.14" stroke-width="1"/>
  ${rr(CX+6,SEG_Y+6,(CW-12)/2|0,SEG_H-12,14,CARD)}
  ${tx(CX+(CW/4)|0,SEG_Y+52,'Plan',34,PLUM2,'middle',600)}
  ${tx(CX+((CW*3/4)|0),SEG_Y+52,'Cookbook',34,MUTED2,'middle')}

  <!-- Meal cards -->
  ${ITEMS.map((m,i) => {
    const ry = SEG_Y + SEG_H + 20 + i*(RH+12)
    const stars = '★'.repeat(m.stars) + '☆'.repeat(5-m.stars)
    return `
    ${rr(CX,ry,CW,RH,28,CARD)}
    <rect x="${CX}" y="${ry}" width="${CW}" height="${RH}" rx="28" fill="none" stroke="${PLUM3}" stroke-opacity="0.16" stroke-width="1"/>
    ${rr(CX+24,ry+24,86,86,18,PLUMLL)}
    ${tx(CX+24+43,ry+73,m.ty[0],36,PLUM2,'middle',700,SERIF)}
    ${tx(CX+128,ry+54,m.name,42,TEXT,'start',600,SERIF)}
    ${tx(CX+128,ry+100,'${m.cal} cal  ·  P ${m.p}g  ·  C ${m.c}g  ·  F ${m.f}g',28,MUTED,'start')}
    ${tx(CX+128,ry+148,stars,30,ORANGE,'start')}
    ${rr(CX+CW-130,ry+RH-66,104,46,12,SAGEL)}
    ${tx(CX+CW-130+52,ry+RH-38,'Add',28,SAGE,'middle',600)}
    `
  }).join('')}

  ${navBar(NAV_Y,'meals')}
  </svg>`
}

// ── SCREEN 3 : Shopping / Kroger ─────────────────────────────────────────────
function mkShop() {
  const BAND = 530, SB = 62, AH = 114
  const cy = BAND + SB + AH + 20

  const MATCHES = [
    { ing:'Chicken Breast',  prod:'Simple Truth Organic Chicken Breast', ok:true },
    { ing:'Jasmine Rice',    prod:'Kroger Long Grain Jasmine Rice 5lb',   ok:true },
    { ing:'Broccoli',        prod:'Fresh Broccoli Crown',                  ok:true },
    { ing:'Greek Yogurt',    prod:'Fage Total 0% Plain Greek Yogurt',      ok:true },
    { ing:'Olive Oil',       prod:'Kroger Pure Olive Oil 16.9 fl oz',      ok:true },
    { ing:'Cherry Tomatoes', prod:'Roma Tomatoes (each)',                   ok:true },
    { ing:'Spinach',         prod:'Simple Truth Baby Spinach 5oz',          ok:true },
    { ing:'Garlic',          prod:'Garlic Bulb (each)',                     ok:true },
  ]

  const CX = 60, CW = W - CX*2
  const RH = 148
  const NAV_Y = H - 138
  const BTN_Y = NAV_Y - 100

  // Store chip
  const CHIP_Y = cy
  // List
  const LIST_Y = CHIP_Y + 96 + 20

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${rr(0,0,W,H,0,BG)}
  ${heroBand('s','Your cart,','filled.','Every ingredient matched for Kroger pickup')}
  ${statusBar(BAND)}
  ${appHdr(BAND+SB)}

  <!-- Page title -->
  ${tx(CX,cy,'Shopping List',58,TEXT,'start',600,SERIF)}

  <!-- Kroger store chip -->
  ${rr(CX,CHIP_Y+74,350,72,36,CARD)}
  <rect x="${CX}" y="${CHIP_Y+74}" width="350" height="72" rx="36" fill="none" stroke="${PLUM3}" stroke-opacity="0.25" stroke-width="1.5"/>
  <circle cx="${CX+48}" cy="${CHIP_Y+110}" r="24" fill="${SAGE}" opacity="0.2"/>
  ${tx(CX+48,CHIP_Y+116,'K',26,SAGE,'middle',700)}
  ${tx(CX+84,CHIP_Y+100,'Kroger',30,TEXT,'start',600)}
  ${tx(CX+84,CHIP_Y+132,'0.8 mi away',24,MUTED,'start')}
  ${rr(CX+CW-180,CHIP_Y+86,160,48,24,PLUML)}
  ${tx(CX+CW-100,CHIP_Y+116,'Change',26,PLUM2,'middle',500)}

  <!-- Match list -->
  ${MATCHES.map((m,i) => {
    const ry = LIST_Y + i*RH
    return `
    ${rr(CX,ry,CW,RH-8,22,CARD)}
    <rect x="${CX}" y="${ry}" width="${CW}" height="${RH-8}" rx="22" fill="none" stroke="${PLUM3}" stroke-opacity="0.13" stroke-width="1"/>
    <circle cx="${CX+40}" cy="${ry+(RH-8)/2}" r="26" fill="${SAGEL}"/>
    <circle cx="${CX+40}" cy="${ry+(RH-8)/2}" r="26" fill="none" stroke="${SAGE}" stroke-opacity="0.4" stroke-width="1.5"/>
    ${tx(CX+40,ry+(RH-8)/2+10,'✓',30,SAGE,'middle',700)}
    ${tx(CX+82,ry+40,m.ing,36,TEXT,'start',600)}
    ${tx(CX+82,ry+80,m.prod,26,MUTED,'start')}
    `
  }).join('')}

  <!-- Add to cart button -->
  <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${SAGED}"/><stop offset="1" stop-color="#8BBF83"/>
  </linearGradient></defs>
  ${rr(CX,BTN_Y,CW,90,22,'url(#sg)')}
  ${tx(W/2,BTN_Y+55,'Add 8 items to Kroger cart',38,BG,'middle',700)}

  ${navBar(NAV_Y,'shop')}
  </svg>`
}

// ── SCREEN 4 : Pantry ────────────────────────────────────────────────────────
function mkPantry() {
  const BAND = 530, SB = 62, AH = 114
  const cy = BAND + SB + AH + 20

  const ITEMS = [
    { name:'Chicken Breast',  qty:'1.5 lbs',  exp:'Expires in 2 days',  warn:true  },
    { name:'Greek Yogurt',    qty:'32 oz',     exp:'Expires in 5 days',  warn:false },
    { name:'Jasmine Rice',    qty:'5 lbs',     exp:'Expires in 4 months',warn:false },
    { name:'Baby Spinach',    qty:'5 oz bag',  exp:'Expires in 3 days',  warn:true  },
    { name:'Olive Oil',       qty:'16.9 fl oz',exp:'Expires in 6 months',warn:false },
    { name:'Cherry Tomatoes', qty:'1 pint',    exp:'Expires in 4 days',  warn:false },
    { name:'Garlic',          qty:'3 cloves',  exp:'Expires in 2 weeks', warn:false },
  ]

  const CX = 60, CW = W - CX*2
  const RH = 156
  const NAV_Y = H - 138

  // Scan button
  const SCAN_Y = cy + 80

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${rr(0,0,W,H,0,BG)}
  ${heroBand('p','Use what','you have.','Scan receipts — waste less, spend less')}
  ${statusBar(BAND)}
  ${appHdr(BAND+SB,'24 items')}

  ${tx(CX,cy,'My Pantry',58,TEXT,'start',600,SERIF)}

  <!-- Scan receipt button -->
  ${rr(CX,SCAN_Y,CW,82,22,PLUML)}
  <rect x="${CX}" y="${SCAN_Y}" width="${CW}" height="82" rx="22" fill="none" stroke="${PLUM3}" stroke-opacity="0.3" stroke-width="1.5"/>
  ${tx(W/2,SCAN_Y+48,'Scan Receipt  +',36,PLUM2,'middle',600)}

  <!-- Pantry items -->
  ${ITEMS.map((it,i) => {
    const ry = SCAN_Y + 82 + 16 + i*RH
    const expCol = it.warn ? ORANGE : MUTED
    const leftBar = it.warn ? ORANGE : PLUM3
    return `
    ${rr(CX,ry,CW,RH-8,22,CARD)}
    <rect x="${CX}" y="${ry}" width="${CW}" height="${RH-8}" rx="22" fill="none" stroke="${PLUM3}" stroke-opacity="0.13" stroke-width="1"/>
    <rect x="${CX}" y="${ry}" width="5" height="${RH-8}" rx="2" fill="${leftBar}" opacity="0.6"/>
    ${rr(CX+22,ry+18,90,90,16,PLUMLL)}
    ${tx(CX+22+45,ry+70,it.name[0],40,PLUM2,'middle',700,SERIF)}
    ${tx(CX+130,ry+44,it.name,40,TEXT,'start',600)}
    ${tx(CX+130,ry+86,it.qty,28,MUTED,'start')}
    ${rr(CX+CW-260,ry+26,240,48,24,it.warn?'#33291a':WARM)}
    <rect x="${CX+CW-260}" y="${ry+26}" width="240" height="48" rx="24" fill="none" stroke="${expCol}" stroke-opacity="0.35" stroke-width="1"/>
    ${tx(CX+CW-140,ry+56,it.exp,24,expCol,'middle',500)}
    `
  }).join('')}

  ${navBar(NAV_Y,'pantry')}
  </svg>`
}

// ── Generate all 4 ───────────────────────────────────────────────────────────
const SCREENS = [
  { file:'1-home.png',    svg: mkHome()   },
  { file:'2-meals.png',   svg: mkMeals()  },
  { file:'3-shop.png',    svg: mkShop()   },
  { file:'4-pantry.png',  svg: mkPantry() },
]

for (const { file, svg } of SCREENS) {
  await sharp(Buffer.from(svg))
    .flatten({ background: BG })
    .png()
    .toFile(`marketing/screenshots/${file}`)
  console.log('✓', file)
}
console.log('Done — marketing/screenshots/')
