const ENRICHMENT = [
  { prefix: 'fresh raw', terms: ['chicken breast','chicken thigh','chicken leg','chicken wing','ground chicken','ground beef','ground turkey','beef','steak','pork chop','pork loin','pork tenderloin','bacon','sausage','lamb','veal','bison'] },
  { prefix: 'fresh raw', terms: ['salmon','tuna','shrimp','tilapia','cod','halibut','mahi','scallop','crab','lobster','clam','oyster','fish fillet','fish'] },
  { prefix: 'fresh', terms: ['spinach','kale','arugula','lettuce','tomato','onion','garlic','ginger','broccoli','cauliflower','carrot','celery','zucchini','cucumber','pepper','mushroom','potato','sweet potato','avocado','lemon','lime','apple','banana','strawberry','blueberry','mango','peach','basil','cilantro','parsley','thyme','rosemary'] },
]
const STRIP = ['cooked','frozen','dried','chopped','diced','sliced','minced','grilled','fried','baked','raw','large','small','medium','ripe','whole','boneless','skinless','lean','organic']

export function cleanIngredient(raw) {
  let q = raw.toLowerCase()
    .replace(/^\d[\d./\s]*(cup|tbsp|tsp|oz|lb|g|kg|clove|cloves|can|bunch|piece|medium|large|small)s?\s*/i, '')
    .trim()
  STRIP.forEach(w => { q = q.replace(new RegExp(`\\b${w}\\b`, 'gi'), '').trim() })
  q = q.replace(/\s+/g, ' ').trim() || raw
  for (const { prefix, terms } of ENRICHMENT) {
    if (terms.some(t => q.includes(t) || t.includes(q))) return prefix ? `${prefix} ${q}` : q
  }
  return q
}
