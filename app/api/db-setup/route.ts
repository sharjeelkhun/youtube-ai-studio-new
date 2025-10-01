import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

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

    // Try to create profiles table
    const { error: profilesError } = await supabase.from("profiles").select("count").limit(1)

    if (profilesError && profilesError.code !== "PGRST116") {
      // Table doesn't exist, try to create it
      const { error: createProfilesError } = await supabase.rpc("create_profiles_table", {})

      if (createProfilesError) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create profiles table: ${createProfilesError.message}`,
            details: createProfilesError,
          },
          { status: 500 },
        )
      }
    }

    // Try to create youtube_channels table
    const { error: channelsError } = await supabase.from("youtube_channels").select("count").limit(1)

    if (channelsError && channelsError.code !== "PGRST116") {
      // Table doesn't exist, try to create it
      const { error: createChannelsError } = await supabase.rpc("create_youtube_channels_table", {})

      if (createChannelsError) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create youtube_channels table: ${createChannelsError.message}`,
            details: createChannelsError,
          },
          { status: 500 },
        )
      }
    }

    // Try to create videos table
    const { error: videosError } = await supabase.from("videos").select("count").limit(1)

    if (videosError && videosError.code !== "PGRST116") {
      // Table doesn't exist, try to create it
      const { error: createVideosError } = await supabase.rpc("create_videos_table", {})

      if (createVideosError) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create videos table: ${createVideosError.message}`,
            details: createVideosError,
          },
          { status: 500 },
        )
      }
    }

    // Try to create analytics_data table
    const { error: analyticsError } = await supabase.from("analytics_data").select("count").limit(1)

    if (analyticsError && analyticsError.code !== "PGRST116") {
      // Table doesn't exist, try to create it
      const { error: createAnalyticsError } = await supabase.rpc("create_analytics_data_table", {})

      if (createAnalyticsError) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create analytics_data table: ${createAnalyticsError.message}`,
            details: createAnalyticsError,
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
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
