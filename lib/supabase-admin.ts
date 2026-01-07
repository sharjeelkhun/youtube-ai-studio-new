import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Note: This client should ONLY be used in server-side contexts (API routes, Server Actions)
// as it uses the Service Role Key which bypasses Row Level Security.
// NEVER expose this to the client.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // This prevents the build from failing, but runtime usage will fail if keys are missing
  console.error("CRITICAL: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.")
}

// We rely on the user having these set. If not, we can't really create a valid admin client.
// However, to prevent 'supabaseKey is required' immediate crash on module load:
export const supabaseAdmin = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
