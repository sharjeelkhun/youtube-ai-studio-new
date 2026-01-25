-- Add missing columns to payments table for better history tracking
-- Run this in your Supabase SQL Editor

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS plan_name TEXT,
ADD COLUMN IF NOT EXISTS period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days');

-- Also ensure RLS policies are correct for the new columns
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
CREATE POLICY "Users can insert their own payments"
    ON payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);
