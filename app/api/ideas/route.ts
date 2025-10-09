import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NewContentIdea } from "@/lib/types/ideas"

export const dynamic = "force-dynamic"

const getSupabase = () => {
  const cookieStore = cookies()
  if (!cookieStore) {
    throw new Error('Cookie store not available')
  }
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (e) {
            console.error('Error setting cookie:', e)
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (e) {
            console.error('Error removing cookie:', e)
          }
        },
      },
    }
  )

  // Test the supabase connection
  if (!supabase) {
    throw new Error('Failed to initialize Supabase client')
  }

  return supabase
}

// Get all ideas for the current user
export async function GET() {
  try {
    const supabase = getSupabase()

    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error("Session error in GET /api/ideas:", sessionError)
      throw sessionError
    }
    
    if (!sessionData?.session) {
      console.error("No session found in GET /api/ideas")
      return NextResponse.json({ error: "You must be signed in to view ideas" }, { status: 401 })
    }

    // Fetch ideas for the current user
    const { data: ideas, error: ideasError } = await supabase
      .from("content_ideas")
      .select("*")
      .eq("user_id", sessionData.session.user.id)
      .order("created_at", { ascending: false })

    if (ideasError) {
      console.error("Database error in GET /api/ideas:", ideasError)
      throw ideasError
    }

    console.log("Successfully fetched ideas for user:", sessionData.session.user.id, "Count:", ideas?.length || 0)
    return NextResponse.json(ideas || [])
  } catch (error) {
    console.error("Error in GET /api/ideas:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Unauthorized") ? 401 : 500 }
      )
    }
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching ideas" },
      { status: 500 }
    )
  }
}

// Save a new idea
export async function POST(req: Request) {
  try {
    const supabase = getSupabase()
    console.log("POST /api/ideas: Starting to process request")

    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error("Session error in POST /api/ideas:", sessionError)
      throw new Error("Authentication failed: " + sessionError.message)
    }
    
    if (!sessionData?.session) {
      console.error("No session found in POST /api/ideas")
      return NextResponse.json(
        { error: "You must be signed in to save ideas" },
        { status: 401 }
      )
    }

    // Parse and validate request body
    let ideaData: NewContentIdea
    try {
      ideaData = await req.json()
    } catch (e) {
      console.error("Failed to parse request body:", e)
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!ideaData.title || !ideaData.type) {
      console.error("Missing required fields in idea data")
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      )
    }
    
    // Add user_id and timestamps
    const now = new Date().toISOString()
    const ideaWithUser = {
      ...ideaData,
      user_id: sessionData.session.user.id,
      created_at: now,
      updated_at: now,
      metrics: ideaData.metrics || {},
      metadata: ideaData.metadata || {}
    }

    console.log("Attempting to save idea:", {
      title: ideaWithUser.title,
      type: ideaWithUser.type,
      user_id: ideaWithUser.user_id
    })

    const { data: savedIdea, error: saveError } = await supabase
      .from("content_ideas")
      .insert([ideaWithUser])
      .select()
      .single()

    if (saveError) {
      console.error("Database error in POST /api/ideas:", saveError)
      if (saveError.code === '23505') {
        return NextResponse.json(
          { error: "This idea already exists" },
          { status: 409 }
        )
      }
      throw saveError
    }

    if (!savedIdea) {
      throw new Error("Idea was saved but no data was returned")
    }

    console.log("Successfully saved idea:", savedIdea.id)
    return NextResponse.json(savedIdea)
  } catch (error) {
    console.error("Error in POST /api/ideas:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Authentication") ? 401 : 500 }
      )
    }
    return NextResponse.json(
      { error: "An unexpected error occurred while saving the idea" },
      { status: 500 }
    )
  }
}

// Update an existing idea
export async function PATCH(req: Request) {
  try {
    const supabase = getSupabase()
    console.log("PATCH /api/ideas: Starting to process request")

    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error("Session error in PATCH /api/ideas:", sessionError)
      throw new Error("Authentication failed: " + sessionError.message)
    }
    
    if (!sessionData?.session) {
      console.error("No session found in PATCH /api/ideas")
      return NextResponse.json(
        { error: "You must be signed in to update ideas" },
        { status: 401 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await req.json()
    } catch (e) {
      console.error("Failed to parse request body:", e)
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { id, ...updates } = body

    if (!id) {
      console.error("No idea ID provided in request body")
      return NextResponse.json(
        { error: "Idea ID is required" },
        { status: 400 }
      )
    }

    console.log("Attempting to update idea:", id, "with updates:", updates)

    const { data, error } = await supabase
      .from("content_ideas")
      .update(updates)
      .eq("id", id)
      .eq("user_id", sessionData.session.user.id) // Ensure user owns the idea
      .select()
      .single()

    if (error) {
      console.error("Database error in PATCH /api/ideas:", error)
      throw error
    }

    if (!data) {
      throw new Error("Idea was updated but no data was returned")
    }

    console.log("Successfully updated idea:", id)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PATCH /api/ideas:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Authentication") ? 401 : 500 }
      )
    }
    return NextResponse.json(
      { error: "An unexpected error occurred while updating the idea" },
      { status: 500 }
    )
  }
}

// Delete an idea
export async function DELETE(req: Request) {
  const supabase = getSupabase()

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Idea ID is required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("content_ideas")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting idea:", error)
    return NextResponse.json(
      { error: "Failed to delete idea" },
      { status: 500 }
    )
  }
}