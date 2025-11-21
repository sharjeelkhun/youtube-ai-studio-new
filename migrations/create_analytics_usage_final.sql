-- =====================================================
-- analytics_usage table migration
-- =====================================================
--
-- IMPORTANT: This table is OPTIONAL and used for historical analytics only.
-- 
-- The Settings page fetches usage directly from provider APIs in real-time.
-- This table is NOT required for the Settings page to display usage data.
-- 
-- You only need to create this table if you want to:
-- - Track historical usage trends over time
-- - Generate usage reports and analytics dashboards
-- - Monitor usage patterns across different time periods
-- - Analyze cost trends and optimization opportunities
-- 
-- If you only need real-time usage display in Settings, you can skip this migration.
-- The application will continue to work without this table.
--
-- =====================================================

-- Consolidated migration for analytics_usage table
-- This migration combines the best elements from existing migration files
-- Safe to run multiple times due to IF NOT EXISTS clauses

-- Enable required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the analytics_usage table
CREATE TABLE IF NOT EXISTS public.analytics_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic', 'mistral')),
  api_calls INTEGER NOT NULL DEFAULT 0,
  content_generation INTEGER NOT NULL DEFAULT 0,
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  date_utc DATE GENERATED ALWAYS AS (DATE((timestamp AT TIME ZONE 'UTC'))) STORED
);

-- Add unique constraint using the generated column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'analytics_usage_unique_daily'
  ) THEN
    ALTER TABLE public.analytics_usage 
    ADD CONSTRAINT analytics_usage_unique_daily 
    UNIQUE (user_id, provider, date_utc);
  END IF;
END $$;

-- Create index for query performance
CREATE INDEX IF NOT EXISTS idx_analytics_usage_user_provider_timestamp 
ON public.analytics_usage(user_id, provider, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.analytics_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own analytics_usage" ON public.analytics_usage;
DROP POLICY IF EXISTS "Users can insert their own analytics_usage" ON public.analytics_usage;
DROP POLICY IF EXISTS "Users can update their own analytics_usage" ON public.analytics_usage;

-- Create RLS policies
CREATE POLICY "Users can view their own analytics_usage"
ON public.analytics_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics_usage"
ON public.analytics_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics_usage"
ON public.analytics_usage
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_analytics_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_analytics_usage_updated_at_trigger ON public.analytics_usage;

-- Create trigger
CREATE TRIGGER update_analytics_usage_updated_at_trigger
BEFORE UPDATE ON public.analytics_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_analytics_usage_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.analytics_usage TO authenticated;

-- Create atomic increment function to prevent race conditions
CREATE OR REPLACE FUNCTION public.increment_analytics_usage(
  p_user_id UUID,
  p_provider TEXT,
  api_calls_inc INT DEFAULT 0,
  content_generation_inc INT DEFAULT 0,
  input_inc BIGINT DEFAULT 0,
  output_inc BIGINT DEFAULT 0,
  total_inc BIGINT DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enforce that the caller is updating their own data
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only update your own analytics usage';
  END IF;

  -- Perform atomic insert or update with increments
  INSERT INTO public.analytics_usage (
    user_id,
    provider,
    api_calls,
    content_generation,
    input_tokens,
    output_tokens,
    total_tokens,
    timestamp
  ) VALUES (
    p_user_id,
    p_provider,
    api_calls_inc,
    content_generation_inc,
    input_inc,
    output_inc,
    total_inc,
    NOW()
  )
  ON CONFLICT (user_id, provider, date_utc)
  DO UPDATE SET
    api_calls = analytics_usage.api_calls + EXCLUDED.api_calls,
    content_generation = analytics_usage.content_generation + EXCLUDED.content_generation,
    input_tokens = analytics_usage.input_tokens + EXCLUDED.input_tokens,
    output_tokens = analytics_usage.output_tokens + EXCLUDED.output_tokens,
    total_tokens = analytics_usage.total_tokens + EXCLUDED.total_tokens,
    updated_at = NOW();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_analytics_usage TO authenticated;
