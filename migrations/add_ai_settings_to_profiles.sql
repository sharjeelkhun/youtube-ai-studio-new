-- Update profiles table with AI settings
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ai_provider text,
ADD COLUMN IF NOT EXISTS ai_settings jsonb DEFAULT jsonb_build_object(
  'features', jsonb_build_object(
    'defaultModel', 'mistral-large-latest',
    'temperature', 'balanced'
  ),
  'apiKeys', '{}'::jsonb
);
