import { createServerClient } from '@supabase/ssr'
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Helper: always resolve redirect dynamically
const getRedirectUri = (request: Request) => {
  try {
    // Always prefer the origin of the incoming request
    const url = new URL(request.url)
    return `${url.origin}/connect-channel/callback`
  } catch {
    // Fallback to Vercel or localhost
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}/connect-channel/callback`
    }
    return "http://localhost:3000/connect-channel/callback"
  }
}

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.delete(name)
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const REDIRECT_URI = getRedirectUri(request)

  // Validate Google API credentials
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ Missing Google OAuth credentials in connect endpoint:', {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hint: 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local. See GOOGLE_OAUTH_SETUP.md for instructions.'
    });
    return NextResponse.json(
      {
        error: "Google OAuth credentials are not configured",
        details: "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment",
        setupUrl: "/GOOGLE_OAUTH_SETUP.md"
      },
      { status: 500 }
    )
  }

  const SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
  ]

  const state = uuidv4()
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    state,
    prompt: "consent",
  })

  authUrl.search = params.toString()

  // Store state in a cookie for verification
  cookieStore.set("youtube_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  })

  return NextResponse.json({
    authUrl: authUrl.toString(),
    state
  })
}