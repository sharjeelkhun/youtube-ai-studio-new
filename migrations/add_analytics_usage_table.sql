CREATE TABLE IF NOT EXISTS analytics_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  provider VARCHAR NOT NULL,
  api_calls INTEGER DEFAULT 0,
  content_generation INTEGER DEFAULT 0,
  billing_cycle_start TIMESTAMP WITH TIME ZONE,
  billing_cycle_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle_end > billing_cycle_start)
);

-- Create index for faster queries
CREATE INDEX analytics_usage_user_provider_idx ON analytics_usage(user_id, provider);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_analytics_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_analytics_usage_timestamp
  BEFORE UPDATE ON analytics_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_usage_timestamp();