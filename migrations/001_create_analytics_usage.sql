-- Create analytics_usage table
CREATE TABLE IF NOT EXISTS analytics_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic', 'mistral')),
  api_calls INTEGER DEFAULT 0,
  content_generation INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, date_trunc('day', timestamp))
);

-- Enable RLS
ALTER TABLE analytics_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own usage"
  ON analytics_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON analytics_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON analytics_usage FOR UPDATE
  USING (auth.uid() = user_id);