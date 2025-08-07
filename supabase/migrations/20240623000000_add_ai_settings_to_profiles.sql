ALTER TABLE profiles
ADD COLUMN ai_provider TEXT,
ADD COLUMN ai_api_key TEXT,
ADD COLUMN ai_settings JSONB;
