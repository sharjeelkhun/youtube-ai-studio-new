-- Add token tracking columns if they don't exist
ALTER TABLE analytics_usage 
  ADD COLUMN IF NOT EXISTS input_tokens BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_tokens BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tokens BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS analytics_usage_timestamp_idx 
  ON analytics_usage(user_id, provider, timestamp DESC);

-- Add unique constraint to prevent duplicate rows for same user/provider/date
ALTER TABLE analytics_usage 
  ADD CONSTRAINT IF NOT EXISTS analytics_usage_unique_daily 
  UNIQUE (user_id, provider, DATE(timestamp));

-- Add function to get daily usage
CREATE OR REPLACE FUNCTION get_daily_usage(
  p_user_id UUID,
  p_provider TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  api_calls INTEGER,
  content_generation INTEGER,
  input_tokens BIGINT,
  output_tokens BIGINT,
  total_tokens BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(au.api_calls), 0)::INTEGER,
    COALESCE(SUM(au.content_generation), 0)::INTEGER,
    COALESCE(SUM(au.input_tokens), 0)::BIGINT,
    COALESCE(SUM(au.output_tokens), 0)::BIGINT,
    COALESCE(SUM(au.total_tokens), 0)::BIGINT
  FROM analytics_usage au
  WHERE au.user_id = p_user_id
    AND au.provider = p_provider
    AND DATE(au.timestamp) = p_date;
END;
$$ LANGUAGE plpgsql;
