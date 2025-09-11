-- Create the update_ai_settings function
CREATE OR REPLACE FUNCTION public.update_ai_settings(
  new_provider text,
  new_settings jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET 
    ai_provider = new_provider,
    ai_settings = new_settings,
    updated_at = now()
  WHERE user_id = auth.uid();
  
  RETURN true;
END;
$$;
