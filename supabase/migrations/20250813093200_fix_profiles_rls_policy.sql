-- Drop the existing RLS policies for the profiles table to ensure a clean slate.
-- This is to remove any old, potentially restrictive policies.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a new, permissive RLS policy for selecting data from the profiles table.
-- This policy allows users to view their own profile data, including all columns.
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Create a new, permissive RLS policy for updating data in the profiles table.
-- This policy allows users to update their own profile data, including all columns.
-- The WITH CHECK clause ensures that a user cannot change their profile's ID.
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
