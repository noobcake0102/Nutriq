// Receives RevenueCat webhook events and syncs the user's plan into Supabase.
// RevenueCat's app_user_id == our Supabase auth user id (we call
// Purchases.logIn(user.id) on login), so we can update profiles directly.
//
// Required Netlify env vars:
//   SUPABASE_URL                 - your Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY    - service role key (server-only, bypasses RLS)
//   REVENUECAT_WEBHOOK_SECRET    - the Authorization header value set in the
//                                  RevenueCat webhook config (any strong secret)
const { createClient } = require("@supabase/supabase-js");

// Event types that grant access vs. revoke it. CANCELLATION only turns off
// auto-renew — access continues until EXPIRATION, so we don't revoke on it.
const GRANT = new Set([
  "INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE",
  "UNCANCELLATION", "NON_RENEWING_PURCHASE", "SUBSCRIPTION_EXTENDED",
]);

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Verify the shared secret RevenueCat sends in the Authorization header
  const auth = event.headers.authorization || event.headers.Authorization;
  if (!process.env.REVENUECAT_WEBHOOK_SECRET || auth !== process.env.REVENUECAT_WEBHOOK_SECRET) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  let payload;
  try { payload = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: "Invalid JSON" }; }

  const ev = payload.event || {};
  const userId = ev.app_user_id;
  const type = ev.type;
  if (!userId) return { statusCode: 200, body: "no app_user_id" };

  // Decide the resulting plan
  let plan = null;
  if (GRANT.has(type)) plan = "plus";
  else if (type === "EXPIRATION") plan = "free";
  if (plan === null) return { statusCode: 200, body: `ignored ${type}` };

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: "Supabase not configured" };
  }

  try {
    const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const expMs = ev.expiration_at_ms;
    const { error } = await supa.from("profiles").update({
      plan,
      plan_expires_at: plan === "plus" && expMs ? new Date(expMs).toISOString() : null,
    }).eq("id", userId);
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ ok: true, user: userId, plan }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
