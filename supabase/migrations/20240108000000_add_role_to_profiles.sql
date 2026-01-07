-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Update existing users to have 'user' role (safeguard)
UPDATE public.profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Create policy to allow admins to read all profiles (optional if using service role, but good for client-side if needed later)
-- For now, we rely on service role for admin dashboard, so we don't strictly need new RLS for client yet.
