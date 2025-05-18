import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Get the refresh token from the request body
    const { channelId, refreshToken } = await request.json()

    if (!channelId || !refreshToken) {
      return NextResponse.json({ error: "Channel ID and refresh token are required" }, { status: 400 })
    }

    // Define your YouTube OAuth configuration
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""

    // Validate environment variables
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json({ error: "Google OAuth credentials are not properly configured" }, { status: 500 })
    }

    // Exchange refresh token for a new access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error("Token refresh error:", tokenData)
      return NextResponse.json(
        {
          error: tokenData.error_description || "Failed to refresh token",
          details: tokenData,
        },
        { status: tokenResponse.status },
      )
    }

    // Extract tokens and expiry
    const { access_token, expires_in } = tokenData
    const expiryDate = new Date(Date.now() + expires_in * 1000)

    // Access the authenticated user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Update the channel with the new access token and expiry
    const { error: updateError } = await supabase
      .from("youtube_channels")
      .update({
        access_token,
        token_expires_at: expiryDate.toISOString(),
        last_updated: new Date().toISOString(),
      })
      .eq("id", channelId)
      .eq("user_id", session.user.id)

    if (updateError) {
      console.error("Database update error:", updateError)
      return NextResponse.json({ error: `Failed to update token: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      access_token,
      expires_in,
      expires_at: expiryDate.toISOString(),
    })
  } catch (error: any) {
    console.error("Token refresh error:", error)
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${error.message}`,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
