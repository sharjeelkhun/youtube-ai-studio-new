import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Read the request body
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: "Authorization code is required" }, { status: 400 })
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

    // Get the redirect URI - must match what was used in the initial request
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin")}/connect-channel/callback`

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange error response:", errorText)

      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(
          {
            error: `Failed to exchange code for tokens: ${errorData.error_description || errorData.error || tokenResponse.statusText}`,
            details: errorData,
          },
          { status: tokenResponse.status },
        )
      } catch (e) {
        return NextResponse.json(
          { error: `Failed to exchange code for tokens: ${tokenResponse.statusText}`, rawError: errorText },
          { status: tokenResponse.status },
        )
      }
    }

    const tokenData = await tokenResponse.json()

    // Calculate token expiry time
    const expiresIn = tokenData.expires_in || 3600
    const expiryTime = Math.floor(Date.now() / 1000) + expiresIn

    // Store tokens in a secure HTTP-only cookie
    const tokenCookie = JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_time: expiryTime,
    })

    // Set cookie with the tokens
    cookieStore.set("youtube_tokens", tokenCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    // Try to update the profile if the columns exist
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          youtube_access_token: tokenData.access_token,
          youtube_refresh_token: tokenData.refresh_token,
          youtube_token_expiry: expiryTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id)

      // If there's an error, we'll just log it but continue
      if (updateError) {
        console.warn("Could not update profile with tokens:", updateError.message)
      }
    } catch (error) {
      console.warn("Error updating profile:", error)
      // Continue even if this fails
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in auth callback:", error)
    return NextResponse.json({ error: `Auth callback failed: ${error.message}` }, { status: 500 })
  }
}
