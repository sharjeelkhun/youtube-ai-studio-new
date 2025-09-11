-- Create the get_ai_settings function
CREATE OR REPLACE FUNCTION public.get_ai_settings()
RETURNS TABLE (
  provider text,
  settings jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    profiles.ai_provider,
    jsonb_build_object(
      'features', COALESCE(profiles.ai_settings->'features', '{}'::jsonb),
      'apiKeys', COALESCE(profiles.ai_settings->'apiKeys', '{}'::jsonb)
    ) as settings
  FROM auth.users
  JOIN profiles ON profiles.user_id = auth.users.id
  WHERE auth.users.id = auth.uid();
END;
$$;
