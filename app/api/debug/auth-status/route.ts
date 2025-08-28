import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Check if we're in a preview environment
    const isPreview = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (isPreview) {
      return NextResponse.json({
        status: "preview",
        message: "Running in preview mode",
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
      })
    }

    // Check Supabase connection
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: "Error checking auth status",
          error: error.message,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "success",
      authenticated: !!data.session,
      session: data.session
        ? {
            user: {
              id: data.session.user.id,
              email: data.session.user.email,
            },
            expires_at: data.session.expires_at,
          }
        : null,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Unexpected error checking auth status",
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 },
    )
  }
}
