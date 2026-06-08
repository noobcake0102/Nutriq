export const FD = {
  '021130126026': { name: 'Whole Milk (1 gal)', brand: 'Lucerne', cal: 150, pro: 8, carb: 12, fat: 8, cat: 'Dairy', perish: true, price: 4.99 },
  '036800401556': { name: 'Large Eggs (12ct)', brand: 'Great Value', cal: 70, pro: 6, carb: 0, fat: 5, cat: 'Dairy', perish: true, price: 3.49 },
  '024000163756': { name: 'Chicken Breast 2lb', brand: 'Tyson', cal: 130, pro: 26, carb: 0, fat: 3, cat: 'Meat', perish: true, price: 8.99 },
  '070038640844': { name: 'Greek Yogurt', brand: 'Chobani', cal: 90, pro: 17, carb: 6, fat: 0, cat: 'Dairy', perish: true, price: 1.99 },
  '041497026135': { name: 'Brown Rice 2lb', brand: 'Store Brand', cal: 210, pro: 5, carb: 44, fat: 2, cat: 'Grains', perish: false, price: 2.49 },
  '041497014132': { name: 'Pasta 1lb', brand: 'Barilla', cal: 200, pro: 7, carb: 42, fat: 1, cat: 'Grains', perish: false, price: 1.79 },
  '038000138416': { name: 'Corn Flakes', brand: "Kellogg's", cal: 100, pro: 2, carb: 24, fat: 0, cat: 'Breakfast', perish: false, price: 3.99 },
  '028400090315': { name: 'Doritos', brand: 'Frito-Lay', cal: 140, pro: 2, carb: 18, fat: 7, cat: 'Snacks', perish: false, price: 4.49 },
}

export async function lookupBarcode(code) {
  const loc = FD[code.trim()]
  if (loc) return { name: loc.name, brand: loc.brand, calories: loc.cal, protein: loc.pro, carbs: loc.carb, fat: loc.fat, category: loc.cat, perishable: loc.perish, price: loc.price }
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
    const j = await res.json()
    if (j.status === 1) {
      const p = j.product
      return {
        name: p.product_name || `Product ${code.slice(-4)}`, brand: p.brands || '',
        calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
        protein: Math.round(p.nutriments?.proteins_100g || 0),
        carbs: Math.round(p.nutriments?.carbohydrates_100g || 0),
        fat: Math.round(p.nutriments?.fat_100g || 0),
        category: 'Other', perishable: false, price: 0,
      }
    }
  } catch {}
  return { name: `Product ${code.slice(-4)}`, brand: '', calories: 0, protein: 0, carbs: 0, fat: 0, category: 'Other', perishable: false, price: 0 }
}
