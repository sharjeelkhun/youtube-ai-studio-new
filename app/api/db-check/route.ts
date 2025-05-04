import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if we can connect to the database
    const { data: tables, error: tablesError } = await supabase
      .from("pg_catalog.pg_tables")
      .select("tablename")
      .eq("schemaname", "public")

    if (tablesError) {
      return NextResponse.json(
        {
          connected: false,
          error: tablesError.message,
          message: "Failed to query tables",
        },
        { status: 500 },
      )
    }

    // Check if profiles table exists and has the required columns
    const { data: profilesColumns, error: profilesError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "profiles")
      .eq("table_schema", "public")

    // Check if we can query the profiles table
    const { data: profiles, error: profilesQueryError } = await supabase.from("profiles").select("*").limit(1)

    return NextResponse.json({
      connected: true,
      tables: tables?.map((t) => t.tablename) || [],
      profilesColumns: profilesColumns?.map((c) => c.column_name) || [],
      profilesQueryResult: profilesQueryError ? "Error: " + profilesQueryError.message : "Success",
      message: "Database connection successful",
    })
  } catch (error: any) {
    console.error("Database check error:", error)
    return NextResponse.json(
      {
        connected: false,
        error: error.message,
        message: "Failed to connect to database",
      },
      { status: 500 },
    )
  }
}
