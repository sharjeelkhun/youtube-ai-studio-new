import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// SQL for creating analytics_usage table
const ANALYTICS_USAGE_SQL = `
-- Enable required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the analytics_usage table
CREATE TABLE IF NOT EXISTS public.analytics_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic', 'mistral')),
  api_calls INTEGER NOT NULL DEFAULT 0,
  content_generation INTEGER NOT NULL DEFAULT 0,
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  date_utc DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED
);

-- Create index for query performance
CREATE INDEX IF NOT EXISTS idx_analytics_usage_user_provider_timestamp 
ON public.analytics_usage(user_id, provider, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.analytics_usage ENABLE ROW LEVEL SECURITY;

-- Create trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_analytics_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_analytics_usage_updated_at_trigger ON public.analytics_usage;

-- Create trigger
CREATE TRIGGER update_analytics_usage_updated_at_trigger
BEFORE UPDATE ON public.analytics_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_analytics_usage_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.analytics_usage TO authenticated;
`;

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check for verify-only mode
    const url = new URL(request.url)
    const verifyOnly = url.searchParams.get('verify') === 'true'

    const results = {
      profiles: { exists: false, created: false, error: null as string | null },
      youtube_channels: { exists: false, created: false, error: null as string | null },
      videos: { exists: false, created: false, error: null as string | null },
      analytics_data: { exists: false, created: false, error: null as string | null },
      analytics_usage: { exists: false, created: false, error: null as string | null },
    }

    // Check if we can connect to Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from("_test_connection")
      .select("*")
      .limit(1)
      .maybeSingle()

    if (connectionError && connectionError.code !== "PGRST116") {
      return NextResponse.json(
        {
          success: false,
          error: `Database connection error: ${connectionError.message}`,
          details: connectionError,
        },
        { status: 500 },
      )
    }

    // Check profiles table
    const { error: profilesError } = await supabase.from("profiles").select("count").limit(1)
    if (!profilesError) {
      results.profiles.exists = true
    } else if (profilesError.code === "PGRST116") {
      results.profiles.error = "Table does not exist. Run setup-database.sql in Supabase SQL Editor."
    }

    // Check youtube_channels table
    const { error: channelsError } = await supabase.from("youtube_channels").select("count").limit(1)
    if (!channelsError) {
      results.youtube_channels.exists = true
    } else if (channelsError.code === "PGRST116") {
      results.youtube_channels.error = "Table does not exist. Run setup-database.sql in Supabase SQL Editor."
    }

    // Check videos table
    const { error: videosError } = await supabase.from("videos").select("count").limit(1)
    if (!videosError) {
      results.videos.exists = true
    } else if (videosError.code === "PGRST116") {
      results.videos.error = "Table does not exist. Run setup-database.sql in Supabase SQL Editor."
    }

    // Check analytics_data table
    const { error: analyticsError } = await supabase.from("analytics_data").select("count").limit(1)
    if (!analyticsError) {
      results.analytics_data.exists = true
    } else if (analyticsError.code === "PGRST116") {
      results.analytics_data.error = "Table does not exist. Run setup-database.sql in Supabase SQL Editor."
    }

    // Check analytics_usage table
    const { error: analyticsUsageError } = await supabase.from("analytics_usage").select("count").limit(1)
    if (!analyticsUsageError) {
      results.analytics_usage.exists = true
    } else if (analyticsUsageError.code === "PGRST116") {
      results.analytics_usage.error = `Table does not exist. Please run migrations/create_analytics_usage_final.sql via Supabase SQL Editor. 
      
Instructions:
1. Open your Supabase project dashboard at https://supabase.com/dashboard
2. Navigate to SQL Editor in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of migrations/create_analytics_usage_final.sql
5. Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows/Linux)
6. Verify success by running: SELECT * FROM public.analytics_usage LIMIT 1;

Alternative: If you have Supabase CLI installed, run: supabase db push`
    }

    const allSuccess = Object.values(results).every(r => r.exists || r.created)
    const anyError = Object.values(results).some(r => r.error !== null)

    return NextResponse.json({
      success: allSuccess && !anyError,
      message: allSuccess && !anyError 
        ? "All database tables exist and are properly configured" 
        : "Database diagnostic complete. Some tables are missing - see results for setup instructions.",
      results,
      note: "This endpoint performs diagnostic checks only. It cannot create tables due to security restrictions. Please run the SQL files manually via Supabase SQL Editor as indicated in the error messages above."
    })
  } catch (error: any) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Unexpected error: ${error.message}`,
        details: error,
      },
      { status: 500 },
    )
  }
}
