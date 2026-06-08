export const ACT = {
  sedentary: { label: 'Sedentary', desc: 'Desk job, little exercise', mult: 1.2 },
  light: { label: 'Lightly active', desc: '1-3 days/week', mult: 1.375 },
  moderate: { label: 'Moderately active', desc: '3-5 days/week', mult: 1.55 },
  active: { label: 'Very active', desc: '6-7 days/week', mult: 1.725 },
  athlete: { label: 'Athlete', desc: '2x training/day', mult: 1.9 },
}

export function calcBMR({ weight, height, age, sex }) {
  if (!weight || !height || !age) return 0
  const w = weight * 0.453592, h = height * 2.54
  return sex === 'female' ? 10 * w + 6.25 * h - 5 * age - 161 : 10 * w + 6.25 * h - 5 * age + 5
}

export function calcMacros(tdee, diet, gt) {
  const cal = Math.round(tdee + ({ lose: -500, maintain: 0, gain: 300 }[gt] || 0))
  const sp = {
    balanced: { p: .25, c: .5, f: .25 }, keto: { p: .3, c: .05, f: .65 },
    'high-protein': { p: .4, c: .35, f: .25 }, 'low-carb': { p: .3, c: .2, f: .5 },
    vegan: { p: .2, c: .55, f: .25 }, vegetarian: { p: .22, c: .53, f: .25 },
    mediterranean: { p: .25, c: .45, f: .3 }, paleo: { p: .35, c: .25, f: .4 },
  }
  const r = sp[diet] || sp.balanced
  return {
    calories: cal,
    protein: Math.round(cal * r.p / 4),
    carbs: Math.round(cal * r.c / 4),
    fat: Math.round(cal * r.f / 9),
  }
}
