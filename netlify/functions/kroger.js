const KROGER_BASE = "https://api-ce.kroger.com/v1";
const KROGER_AUTH_BASE = "https://api-ce.kroger.com/v1/connect/oauth2";

// Maps ingredient categories to Kroger-optimized search terms.
// Strategy: use terms that match how shoppers search on Kroger.com,
// NOT overly descriptive phrases. Kroger's algorithm rewards grocery-natural language.
const INGREDIENT_ENRICHMENT = {
  // Poultry — "boneless skinless" is the magic phrase that separates raw from deli
  poultry: {
    terms: ["chicken breast","chicken thigh","chicken leg","chicken wing","ground chicken","whole chicken","chicken"],
    transform: q => q.includes("ground") ? q : `boneless skinless ${q}`,
  },
  // Other meat — "fresh" prefix avoids deli/pre-cooked
  meat: {
    terms: ["ground beef","ground turkey","beef","steak","pork chop","pork loin",
            "pork tenderloin","sausage","lamb","veal","bison","pork"],
    transform: q => q.includes("ground") ? `${q} 80/20` : `fresh ${q}`,
  },
  // Bacon separate — "raw bacon" returns wrong results, just "bacon" is fine
  bacon: {
    terms: ["bacon"],
    transform: q => q,
  },
  // Seafood — "fresh" pushes past frozen/smoked/canned
  seafood: {
    terms: ["salmon","tuna","shrimp","tilapia","cod","halibut","mahi","scallop",
            "crab","lobster","clam","oyster","fish fillet","fish"],
    transform: q => q.includes("canned") ? q : `fresh ${q}`,
  },
  // Produce — "fresh" is helpful for items that also come dried/canned
  produce: {
    terms: ["spinach","kale","arugula","lettuce","tomato","onion","garlic","ginger",
            "broccoli","cauliflower","carrot","celery","zucchini","cucumber","bell pepper",
            "mushroom","potato","sweet potato","avocado","lemon","lime","apple",
            "banana","strawberry","blueberry","mango","peach","basil",
            "cilantro","parsley","thyme","rosemary"],
    transform: q => `fresh ${q}`,
  },
  // Dairy — no prefix needed, Kroger handles these well
  dairy: {
    terms: ["milk","cream","butter","cheese","yogurt","sour cream",
            "cream cheese","cottage cheese","ricotta","mozzarella","cheddar",
            "parmesan","feta","goat cheese","heavy cream","half and half"],
    transform: q => q,
  },
  // Eggs — just "eggs" works perfectly
  eggs: {
    terms: ["egg","eggs"],
    transform: () => "large eggs",
  },
};

function enrichIngredientQuery(raw) {
  // Strip quantities and cooking descriptors to get the core ingredient
  const descriptors = ["cooked","frozen","dried","chopped","diced","sliced","minced",
    "grilled","fried","baked","raw","ripe","whole","boneless","skinless","lean","organic",
    "fresh","large","small","medium"];
  let q = raw.toLowerCase()
    .replace(/^\d[\d./\s]*(cup|tbsp|tsp|oz|lb|lbs|g|kg|clove|cloves|can|bunch|piece|medium|large|small)s?\s*/i, "")
    .trim();
  descriptors.forEach(w => { q = q.replace(new RegExp(`\\b${w}\\b`, "gi"), "").trim(); });
  q = q.replace(/\s+/g, " ").trim() || raw.toLowerCase();

  // Apply category-specific transform
  for (const { terms, transform } of Object.values(INGREDIENT_ENRICHMENT)) {
    if (terms.some(t => q.includes(t) || t.includes(q))) {
      return transform(q);
    }
  }
  return q;
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
  const REDIRECT_URI = "https://nutriq2.netlify.app/kroger-callback";

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
    const { query, location_id, access_token } = body;
    if (!query || !access_token) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing query or access_token" }),
      };
    }
    try {
      const enrichedQuery = enrichIngredientQuery(query);
      const params = new URLSearchParams({
        "filter.term": enrichedQuery,
        "filter.limit": "5",
        "filter.fulfillment": "ais",
      });
      if (location_id) params.set("filter.locationId", location_id);

      const response = await fetch(`${KROGER_BASE}/products?${params}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          statusCode: response.status,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: data.message || "Product search failed" }),
        };
      }
      // Return simplified product list
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
        body: JSON.stringify({ products }),
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
      const data = await response.json();
      return {
        statusCode: response.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: data.message || "Add to cart failed" }),
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
