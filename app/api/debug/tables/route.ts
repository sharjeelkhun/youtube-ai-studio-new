import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Check if tables exist
    const tables = ["profiles", "youtube_channels", "videos", "analytics_data"]

    const results: Record<string, { exists: boolean; error: string | null; hasData: boolean }> = {}

    for (const table of tables) {
      // Try to get the first row from each table
      const { data, error } = await supabase.from(table).select("*").limit(1)

      results[table] = {
        exists: !error,
        error: error ? error.message : null,
        hasData: !!(data && data.length > 0),
      }
    }

    // Check auth configuration
    let authStatus = "unknown"
    try {
      const { data, error } = await supabase.auth.getSession()
      authStatus = error ? "error" : data.session ? "authenticated" : "not authenticated"
    } catch (e) {
      authStatus = "error: " + (e instanceof Error ? e.message : 'Unknown error')
    }

    return NextResponse.json({
      tables: results,
      auth: authStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 })
  }
}
