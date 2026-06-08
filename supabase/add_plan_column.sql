-- ============================================================
-- Nutriq — subscription plan tracking on profiles
-- Lets the backend (and the web app, where the RevenueCat native SDK can't run)
-- know who's on Plus. Kept in sync by the revenuecat-webhook Netlify function.
-- Run in Supabase SQL Editor.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- 'free' or 'plus'. plan_expires_at is the current period end (null for free).
