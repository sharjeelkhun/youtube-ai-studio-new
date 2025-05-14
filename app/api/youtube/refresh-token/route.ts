import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      return NextResponse.json(
        { error: `Failed to refresh token: ${tokenResponse.statusText}` },
        { status: tokenResponse.status },
      )
    }

    const tokenData = await tokenResponse.json()

    // Calculate token expiry time
    const expiresIn = tokenData.expires_in || 3600
    const expiryTime = Math.floor(Date.now() / 1000) + expiresIn

    // Update the token in the database
    const { error: updateError } = await supabase
      .from("youtube_channels")
      .update({
        access_token: tokenData.access_token,
        token_expires_at: new Date(expiryTime * 1000).toISOString(),
        last_updated: new Date().toISOString(),
      })
      .eq("user_id", session.user.id)

    if (updateError) {
      console.error("Error updating token:", updateError)
      return NextResponse.json({ error: `Failed to update token: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      access_token: tokenData.access_token,
      expires_at: expiryTime,
    })
  } catch (error: any) {
    console.error("Error refreshing token:", error)
    return NextResponse.json({ error: `Failed to refresh token: ${error.message}` }, { status: 500 })
  }
}
