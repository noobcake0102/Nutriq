// Minimal normalizer — strips a leading quantity/unit and tidies whitespace.
// Used as (a) the query string sent to Kroger and (b) the stable key for brand
// preferences. All real ingredient intelligence — specificity defaults and the
// specific→generic fallback search — lives in ONE place, server-side, in
// netlify/functions/kroger.js. This function is intentionally dumb so there is
// no second layer of text-munging to fight with.
export function cleanIngredient(raw) {
  const s = (raw || '').toLowerCase()
    .replace(/^\d[\d./\s]*(cup|tbsp|tsp|oz|lb|lbs|g|kg|clove|cloves|can|bunch|piece|medium|large|small)s?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  return s || (raw || '').toLowerCase().trim()
}
