import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to connect to Supabase",
          error: error.message,
          details: error,
        },
        { status: 500 },
      )
    }

    // Test database connection
    const { data: testData, error: testError } = await supabase.from("profiles").select("count").limit(1)

    if (testError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to query database",
          error: testError.message,
          details: testError,
          auth: "Connected",
          session: data.session ? "Active" : "None",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "success",
      message: "Successfully connected to Supabase",
      auth: "Connected",
      database: "Connected",
      session: data.session ? "Active" : "None",
    })
  } catch (error) {
    console.error("Supabase debug error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Exception testing Supabase connection",
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 },
    )
  }
}
