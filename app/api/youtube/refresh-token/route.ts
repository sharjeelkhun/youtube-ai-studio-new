import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
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

    // Get refresh token from request body
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    // Exchange refresh token for a new access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("Token refresh error:", errorData)
      return NextResponse.json(
        { error: `Failed to refresh token: ${tokenResponse.statusText}` },
        { status: tokenResponse.status },
      )
    }

    const tokenData = await tokenResponse.json()

    // Calculate token expiry time
    const expiresIn = tokenData.expires_in || 3600
    const expiryTime = Math.floor(Date.now() / 1000) + expiresIn

    // Update the user's profile with the new token
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        youtube_access_token: tokenData.access_token,
        youtube_token_expiry: expiryTime,
      })
      .eq("id", session.user.id)

    if (updateError) {
      console.error("Error updating profile with new token:", updateError)
      return NextResponse.json({ error: "Failed to update profile with new token" }, { status: 500 })
    }

    return NextResponse.json({
      accessToken: tokenData.access_token,
      expiresIn: expiresIn,
    })
  } catch (error: any) {
    console.error("Error refreshing token:", error)
    return NextResponse.json({ error: `Failed to refresh token: ${error.message}` }, { status: 500 })
  }
}
