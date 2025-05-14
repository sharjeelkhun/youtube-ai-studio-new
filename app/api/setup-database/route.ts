import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create the profiles table
    const profilesQuery = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id),
        full_name TEXT,
        avatar_url TEXT,
        youtube_access_token TEXT,
        youtube_refresh_token TEXT,
        youtube_token_expiry TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    const { error: profilesError } = await supabase.rpc("exec_sql", { sql: profilesQuery })

    if (profilesError) {
      console.error("Error creating profiles table:", profilesError)

      // Check if profile already exists and try upsert approach
      const { data: userProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        return NextResponse.json(
          {
            error: `Failed to fetch user profile: ${fetchError.message}`,
          },
          { status: 500 },
        )
      }

      // If profile doesn't exist, insert it
      if (!userProfile) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: session.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          return NextResponse.json(
            {
              error: `Failed to create profile: ${insertError.message}`,
            },
            { status: 500 },
          )
        }
      }
    }

    // Create the youtube_channels table
    const channelsQuery = `
      CREATE TABLE IF NOT EXISTS youtube_channels (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        subscribers INTEGER DEFAULT 0,
        videos INTEGER DEFAULT 0,
        thumbnail TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP WITH TIME ZONE,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    const { error: channelsError } = await supabase.rpc("exec_sql", { sql: channelsQuery })

    if (channelsError) {
      console.error("Error creating youtube_channels table:", channelsError)
      // Continue anyway since the table might already exist
    }

    // Create the videos table
    const videosQuery = `
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        thumbnail TEXT,
        status TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    const { error: videosError } = await supabase.rpc("exec_sql", { sql: videosQuery })

    if (videosError) {
      console.error("Error creating videos table:", videosError)
      // Continue anyway since the table might already exist
    }

    // Create the analytics_data table
    const analyticsQuery = `
      CREATE TABLE IF NOT EXISTS analytics_data (
        id SERIAL PRIMARY KEY,
        channel_id TEXT NOT NULL,
        date DATE NOT NULL,
        views INTEGER DEFAULT 0,
        watch_time INTEGER DEFAULT 0,
        engagement NUMERIC DEFAULT 0,
        subscribers INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    const { error: analyticsError } = await supabase.rpc("exec_sql", { sql: analyticsQuery })

    if (analyticsError) {
      console.error("Error creating analytics_data table:", analyticsError)
      // Continue anyway since the table might already exist
    }

    // Ensure we have a profile for the current user
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: session.user.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )

    if (profileError) {
      console.error("Error upserting profile:", profileError)
      return NextResponse.json(
        {
          error: `Failed to create/update profile: ${profileError.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error setting up database:", error)
    return NextResponse.json(
      {
        error: `Failed to set up database: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
