// Imports a recipe from any URL. Strategy:
//   1. Fetch the page server-side (no CORS limits).
//   2. Prefer schema.org Recipe JSON-LD — most recipe sites embed it, so this
//      is fast and accurate.
//   3. Fall back to Claude extracting the recipe from the stripped page text.

async function fetchWithTimeout(url, opts = {}, ms = 8000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try { return await fetch(url, { ...opts, signal: controller.signal }); }
  finally { clearTimeout(t); }
}

// ── JSON-LD Recipe extraction ──────────────────────────────────────────────
function asArray(x) { return Array.isArray(x) ? x : x == null ? [] : [x]; }

function flattenInstructions(ri) {
  const out = [];
  for (const step of asArray(ri)) {
    if (typeof step === 'string') out.push(step);
    else if (step?.['@type'] === 'HowToSection') {
      for (const s of asArray(step.itemListElement)) out.push(typeof s === 'string' ? s : s?.text);
    } else if (step?.text) out.push(step.text);
    else if (step?.name) out.push(step.name);
  }
  return out.map(s => String(s).trim()).filter(Boolean);
}

function findRecipeNode(json) {
  const nodes = [];
  const visit = n => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(visit); return; }
    const t = n['@type'];
    if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) nodes.push(n);
    if (n['@graph']) visit(n['@graph']);
  };
  visit(json);
  return nodes[0] || null;
}

function extractJsonLd(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1].trim());
      const node = findRecipeNode(json);
      if (node && (node.recipeIngredient || node.recipeInstructions)) {
        const image = node.image?.url || (Array.isArray(node.image) ? node.image[0]?.url || node.image[0] : node.image) || null;
        return {
          name: node.name || '',
          servings: node.recipeYield ? String(asArray(node.recipeYield)[0]).replace(/[^0-9]/g, '') || '' : '',
          ingredients: asArray(node.recipeIngredient).map(s => String(s).trim()).filter(Boolean),
          steps: flattenInstructions(node.recipeInstructions),
          image: typeof image === 'string' ? image : null,
        };
      }
    } catch { /* try next block */ }
  }
  return null;
}

// ── HTML → plain text for the AI fallback ───────────────────────────────────
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim();
}

async function aiExtract(text, apiKey) {
  const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: 'Extract the recipe from this web page text. Respond with ONLY raw JSON: {"name":"...","servings":4,"ingredients":["2 cups flour","1 tsp salt"],"steps":["Mix...","Bake..."]}. Ingredients as plain strings with quantities. If there is no real recipe, return {"name":""}.',
      messages: [{ role: 'user', content: text.slice(0, 9000) }],
    }),
  }, 12000);
  const data = await res.json();
  const raw = data?.content?.[0]?.text || '';
  const match = raw.replace(/```json/gi, '').replace(/```/g, '').match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : null;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  const url = (body.url || '').trim();
  if (!/^https?:\/\//i.test(url)) return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Enter a valid recipe link (https://…)' }) };

  try {
    const res = await fetchWithTimeout(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NutriqBot/1.0; +https://nutriqai.com)', 'Accept': 'text/html' },
    }, 8000);
    if (!res.ok) return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: `Couldn't open that page (status ${res.status}). Try the original recipe link.` }) };
    const html = await res.text();

    let recipe = extractJsonLd(html);
    let via = 'structured';
    if (!recipe || recipe.ingredients.length === 0) {
      if (process.env.ANTHROPIC_API_KEY) {
        recipe = await aiExtract(htmlToText(html), process.env.ANTHROPIC_API_KEY);
        via = 'ai';
      }
    }
    if (!recipe || !recipe.name || (recipe.ingredients || []).length === 0) {
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: "Couldn't find a recipe on that page. Try a direct link to the recipe itself." }) };
    }
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe: { ...recipe, source_url: url }, via }),
    };
  } catch (err) {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: err.name === 'AbortError' ? 'That page took too long to load.' : err.message }) };
  }
};
