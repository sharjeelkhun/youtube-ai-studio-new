import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if we can connect to the database
    const { data: session, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        {
          success: false,
          error: sessionError.message,
          message: "Failed to get session",
        },
        { status: 500 },
      )
    }

    if (!session.session) {
      return NextResponse.json(
        {
          success: false,
          error: "No active session",
          message: "You must be logged in to setup the database",
        },
        { status: 401 },
      )
    }

    // Instead of trying to alter the table, let's check if the profile exists
    // and then update it with the YouTube fields, which will implicitly create the columns
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.session.user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      return NextResponse.json(
        {
          success: false,
          error: profileError.message,
          message: "Error checking profile",
        },
        { status: 500 },
      )
    }

    // If profile doesn't exist, create it
    if (profileError && profileError.code === "PGRST116") {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: session.session.user.id,
        youtube_access_token: null,
        youtube_refresh_token: null,
        youtube_token_expiry: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        return NextResponse.json(
          {
            success: false,
            error: insertError.message,
            message: "Failed to create profile",
          },
          { status: 500 },
        )
      }
    } else {
      // Profile exists, update it with YouTube fields
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          youtube_access_token: profile.youtube_access_token || null,
          youtube_refresh_token: profile.youtube_refresh_token || null,
          youtube_token_expiry: profile.youtube_token_expiry || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.session.user.id)

      if (updateError) {
        return NextResponse.json(
          {
            success: false,
            error: updateError.message,
            message: "Failed to update profile with YouTube fields",
          },
          { status: 500 },
        )
      }
    }

    // Check if the columns were added successfully by querying the profile again
    const { data: updatedProfile, error: updatedProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.session.user.id)
      .single()

    if (updatedProfileError) {
      return NextResponse.json(
        {
          success: false,
          error: updatedProfileError.message,
          message: "Failed to verify profile update",
        },
        { status: 500 },
      )
    }

    // Check if the YouTube fields exist in the profile
    const hasYouTubeFields =
      "youtube_access_token" in updatedProfile &&
      "youtube_refresh_token" in updatedProfile &&
      "youtube_token_expiry" in updatedProfile

    if (!hasYouTubeFields) {
      return NextResponse.json(
        {
          success: false,
          message: "YouTube fields not found in profile after update",
          profile: updatedProfile,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Profile setup completed successfully",
      hasYouTubeFields,
    })
  } catch (error: any) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Failed to setup profile",
      },
      { status: 500 },
    )
  }
}
