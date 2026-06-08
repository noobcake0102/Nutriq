# RevenueCat Setup — Nutriq

Everything here waits on Apple Developer enrollment (the products must exist in
App Store Connect first). Once you're approved, follow in order.

## 1. App Store Connect
Create two auto-renewable subscriptions in the same subscription group:
- `com.nutriq.plus.monthly` — $6.99/mo (offer a 7-day free trial intro offer)
- `com.nutriq.plus.annual` — $49/yr

## 2. RevenueCat dashboard
1. Create a project, add your App Store Connect app.
2. **Entitlements** → create one called exactly `plus`.
3. **Products** → import `com.nutriq.plus.monthly` and `com.nutriq.plus.annual`;
   attach both to the `plus` entitlement.
4. **Offerings** → create a default offering with both products as packages.
5. **API keys** → copy the **Apple public key** (starts with `appl_`).

(You do NOT need RevenueCat's "Paywalls" feature — the app has its own paywall.)

## 3. Client env var
Add to Netlify (Site settings → Environment variables) and your local `.env.local`:
```
VITE_REVENUECAT_API_KEY=appl_xxxxxxxxxxxxxxxxx
```

## 4. Webhook → Supabase (server-side plan sync)
This keeps `profiles.plan` current so the backend and the web app know who's paid.

1. Run `supabase/add_plan_column.sql` in the Supabase SQL editor.
2. In Supabase → Project Settings → API, copy the **service_role** key (secret).
3. Add these to Netlify env vars:
   ```
   SUPABASE_URL=https://lefzeekulgswdezozhcm.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (service_role, NOT the anon key)
   REVENUECAT_WEBHOOK_SECRET=<generate any strong random string>
   ```
4. In RevenueCat → Integrations → Webhooks:
   - URL: `https://nutriqai.com/api/revenuecat-webhook`
   - Authorization header: the same value as `REVENUECAT_WEBHOOK_SECRET`

The function maps RevenueCat's `app_user_id` to the Supabase user id (the app
calls `Purchases.logIn(user.id)` on login), grants `plan = 'plus'` on
purchase/renewal, and reverts to `'free'` on expiration.

## 5. Test
Build the iOS app (`npm run cap:ios`), run on a device/simulator signed in with a
sandbox Apple ID, and buy through the paywall. Confirm:
- The app unlocks Plus immediately (SDK entitlement)
- `profiles.plan` flips to `plus` in Supabase within a few seconds (webhook)
