import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Check if we're in a preview environment
const isPreviewEnvironment = () => {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof window !== "undefined" &&
      (window.location.hostname === "v0.dev" || window.location.hostname.includes("lite.vusercontent.net")))
  )
}

// Create a mock client for preview mode
const createMockClient = () => {
  console.warn("Preview environment detected or missing credentials. Using mock Supabase client.")

  // Return a mock client with basic functionality
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          limit: () => ({ data: [], error: null }),
        }),
        limit: () => ({ data: [], error: null }),
      }),
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
    }),
    rpc: async () => ({ data: null, error: null }),
  }
}

// Create a singleton instance to avoid multiple initializations
let supabaseInstance: any = null

// Create a Supabase client
const createBrowserClient = () => {
  // If we already have an instance, return it
  if (supabaseInstance) {
    return supabaseInstance
  }

  // If we're in a preview environment, return a mock client
  if (isPreviewEnvironment()) {
    supabaseInstance = createMockClient()
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing.")
    supabaseInstance = createMockClient()
    return supabaseInstance
  }

  try {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
    return supabaseInstance
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    supabaseInstance = createMockClient()
    return supabaseInstance
  }
}

// Create a server-side client
const createServerClient = () => {
  // Always return a mock client on the server in preview mode
  return createMockClient()
}

// Export a lazy-loaded client to avoid initialization during build/preview
export const supabase = typeof window !== "undefined" ? createBrowserClient() : createServerClient()
