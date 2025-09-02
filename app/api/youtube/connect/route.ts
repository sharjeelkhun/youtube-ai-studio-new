import { createServerClient } from '@supabase/ssr'
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

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

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    )
  }

  const url = new URL(request.url)
  const redirectUri = `${url.origin}/connect-channel/callback`
  const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || redirectUri

  // Validate Google API credentials
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { 
        error: "Google OAuth credentials are not configured",
        debug: {
          clientId: !!process.env.GOOGLE_CLIENT_ID,
          clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          redirectUri: REDIRECT_URI,
          env: process.env.NODE_ENV
        }
      },
      { status: 500 }
    )
  }

  const SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
    "https://www.googleapis.com/auth/yt-analytics.readonly"
  ]

  const state = uuidv4()
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    state: state,
    prompt: 'consent'
  })

  authUrl.search = params.toString()

  // Store state in a cookie for verification
  cookieStore.set('youtube_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  })

  return NextResponse.json({
    authUrl: authUrl.toString(),
    state,
    debug: {
      redirectUri: REDIRECT_URI,
      clientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      env: process.env.NODE_ENV
    }
  })
}
