import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if we're in a preview environment
    const isPreview =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"

    if (isPreview) {
      return NextResponse.json({
        status: "preview",
        message: "Running in preview mode with mock data",
        database: {
          connected: true,
          mock: true,
        },
        environment: {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
          VERCEL_ENV: process.env.VERCEL_ENV,
        },
      })
    }

    // Try to connect to the database
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Test query to check connection
    const { data, error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: "Database connection failed",
          error: error.message,
          database: {
            connected: false,
            mock: false,
          },
          environment: {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
            VERCEL_ENV: process.env.VERCEL_ENV,
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      database: {
        connected: true,
        mock: false,
      },
      environment: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
        VERCEL_ENV: process.env.VERCEL_ENV,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: `An unexpected error occurred: ${error.message}`,
        error: error.stack,
        database: {
          connected: false,
          mock: false,
        },
        environment: {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
          VERCEL_ENV: process.env.VERCEL_ENV,
        },
      },
      { status: 500 },
    )
  }
}
