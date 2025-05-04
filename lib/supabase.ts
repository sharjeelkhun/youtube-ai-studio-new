import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Create a single supabase client for the browser
const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing. Using dummy client.")
    // Return a dummy client for preview/development when credentials are missing
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        signOut: () => Promise.resolve({ error: null }),
        resetPasswordForEmail: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: () => Promise.resolve({ error: new Error("Supabase not configured") }),
        update: () => ({
          eq: () => Promise.resolve({ error: new Error("Supabase not configured") }),
        }),
        upsert: () => Promise.resolve({ error: new Error("Supabase not configured") }),
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ error: new Error("Supabase not configured") }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
      rpc: () => Promise.resolve({ error: new Error("Supabase not configured") }),
    } as any
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Export a lazy-loaded client to avoid initialization during build/preview
export const supabase = typeof window !== "undefined" ? createBrowserClient() : ({} as any)

// Server-side client with service role for admin operations
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase server credentials missing")
    return null
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}
