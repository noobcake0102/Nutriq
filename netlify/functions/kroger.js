// Production switch is config-only: set KROGER_ENV=production in Netlify (along
// with the production client id/secret) to go live. Defaults to the CE sandbox.
const KROGER_PROD = process.env.KROGER_ENV === "production";
const KROGER_BASE = KROGER_PROD ? "https://api.kroger.com/v1" : "https://api-ce.kroger.com/v1";
const KROGER_AUTH_BASE = `${KROGER_BASE}/connect/oauth2`;

// ── Ambiguous staple defaults ──────────────────────────────────────────
// When a recipe lists a bare generic name, fill in the most common grocery
// variant a shopper would actually buy. This avoids "butter" matching a random
// flavored spread, or "onion" matching pearl/pickled onions.
// Principle: every generic staple that comes in multiple distinct SKUs gets a
// sensible default. Specific names from the recipe (e.g. "salted butter",
// "red onion") are left untouched because they aren't bare generics.
const STAPLE_DEFAULTS = {
  "butter": "unsalted butter",
  "onion": "yellow onion",
  "onions": "yellow onion",
  "pepper": "black pepper",
  "bell pepper": "green bell pepper",
  "sugar": "granulated sugar",
  "brown sugar": "light brown sugar",
  "flour": "all-purpose flour",
  "rice": "white rice",
  "milk": "whole milk",
  "cheese": "shredded cheddar cheese",
  "potato": "russet potato",
  "potatoes": "russet potato",
  "bread": "white sandwich bread",
  "vinegar": "white vinegar",
  "oil": "vegetable oil",
  "broth": "chicken broth",
  "stock": "chicken stock",
  "tomatoes": "roma tomato",
  "tomato": "roma tomato",
  "lettuce": "romaine lettuce",
  "yogurt": "plain greek yogurt",
  "mustard": "yellow mustard",
  "beans": "black beans",
};

// Categories. `fresh: true` means we prepend the fresh/frozen preference
// (defaults to "fresh" so fresh ranks first; frozen variants still appear as
// swap alternatives in the result list).
const INGREDIENT_ENRICHMENT = {
  poultry: {
    terms: ["chicken breast","chicken thigh","chicken leg","chicken wing","ground chicken","whole chicken","chicken"],
    // Kroger returns breasts for "boneless skinless chicken thighs" (it ignores
    // "thighs"), so for thighs search the short term that actually surfaces them.
    transform: q => {
      if (q.includes("thigh")) return "chicken thighs";
      if (q.includes("breast") && !q.includes("ground") && !q.includes("boneless")) return `boneless skinless ${q}`;
      return q;
    },
  },
  meat: {
    terms: ["ground beef","ground turkey","beef","steak","pork chop","pork loin",
            "pork tenderloin","sausage","lamb","veal","bison","pork"],
    transform: q => q,
  },
  bacon: { terms: ["bacon"], transform: q => q },
  seafood: {
    terms: ["salmon","tuna","shrimp","tilapia","cod","halibut","mahi","scallop",
            "crab","lobster","clam","oyster","fish fillet","fish"],
    transform: q => q,
  },
  // Fresh herbs — "dill" alone matches dill PICKLES; "fresh dill" finds the herb.
  herbs: {
    // oregano/thyme/rosemary/sage/bay are usually bought DRIED (spice aisle), so
    // they live in `spices` below — not here — to avoid forcing a "fresh" prefix.
    terms: ["dill","basil","cilantro","parsley","mint","chives","tarragon","dill weed"],
    transform: q => /\b(fresh|dried|ground)\b/.test(q) ? q : `fresh ${q}`,
  },
  // Citrus — "lemon" alone matches lemon SODA/lemonade; "fresh lemon" finds fruit.
  citrus: {
    terms: ["lemon","lime","orange","lemons","limes","oranges"],
    transform: q => /\b(fresh|juice|zest|bag)\b/.test(q) ? q : `fresh ${q}`,
  },
  // Spices — bare "cumin" matches seasoning blends; "ground cumin" finds the spice.
  spices: {
    terms: ["cumin","coriander","turmeric","paprika","cayenne","chili powder",
            "curry powder","garlic powder","onion powder","cinnamon","nutmeg",
            "oregano","thyme","rosemary","sage","bay leaf"],
    transform: q => {
      if (/\b(ground|powder|whole|seed|stick)\b/.test(q)) return q;
      if (["cumin","coriander","turmeric"].includes(q)) return `ground ${q}`;
      return q;
    },
  },
  produce: {
    terms: ["spinach","kale","arugula","lettuce","tomato","onion","garlic","ginger",
            "broccoli","cauliflower","carrot","celery","zucchini","cucumber","bell pepper",
            "mushroom","potato","sweet potato","avocado","apple",
            "banana","strawberry","blueberry","mango","peach"],
    transform: q => q,
  },
  dairy: {
    fresh: false,
    terms: ["milk","cream","butter","cheese","yogurt","sour cream",
            "cream cheese","cottage cheese","ricotta","mozzarella","cheddar",
            "parmesan","feta","goat cheese","heavy cream","half and half"],
    // "plain greek yogurt" — keep both qualifiers so Kroger narrows to plain
    // Greek varieties. Dropping "plain" surfaces flavored Yoplait as top result.
    // Bare "yogurt" stays short to avoid matching dips/sour cream.
    transform: q => {
      if (q.includes("yogurt")) {
        if (q.includes("greek") && q.includes("plain")) return "plain greek yogurt";
        if (q.includes("greek")) return "greek yogurt";
        return "yogurt";
      }
      return q;
    },
  },
  eggs: { fresh: false, terms: ["egg","eggs"], transform: () => "large eggs" },
};

// Units we strip from the front of an ingredient (imported recipes use a wide
// range, including spelled-out and metric). Longest-first isn't needed because
// we anchor to the start and require a word boundary.
const UNITS = ["cups","cup","tablespoons","tablespoon","tbsp","teaspoons","teaspoon",
  "tsp","ounces","ounce","oz","pounds","pound","lbs","lb","grams","gram","kg","g",
  "ml","milliliters","liters","cloves","clove","cans","can","bunches","bunch",
  "pieces","piece","stalks","stalk","slices","slice","sprigs","sprig","heads","head",
  "pinch","pinches","dash","sticks","stick","packages","package","pkg","containers",
  "container","jars","jar","medium","large","small"].join("|");

// Core term: strip quantities (incl. unicode fractions), parenthetical notes,
// units, and cooking methods, then fill bare-generic staples. Keeps it SHORT —
// Kroger search rewards 1-3 word grocery-natural terms, and long literal strings
// like "½ cup dry red wine (passata)" return junk.
function coreTerm(raw) {
  const descriptors = ["cooked","frozen","dried","chopped","diced","sliced","minced",
    "grilled","fried","baked","raw","ripe","whole","lean","organic",
    "fresh","large","small","medium"];
  let q = raw.toLowerCase()
    // 1. drop parenthetical notes: "(70-80%)", "(passata)", "(2% or whole milk)"
    .replace(/\([^)]*\)/g, " ")
    // 2. unicode fractions → space so "10½" and "½ cup" both clear cleanly
    .replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g, " ")
    // 3. strip a leading quantity: digits, fractions, ranges, percent signs
    .replace(/^[\d./%\s-]+/, "")
    // 4. strip a leading unit word (now that the number is gone)
    .replace(new RegExp(`^(?:${UNITS})\\b\\s*`, "i"), "")
    // 5. any stray leading non-letters (e.g. a leftover "/")
    .replace(/^[^a-z]+/i, "")
    .trim();
  descriptors.forEach(w => { q = q.replace(new RegExp(`\\b${w}\\b`, "gi"), "").trim(); });
  q = q.replace(/\s+/g, " ").trim() || raw.toLowerCase();
  if (STAPLE_DEFAULTS[q]) q = STAPLE_DEFAULTS[q];
  return q;
}

// Specific term: core + a light category transform (e.g. boneless skinless chicken).
function specificTerm(raw) {
  const q = coreTerm(raw);
  for (const cat of Object.values(INGREDIENT_ENRICHMENT)) {
    if (cat.terms.some(t => q.includes(t) || t.includes(q))) return cat.transform(q);
  }
  return q;
}

// fetch with a hard timeout so one slow Kroger response can't hang the whole
// Netlify function (which would otherwise hit the 10s limit and 502).
async function fetchWithTimeout(url, opts = {}, ms = 6000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: "",
    };
  }

  const CLIENT_ID = process.env.KROGER_CLIENT_ID;
  const CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET;
  const REDIRECT_URI = process.env.KROGER_REDIRECT_URI || "https://nutriqai.com/kroger-callback";

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Kroger credentials not configured" }),
    };
  }

  let body = {};
  try {
    if (event.body) body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const { action } = body;

  // ── ACTION: Get client credentials token (no user auth — for product search only) ──
  if (action === "get_client_token") {
    try {
      const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
      const response = await fetch(`${KROGER_AUTH_BASE}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          scope: "product.compact",
        }).toString(),
      });
      const data = await response.json();
      if (!response.ok) {
        return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: data.error_description || "Token fetch failed" }) };
      }
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: data.access_token, expires_in: data.expires_in }),
      };
    } catch (err) {
      return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message }) };
    }
  }

  // ── ACTION: Get auth URL for user to authorize Kroger ──
  if (action === "get_auth_url") {
    const scope = "profile.compact cart.basic:write product.compact";
    const authUrl =
      `${KROGER_AUTH_BASE}/authorize` +
      `?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}`;
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ auth_url: authUrl }),
    };
  }

  // ── ACTION: Exchange auth code for access token ──
  if (action === "exchange_code") {
    const { code } = body;
    if (!code) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing code" }),
      };
    }
    try {
      const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
      const response = await fetch(`${KROGER_AUTH_BASE}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        }).toString(),
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          statusCode: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: data.error_description || "Token exchange failed" }),
        };
      }
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
        }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ── ACTION: Refresh access token ──
  if (action === "refresh_token") {
    const { refresh_token } = body;
    if (!refresh_token) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing refresh_token" }),
      };
    }
    try {
      const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
      const response = await fetch(`${KROGER_AUTH_BASE}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token,
        }).toString(),
      });
      const data = await response.json();
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
        }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ── ACTION: Search for products ──
  if (action === "search_products") {
    const { query, location_id, access_token, fresh_pref } = body;
    if (!query || !access_token) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing query or access_token" }),
      };
    }
    try {
      // ONE Kroger call per item, with a hard 6s timeout. Specific term only —
      // no second fallback call (that's what risked the Netlify 10s timeout).
      const term = specificTerm(query);
      const params = new URLSearchParams({ "filter.term": term, "filter.limit": "20" });
      if (location_id) params.set("filter.locationId", location_id);

      let response;
      try {
        response = await fetchWithTimeout(`${KROGER_BASE}/products?${params}`, {
          headers: { Authorization: `Bearer ${access_token}`, Accept: "application/json" },
        }, 6000);
      } catch (e) {
        // Timed out / aborted — return empty so the client moves on, never hangs
        return {
          statusCode: 200,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
          body: JSON.stringify({ products: [], term, timed_out: true }),
        };
      }

      const data = await response.json();
      if (!response.ok) {
        return {
          statusCode: response.status,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            error: data.message || "Product search failed",
            needs_reauth: response.status === 401 || response.status === 403,
          }),
        };
      }
      const products = (data.data || []).map((p) => ({
        id: p.productId,
        name: p.description,
        brand: p.brand,
        image: p.images?.[0]?.sizes?.find((s) => s.size === "medium")?.url || null,
        price: p.items?.[0]?.price?.regular || null,
        promo_price: p.items?.[0]?.price?.promo || null,
        size: p.items?.[0]?.size || null,
        upc: p.upc,
        in_stock: p.items?.[0]?.inventory?.stockLevel !== "TEMPORARILY_OUT_OF_STOCK",
      }));
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ products, term }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ── ACTION: Find nearest store ──
  if (action === "find_stores") {
    const { lat, lng, access_token } = body;
    if (!access_token) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing access_token" }),
      };
    }
    try {
      const params = new URLSearchParams({
        "filter.limit": "5",
        "filter.chain": "Kroger",
      });
      if (lat && lng) {
        params.set("filter.lat.near", lat);
        params.set("filter.lon.near", lng);
      }
      const response = await fetch(`${KROGER_BASE}/locations?${params}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      const stores = (data.data || []).map((s) => ({
        id: s.locationId,
        name: s.name,
        chain: s.chain,
        address: `${s.address?.addressLine1}, ${s.address?.city}, ${s.address?.state}`,
        distance: s.geolocation?.distanceInMiles,
      }));
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ stores }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ── ACTION: Add items to cart ──
  if (action === "add_to_cart") {
    const { items, access_token } = body;
    // items = [{ upc: "...", quantity: 1 }, ...]
    if (!items || !access_token) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing items or access_token" }),
      };
    }
    try {
      const response = await fetch(`${KROGER_BASE}/cart/add`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          items: items.map((i) => ({
            upc: i.upc,
            quantity: i.quantity || 1,
            modality: "PICKUP",
          })),
        }),
      });

      if (response.status === 204 || response.ok) {
        return {
          statusCode: 200,
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
          body: JSON.stringify({ success: true, items_added: items.length }),
        };
      }
      // Surface the real reason. The CE/sandbox environment does not maintain a
      // live cart, so writes here commonly fail — cart only works on production.
      let detail = "";
      try { const d = await response.json(); detail = d.message || JSON.stringify(d); }
      catch { detail = await response.text().catch(() => ""); }
      const isSandbox = KROGER_BASE.includes("-ce.");
      return {
        statusCode: response.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: isSandbox
            ? "Cart is only available on Kroger's live API. Product matching works in test mode, but adding to cart needs the production environment (enabled at launch)."
            : (detail || "Add to cart failed"),
          detail,
          status: response.status,
        }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return {
    statusCode: 400,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ error: "Unknown action" }),
  };
};
