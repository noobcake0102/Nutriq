-- ============================================================
-- Nutriq — Product (brand) preference learning
-- Remembers which specific product a user picks for each ingredient,
-- so future shopping lists auto-select their preferred brand.
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS product_preferences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id  UUID,
  ingredient_key TEXT NOT NULL,         -- normalized ingredient, e.g. "milk", "yellow onion"
  chosen_upc    TEXT,                   -- Kroger UPC of the chosen product
  chosen_brand  TEXT,                   -- e.g. "Fairlife"
  chosen_name   TEXT,                   -- full product description
  pick_count    INT NOT NULL DEFAULT 1, -- how many times this product was chosen
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ingredient_key)
);

CREATE INDEX IF NOT EXISTS product_prefs_user_idx ON product_preferences(user_id);

-- RLS: users only see/modify their own preferences
ALTER TABLE product_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_prefs_select_own" ON product_preferences;
DROP POLICY IF EXISTS "product_prefs_insert_own" ON product_preferences;
DROP POLICY IF EXISTS "product_prefs_update_own" ON product_preferences;
DROP POLICY IF EXISTS "product_prefs_delete_own" ON product_preferences;

CREATE POLICY "product_prefs_select_own" ON product_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "product_prefs_insert_own" ON product_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "product_prefs_update_own" ON product_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "product_prefs_delete_own" ON product_preferences FOR DELETE USING (auth.uid() = user_id);

-- Upsert helper: records a pick, incrementing count when the same product is re-chosen
CREATE OR REPLACE FUNCTION record_product_pick(
  p_user_id UUID, p_ingredient_key TEXT, p_upc TEXT, p_brand TEXT, p_name TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO product_preferences (user_id, ingredient_key, chosen_upc, chosen_brand, chosen_name, pick_count, updated_at)
  VALUES (p_user_id, p_ingredient_key, p_upc, p_brand, p_name, 1, now())
  ON CONFLICT (user_id, ingredient_key) DO UPDATE SET
    chosen_upc   = EXCLUDED.chosen_upc,
    chosen_brand = EXCLUDED.chosen_brand,
    chosen_name  = EXCLUDED.chosen_name,
    pick_count   = product_preferences.pick_count + 1,
    updated_at   = now();
END;
$$;
