-- This policy allows authenticated users to insert their own profile record.
-- The WITH CHECK clause ensures that a user can only create a profile for themselves (i.e., where the profile's id matches their own auth.uid()).
-- This is the missing policy that was preventing the "upsert" logic from working for new users.
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
