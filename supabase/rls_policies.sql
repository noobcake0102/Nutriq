-- ============================================================
-- Nutriq — Row Level Security Policies
-- Run this entire file in Supabase SQL Editor once.
-- Safe to re-run: uses CREATE POLICY IF NOT EXISTS equivalent
-- via DROP IF EXISTS + CREATE pattern.
-- ============================================================

-- ── PROFILES ─────────────────────────────────────────────────
-- Users can only read/update their own profile row.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own"  ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own"  ON profiles;

CREATE POLICY "profiles_select_own"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own"  ON profiles FOR DELETE USING (auth.uid() = id);


-- ── HOUSEHOLDS ───────────────────────────────────────────────
-- A user can only read/manage a household they belong to.
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "households_select_member"  ON households;
DROP POLICY IF EXISTS "households_insert_member"  ON households;
DROP POLICY IF EXISTS "households_update_member"  ON households;
DROP POLICY IF EXISTS "households_delete_member"  ON households;

CREATE POLICY "households_select_member" ON households FOR SELECT
  USING (id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "households_insert_member" ON households FOR INSERT
  WITH CHECK (true); -- household created during onboarding before profile row exists

CREATE POLICY "households_update_member" ON households FOR UPDATE
  USING (id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "households_delete_member" ON households FOR DELETE
  USING (id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));


-- ── GOALS ────────────────────────────────────────────────────
-- Each user owns their own goals row.
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goals_select_own"  ON goals;
DROP POLICY IF EXISTS "goals_insert_own"  ON goals;
DROP POLICY IF EXISTS "goals_update_own"  ON goals;
DROP POLICY IF EXISTS "goals_delete_own"  ON goals;

CREATE POLICY "goals_select_own"  ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own"  ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own"  ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete_own"  ON goals FOR DELETE USING (auth.uid() = user_id);


-- ── PANTRY_ITEMS ─────────────────────────────────────────────
-- Pantry is household-scoped: all members of the same household
-- can read, add, update, and delete pantry items.
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pantry_select_household"  ON pantry_items;
DROP POLICY IF EXISTS "pantry_insert_household"  ON pantry_items;
DROP POLICY IF EXISTS "pantry_update_household"  ON pantry_items;
DROP POLICY IF EXISTS "pantry_delete_household"  ON pantry_items;

CREATE POLICY "pantry_select_household" ON pantry_items FOR SELECT
  USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "pantry_insert_household" ON pantry_items FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "pantry_update_household" ON pantry_items FOR UPDATE
  USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "pantry_delete_household" ON pantry_items FOR DELETE
  USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));


-- ── SAVED_MEALS ──────────────────────────────────────────────
-- Each user owns their own saved meals.
ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_meals_select_own"  ON saved_meals;
DROP POLICY IF EXISTS "saved_meals_insert_own"  ON saved_meals;
DROP POLICY IF EXISTS "saved_meals_update_own"  ON saved_meals;
DROP POLICY IF EXISTS "saved_meals_delete_own"  ON saved_meals;

CREATE POLICY "saved_meals_select_own"  ON saved_meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_meals_insert_own"  ON saved_meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_meals_update_own"  ON saved_meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "saved_meals_delete_own"  ON saved_meals FOR DELETE USING (auth.uid() = user_id);


-- ── MEAL_RATINGS ─────────────────────────────────────────────
-- Each user owns their own ratings.
ALTER TABLE meal_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_ratings_select_own"  ON meal_ratings;
DROP POLICY IF EXISTS "meal_ratings_insert_own"  ON meal_ratings;
DROP POLICY IF EXISTS "meal_ratings_update_own"  ON meal_ratings;
DROP POLICY IF EXISTS "meal_ratings_delete_own"  ON meal_ratings;

CREATE POLICY "meal_ratings_select_own"  ON meal_ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "meal_ratings_insert_own"  ON meal_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "meal_ratings_update_own"  ON meal_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "meal_ratings_delete_own"  ON meal_ratings FOR DELETE USING (auth.uid() = user_id);


-- ── WEIGHT_LOGS ──────────────────────────────────────────────
-- Each user owns their own weight log entries.
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weight_logs_select_own"  ON weight_logs;
DROP POLICY IF EXISTS "weight_logs_insert_own"  ON weight_logs;
DROP POLICY IF EXISTS "weight_logs_update_own"  ON weight_logs;
DROP POLICY IF EXISTS "weight_logs_delete_own"  ON weight_logs;

CREATE POLICY "weight_logs_select_own"  ON weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weight_logs_insert_own"  ON weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weight_logs_update_own"  ON weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "weight_logs_delete_own"  ON weight_logs FOR DELETE USING (auth.uid() = user_id);


-- ── VERIFY ───────────────────────────────────────────────────
-- Run this query after applying to confirm RLS is active on all tables:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Every app table should show rowsecurity = true.
