import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    // Get the authenticated user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Define your YouTube OAuth configuration
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || "https://youtube-ai-studio-new.vercel.app"}/connect-channel/callback`

    // Scopes needed for YouTube access
    const SCOPES = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ]

    if (!CLIENT_ID) {
      return NextResponse.json(
        {
          error: "Google Client ID is not configured",
          debug: {
            env: {
              GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
              GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
              NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
            },
          },
        },
        { status: 500 },
      )
    }

    // Generate a state parameter for security
    const state = uuidv4()

    // Create the authorization URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.append("client_id", CLIENT_ID)
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("scope", SCOPES.join(" "))
    authUrl.searchParams.append("access_type", "offline")
    authUrl.searchParams.append("prompt", "consent")
    authUrl.searchParams.append("state", state)

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state,
      debug: {
        redirectUri: REDIRECT_URI,
        scopes: SCOPES,
      },
    })
  } catch (error: any) {
    console.error("YouTube connect error:", error)
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${error.message}`,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
