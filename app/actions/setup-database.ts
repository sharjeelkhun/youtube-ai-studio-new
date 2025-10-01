"use server"

import { createClient } from "@/lib/supabase/server"

export async function setupDatabase() {
  const supabase = createClient()

  try {
    // Create profiles table if it doesn't exist
    const { error: profilesError } = await supabase.rpc("create_profiles_table_if_not_exists", {})

    if (profilesError) {
      // If the RPC doesn't exist, try direct SQL
      const { error: createProfilesError } = await supabase.from("profiles").select("id").limit(1)

      if (createProfilesError && createProfilesError.code === "42P01") {
        // Table doesn't exist
        // Create profiles table
        const { error } = await supabase.rpc("execute_sql", {
          sql: `
            CREATE TABLE IF NOT EXISTS profiles (
              id UUID PRIMARY KEY REFERENCES auth.users(id),
              full_name TEXT,
              avatar_url TEXT,
              youtube_access_token TEXT,
              youtube_refresh_token TEXT,
              youtube_token_expiry BIGINT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Users can insert their own profile" 
            ON profiles FOR INSERT 
            WITH CHECK (auth.uid() = id);
            
            CREATE POLICY "Users can view their own profile" 
            ON profiles FOR SELECT 
            USING (auth.uid() = id);
            
            CREATE POLICY "Users can update their own profile" 
            ON profiles FOR UPDATE 
            USING (auth.uid() = id);
          `,
        })

        if (error) {
          throw new Error(`Failed to create profiles table: ${error.message}`)
        }
      } else if (createProfilesError) {
        throw new Error(`Error checking profiles table: ${createProfilesError.message}`)
      }
    }

    // Check if youtube_access_token column exists in profiles
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "profiles")
      .eq("table_schema", "public")

    if (columnsError) {
      throw new Error(`Failed to check profiles columns: ${columnsError.message}`)
    }

    const hasYouTubeColumns = columns?.some((col) => col.column_name === "youtube_access_token")

    if (!hasYouTubeColumns) {
      // Add YouTube columns to profiles table
      const { error: alterError } = await supabase.rpc("execute_sql", {
        sql: `
          ALTER TABLE profiles 
          ADD COLUMN IF NOT EXISTS youtube_access_token TEXT,
          ADD COLUMN IF NOT EXISTS youtube_refresh_token TEXT,
          ADD COLUMN IF NOT EXISTS youtube_token_expiry BIGINT;
        `,
      })

      if (alterError) {
        throw new Error(`Failed to add YouTube columns to profiles: ${alterError.message}`)
      }
    }

    return { success: true, message: "Database setup completed successfully" }
  } catch (error: any) {
    console.error("Database setup error:", error)
    return { success: false, error: error.message }
  }
}
