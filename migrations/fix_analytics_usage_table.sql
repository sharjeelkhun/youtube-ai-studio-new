-- Drop the old constraint
ALTER TABLE analytics_usage DROP CONSTRAINT IF EXISTS valid_billing_cycle;

-- Allow null timestamps for new records
ALTER TABLE analytics_usage 
  ALTER COLUMN billing_cycle_start DROP NOT NULL,
  ALTER COLUMN billing_cycle_end DROP NOT NULL;

-- Add new constraint that allows both timestamps to be null or requires valid range
ALTER TABLE analytics_usage
  ADD CONSTRAINT valid_billing_cycle 
  CHECK (
    (billing_cycle_start IS NULL AND billing_cycle_end IS NULL) OR 
    (billing_cycle_end > billing_cycle_start)
  );

-- Add index on billing cycle dates for faster queries
CREATE INDEX IF NOT EXISTS analytics_usage_billing_cycle_idx 
  ON analytics_usage(billing_cycle_start, billing_cycle_end);