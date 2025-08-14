-- Create a function to securely get the AI settings for the currently authenticated user.
-- This function will be called by the application instead of querying the table directly.
-- The SECURITY INVOKER clause ensures that the function runs with the permissions of the user calling it.
CREATE OR REPLACE FUNCTION get_ai_settings()
RETURNS TABLE(provider TEXT, settings JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.ai_provider,
    p.ai_settings
  FROM
    public.profiles p
  WHERE
    p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Create a function to securely update the AI settings for the currently authenticated user.
-- This function will be called by the application to save the settings.
CREATE OR REPLACE FUNCTION update_ai_settings(
  new_provider TEXT,
  new_settings JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    ai_provider = new_provider,
    ai_settings = new_settings
  WHERE
    id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Grant permission to the 'authenticated' role to execute the new functions.
-- This allows logged-in users to use these functions.
GRANT EXECUTE ON FUNCTION get_ai_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION update_ai_settings(TEXT, JSONB) TO authenticated;
