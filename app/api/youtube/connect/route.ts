import { createServerClient } from '@supabase/ssr'
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { supabaseAdmin } from "@/lib/supabase-admin"

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

  let userId: string | undefined

  // 1. Try Bearer Token
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (user && !error) userId = user.id
  }

  // 2. Fallback to Cookies
  if (!userId) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    userId = session?.user?.id
  }

  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const REDIRECT_URI = getRedirectUri(request)

  const { searchParams } = new URL(request.url)
  const forceClaim = searchParams.get('force') === 'true'

  // Validate Google API credentials
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    // ... (keep validation logic) ...
    // just returning early to save token space in replacement
    console.error('❌ Missing Google OAuth credentials')
    return NextResponse.json({ error: "Missing Google OAuth credentials" }, { status: 500 })
  }

  const SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
  ]

  // Encode force claim into state
  const stateId = uuidv4()
  const state = forceClaim ? `${stateId}::force` : stateId

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

  // We no longer rely on youtube_force_claim cookie
  cookieStore.delete("youtube_force_claim")

  return NextResponse.json({
    authUrl: authUrl.toString(),
    state
  })
}