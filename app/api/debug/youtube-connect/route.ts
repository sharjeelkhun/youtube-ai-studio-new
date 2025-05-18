import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Collect environment information
    const envInfo = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not set",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    }

    // Construct the redirect URI that would be used
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/connect-channel/callback`

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      redirectUri,
      scopes: ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/youtube.force-ssl"],
    })
  } catch (error: any) {
    return NextResponse.json({
      error: `An error occurred while collecting debug information: ${error.message}`,
      stack: error.stack,
    })
  }
}
