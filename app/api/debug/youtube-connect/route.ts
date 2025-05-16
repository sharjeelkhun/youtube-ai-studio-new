import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Collect environment variables (safely)
    const envInfo = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not set",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    }

    // Construct the redirect URI that would be used
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://youtube-ai-studio-new.vercel.app"}/connect-channel/callback`

    // Return debug information
    return NextResponse.json({
      environment: envInfo,
      redirectUri,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({
      error: `Error collecting debug info: ${error.message}`,
      timestamp: new Date().toISOString(),
    })
  }
}
