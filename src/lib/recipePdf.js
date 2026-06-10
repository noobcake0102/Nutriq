import { jsPDF } from 'jspdf'

// Brand palette (matches the app)
const PLUM = [74, 26, 110]
const PLUM2 = [123, 47, 214]
const ROSE = [239, 77, 138]
const TEXT = [42, 26, 58]
const MUTED = [138, 120, 152]

let _logoData = null
async function logoDataUrl() {
  if (_logoData) return _logoData
  try {
    const res = await fetch('/logo.png')
    const blob = await res.blob()
    _logoData = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob) })
  } catch { _logoData = null }
  return _logoData
}

// Build a branded one-page recipe PDF. Returns a Blob.
export async function buildRecipePdf(recipe) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 48
  let y = 0

  // ── Header band ──
  doc.setFillColor(...PLUM)
  doc.rect(0, 0, W, 92, 'F')
  const logo = await logoDataUrl()
  if (logo) { try { doc.addImage(logo, 'PNG', M, 26, 40, 40) } catch {} }
  doc.setTextColor(255, 255, 255)
  doc.setFont('times', 'bold'); doc.setFontSize(24)
  doc.text('Nutriq', logo ? M + 52 : M, 54)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(230, 210, 245)
  doc.text('FEED YOUR FAMILY BETTER', logo ? M + 52 : M, 68)

  y = 140

  // ── Title ──
  doc.setTextColor(...PLUM)
  doc.setFont('times', 'bold'); doc.setFontSize(28)
  const title = recipe.title || recipe.name || 'Recipe'
  const titleLines = doc.splitTextToSize(title, W - M * 2)
  doc.text(titleLines, M, y)
  y += titleLines.length * 30 + 4

  // ── Meta row ──
  const meta = []
  if (recipe.servings) meta.push(`Serves ${recipe.servings}`)
  if (recipe.prep_time) meta.push(`Prep ${recipe.prep_time}`)
  if (recipe.cook_time) meta.push(`Cook ${recipe.cook_time}`)
  if (recipe.meal_type) meta.push(String(recipe.meal_type).replace(/_/g, ' '))
  if (meta.length) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...MUTED)
    doc.text(meta.join('    •    '), M, y)
    y += 22
  }

  // accent divider
  doc.setDrawColor(...ROSE); doc.setLineWidth(2)
  doc.line(M, y, M + 60, y); y += 24

  // ── Ingredients ──
  doc.setFont('times', 'bold'); doc.setFontSize(15); doc.setTextColor(...PLUM2)
  doc.text('Ingredients', M, y); y += 20
  doc.setFontSize(11)
  const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  ings.forEach(ing => {
    const amount = typeof ing === 'object' ? (ing.amount || '') : ''
    const name = typeof ing === 'object' ? (ing.name || '') : String(ing)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...PLUM2)
    doc.text(amount, M, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
    const nameLines = doc.splitTextToSize(name, W - M * 2 - 110)
    doc.text(nameLines, M + 100, y)
    y += Math.max(nameLines.length * 14, 16)
    if (y > H - 90) { doc.addPage(); y = M }
  })
  y += 12

  // ── Instructions ──
  if (y > H - 140) { doc.addPage(); y = M }
  doc.setFont('times', 'bold'); doc.setFontSize(15); doc.setTextColor(...PLUM2)
  doc.text('Instructions', M, y); y += 20
  const steps = Array.isArray(recipe.steps) ? recipe.steps : []
  steps.forEach((step, i) => {
    const text = String(step).replace(/^step\s*\d+:?\s*/i, '')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...ROSE)
    doc.text(`${i + 1}`, M, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
    const lines = doc.splitTextToSize(text, W - M * 2 - 24)
    doc.text(lines, M + 22, y)
    y += lines.length * 15 + 8
    if (y > H - 70) { doc.addPage(); y = M }
  })

  // ── Footer ──
  doc.setDrawColor(236, 229, 220); doc.setLineWidth(0.5)
  doc.line(M, H - 50, W - M, H - 50)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED)
  doc.text('Made with Nutriq  ·  nutriqai.com', M, H - 34)

  return doc.output('blob')
}
