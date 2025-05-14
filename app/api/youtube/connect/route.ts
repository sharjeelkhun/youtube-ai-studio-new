import { NextResponse } from "next/server"

// Define your YouTube OAuth configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/connect-channel/callback`

// Scopes needed for YouTube access
const SCOPES = ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/youtube.force-ssl"]

export async function GET() {
  try {
    if (!CLIENT_ID) {
      return NextResponse.json({ error: "Google OAuth credentials not configured" }, { status: 500 })
    }

    // Build the authorization URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.append("client_id", CLIENT_ID)
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("scope", SCOPES.join(" "))
    authUrl.searchParams.append("access_type", "offline")
    authUrl.searchParams.append("prompt", "consent") // Always prompt for consent to get a refresh token

    return NextResponse.json({
      authUrl: authUrl.toString(),
    })
  } catch (error: any) {
    console.error("Error generating auth URL:", error)
    return NextResponse.json({ error: `Failed to initiate YouTube connection: ${error.message}` }, { status: 500 })
  }
}
