import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createClient()
  try {
    // Check auth status
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user if session exists
    let user = null
    if (data.session) {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (!userError) {
        user = userData.user
      }
    }

    return NextResponse.json({
      authenticated: !!data.session,
      session: data.session,
      user,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 })
  }
}
