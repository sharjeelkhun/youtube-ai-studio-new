import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: Request) {
  const supabase = createClient()
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    // Create user
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    // Create profile
    if (userData.user) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: userData.user.id,
          full_name: fullName,
        },
      ])

      if (profileError) {
        return NextResponse.json(
          { error: `User created but profile creation failed: ${profileError.message}` },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: userData.user,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 })
  }
}
