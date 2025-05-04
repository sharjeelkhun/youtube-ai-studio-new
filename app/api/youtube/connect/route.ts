import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get the client ID from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: "Google Client ID is not configured" }, { status: 500 })
    }

    // Create the OAuth URL
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin")}/connect-channel/callback`
    const scope = "https://www.googleapis.com/auth/youtube.readonly"

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.append("client_id", clientId)
    authUrl.searchParams.append("redirect_uri", redirectUri)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("scope", scope)
    authUrl.searchParams.append("access_type", "offline")
    authUrl.searchParams.append("prompt", "consent")

    // Return the URL for the client to redirect to
    return NextResponse.json({ url: authUrl.toString() })
  } catch (error: any) {
    console.error("Error creating YouTube auth URL:", error)
    return NextResponse.json({ error: `Failed to create auth URL: ${error.message}` }, { status: 500 })
  }
}
