-- Add new columns to payments table for better history tracking
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS plan_name TEXT,
ADD COLUMN IF NOT EXISTS period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS period_end TIMESTAMP WITH TIME ZONE;
