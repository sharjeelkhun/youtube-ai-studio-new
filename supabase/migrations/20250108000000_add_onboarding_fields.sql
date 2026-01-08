-- Add onboarding tracking fields to profiles table
-- This migration adds fields to track user onboarding progress and completion status

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;

-- Create index for faster queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON profiles(onboarding_completed);

-- Update existing users to mark onboarding as completed
-- (they were created before this feature existed)
UPDATE profiles
SET onboarding_completed = TRUE,
    onboarding_step = 4
WHERE onboarding_completed IS NULL OR onboarding_completed = FALSE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether the user has completed the onboarding wizard';
COMMENT ON COLUMN profiles.onboarding_step IS 'Current step in the onboarding wizard (1-4)';
COMMENT ON COLUMN profiles.onboarding_data IS 'Temporary data stored during onboarding process';
