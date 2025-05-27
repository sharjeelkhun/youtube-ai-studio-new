import { supabase } from "@/lib/supabase"

// Create profiles table if it doesn't exist
export async function setupDatabase() {
  try {
    // Check if profiles table exists
    const { data: tables, error: tablesError } = await supabase.rpc("get_tables")

    if (tablesError) {
      console.error("Error checking tables:", tablesError)
      return { success: false, error: tablesError.message }
    }

    const hasProfilesTable = tables?.some((table) => table === "profiles")

    if (!hasProfilesTable) {
      // Create profiles table
      const { error: createError } = await supabase.rpc("create_profiles_table")

      if (createError) {
        console.error("Error creating profiles table:", createError)
        return { success: false, error: createError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Database setup error:", error)
    return { success: false, error: error.message }
  }
}

// Create stored procedures for database setup
export async function createStoredProcedures() {
  try {
    // Create get_tables function
    const { error: getTablesError } = await supabase.rpc("create_get_tables_function")

    if (getTablesError) {
      console.error("Error creating get_tables function:", getTablesError)
      return { success: false, error: getTablesError.message }
    }

    // Create create_profiles_table function
    const { error: createProfilesError } = await supabase.rpc("create_create_profiles_table_function")

    if (createProfilesError) {
      console.error("Error creating create_profiles_table function:", createProfilesError)
      return { success: false, error: createProfilesError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Stored procedures setup error:", error)
    return { success: false, error: error.message }
  }
}
