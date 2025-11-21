-- Migration to fix date_utc generated column to use explicit UTC timezone
-- Run this if you already have the analytics_usage table in production
-- This ensures date calculations use UTC regardless of database timezone settings

-- For PostgreSQL 12+, we need to drop and recreate the generated column
-- Note: This is safe because date_utc is generated from timestamp, not stored data

DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_usage' AND table_schema = 'public') THEN
    
    -- Drop the existing generated column
    ALTER TABLE public.analytics_usage DROP COLUMN IF EXISTS date_utc;
    
    -- Recreate with explicit UTC timezone
    ALTER TABLE public.analytics_usage 
    ADD COLUMN date_utc DATE GENERATED ALWAYS AS (DATE((timestamp AT TIME ZONE 'UTC'))) STORED;
    
    -- Recreate the unique constraint (it was dropped when the column was dropped)
    ALTER TABLE public.analytics_usage 
    DROP CONSTRAINT IF EXISTS analytics_usage_unique_daily;
    
    ALTER TABLE public.analytics_usage 
    ADD CONSTRAINT analytics_usage_unique_daily 
    UNIQUE (user_id, provider, date_utc);
    
    RAISE NOTICE 'Successfully updated date_utc column to use explicit UTC timezone';
  ELSE
    RAISE NOTICE 'Table analytics_usage does not exist - no action needed';
  END IF;
END $$;
