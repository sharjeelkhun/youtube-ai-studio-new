-- Add cancel_at_period_end to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Update existing records to have false by default
UPDATE subscriptions 
SET cancel_at_period_end = false 
WHERE cancel_at_period_end IS NULL;
