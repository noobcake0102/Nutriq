-- ============================================================
-- Nutriq — recipe source tracking
-- Distinguishes AI-generated meals from the user's own recipes and
-- link-imported ones, so the Cookbook can badge and filter them.
-- Run in Supabase SQL Editor.
-- ============================================================

ALTER TABLE saved_meals
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS source_url TEXT;

-- 'ai' (generated), 'custom' (user wrote it), 'import' (from a link)
