-- Add generation counter columns to profiles table
-- Run in Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS monthly_generations INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS generations_reset_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(id);

-- Helper function: increments counter, resets if new month, returns new count
CREATE OR REPLACE FUNCTION increment_generation_count(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT monthly_generations, generations_reset_at
  INTO v_count, v_reset_at
  FROM profiles WHERE id = p_user_id;

  -- If reset_at is from a previous month, reset the counter
  IF date_trunc('month', v_reset_at) < date_trunc('month', now()) THEN
    UPDATE profiles
    SET monthly_generations = 1,
        generations_reset_at = now()
    WHERE id = p_user_id;
    RETURN 1;
  ELSE
    UPDATE profiles
    SET monthly_generations = monthly_generations + 1
    WHERE id = p_user_id;
    RETURN v_count + 1;
  END IF;
END;
$$;
