# Nutriq — Launch Checklist

Every manual step needed to go live, in order. Check off as you go.

## 1. Supabase — run these SQL migrations (SQL Editor)
- [ ] `supabase/rls_policies.sql` — row-level security on all tables
- [ ] `supabase/add_generation_counter.sql` — free-plan generation counter
- [ ] `supabase/add_product_preferences.sql` — brand-preference learning
- [ ] `supabase/add_plan_column.sql` — subscription plan on profiles
- [ ] Verify: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';`
      → every app table shows `rowsecurity = true`

## 2. Netlify — environment variables (Site settings → Environment variables)
Already set (confirm they're current, not expired):
- [ ] `ANTHROPIC_API_KEY`
- [ ] `KROGER_CLIENT_ID`
- [ ] `KROGER_CLIENT_SECRET`

Add before launch:
- [ ] `VITE_REVENUECAT_API_KEY` — `appl_…` from RevenueCat (see revenuecat-setup.md)
- [ ] `VITE_SENTRY_DSN` — from sentry.io (error monitoring; optional but recommended)
- [ ] `SUPABASE_URL` — `https://lefzeekulgswdezozhcm.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — service_role key (server-only, for the webhook)
- [ ] `REVENUECAT_WEBHOOK_SECRET` — any strong random string

> `VITE_…` vars are baked in at build time — trigger a redeploy after adding them.

## 3. Re-enable the free-tier cap
- [ ] In `src/lib/purchases.js`, set `FREE_GENERATION_LIMIT` back to `3`
      (currently `99999` for testing — search for the `TEMP` comment)

## 4. Apple Developer + App Store Connect
- [ ] Enroll in Apple Developer Program as an **Individual** ($99/yr)
- [x] Create the app in App Store Connect, bundle ID `com.nutriqai.app`
- [ ] Create the 2 subscription products (see revenuecat-setup.md §1)
- [ ] Listing: paste from `docs/app-store-listing.md` (name, subtitle, keywords,
      description, what's new, categories, privacy labels)
- [ ] Upload screenshots (6.7" + 5.5" iPhone) — still to produce
- [ ] Provide a demo account for review (a test login that reaches the full app)

## 5. RevenueCat
- [ ] Follow `docs/revenuecat-setup.md` end to end (entitlement `plus`, offering,
      API key, webhook → `https://nutriqai.com/api/revenuecat-webhook`)

## 6. Kroger — go to production (ONLY at launch)
- [ ] In `netlify/functions/kroger.js`, change `KROGER_BASE` and
      `KROGER_AUTH_BASE` from `api-ce.kroger.com` to `api.kroger.com`
- [ ] Update `REDIRECT_URI` if the production domain differs
- [ ] Confirm production Kroger app credentials are the ones in Netlify env

## 7. Build & submit
- [ ] `npm run build && npx cap sync`
- [ ] `npx cap open ios` → set signing team → Archive → upload via Xcode Organizer
- [ ] Fill App Privacy, pricing, and submit for review

## 8. Smoke test before submitting
- [ ] Sign up → onboarding → lands in app
- [ ] Generate a meal plan → celebration fires
- [ ] Shopping list matches products (Kroger connected)
- [ ] Paywall appears at the free limit; sandbox purchase unlocks Plus
- [ ] `profiles.plan` flips to `plus` after purchase (webhook works)
- [ ] nutriqai.com/privacy and /terms load
- [ ] Account deletion works (Settings → Delete account)

## Post-launch
- [ ] Confirm Sentry is receiving events
- [ ] Submit to Apple "New Apps We Love" editorial
- [ ] Add second grocery platform (Instacart) once Kroger is proven
