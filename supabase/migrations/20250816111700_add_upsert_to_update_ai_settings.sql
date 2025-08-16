-- This function securely updates the AI settings for the currently authenticated user.
-- It now uses "upsert" logic (INSERT ON CONFLICT) to be more robust.
-- If a profile row for the user does not exist, it will be created.
-- If it already exists, it will be updated.
CREATE OR REPLACE FUNCTION update_ai_settings(
  new_provider TEXT,
  new_settings JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (id, ai_provider, ai_settings, updated_at)
  VALUES (auth.uid(), new_provider, new_settings, NOW())
  ON CONFLICT (id)
  DO UPDATE SET
    ai_provider = EXCLUDED.ai_provider,
    ai_settings = EXCLUDED.ai_settings,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
