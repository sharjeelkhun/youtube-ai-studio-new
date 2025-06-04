import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Test database connection
    const { data, error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to connect to database",
          error: error.message,
          details: error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "success",
      message: "Successfully connected to database",
      data,
    })
  } catch (error) {
    console.error("Database debug error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Exception testing database connection",
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 },
    )
  }
}
