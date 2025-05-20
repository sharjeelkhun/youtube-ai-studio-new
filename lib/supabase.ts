import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Environment detection
export const isServer = typeof window === "undefined"
export const isDevelopment = process.env.NODE_ENV === "development"
export const isPreview =
  typeof window !== "undefined" &&
  (window.location.hostname === "v0.dev" || window.location.hostname.includes("lite.vusercontent.net"))

// Get Supabase URL and key with fallbacks
const getSupabaseCredentials = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn("Supabase credentials missing. Using mock client.")
    return { url: null, key: null }
  }

  return { url, key }
}

// Create a mock client for preview/development without credentials
const createMockClient = () => {
  console.warn("Using mock Supabase client")

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async ({ email }) => {
        // Simulate successful login with mock data
        const mockUser = {
          id: "mock-user-id",
          email,
          user_metadata: { full_name: "Mock User" },
        }
        const mockSession = { user: mockUser }
        return { data: { user: mockUser, session: mockSession }, error: null }
      },
      signUp: async ({ email, options }) => {
        // Simulate successful signup with mock data
        const mockUser = {
          id: "mock-user-id",
          email,
          user_metadata: options?.data || {},
        }
        return { data: { user: mockUser, session: null }, error: null }
      },
      signOut: async () => ({ error: null }),
      onAuthStateChange: (callback) => {
        // Return mock subscription
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
    },
    from: (table) => ({
      select: (columns = "*") => ({
        eq: (column, value) => ({
          single: async () => {
            // Return mock profile data for profiles table
            if (table === "profiles") {
              return {
                data: {
                  id: "mock-user-id",
                  full_name: "Mock User",
                  avatar_url: null,
                  created_at: new Date().toISOString(),
                },
                error: null,
              }
            }
            return { data: null, error: null }
          },
          limit: (limit) => ({ data: [], error: null }),
        }),
        limit: (limit) => ({ data: [], error: null }),
      }),
      insert: async (values) => ({ data: values, error: null }),
      upsert: async (values) => ({ data: values, error: null }),
      update: async (values) => ({ data: values, error: null }),
      delete: async () => ({ data: null, error: null }),
    }),
    rpc: async () => ({ data: null, error: null }),
  }
}

// Create a singleton instance
let supabaseInstance: any = null

// Create a Supabase client for browser
const createBrowserClient = () => {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Get credentials
  const { url, key } = getSupabaseCredentials()

  // Use mock client in preview or when credentials are missing
  if (isPreview || !url || !key) {
    supabaseInstance = createMockClient()
    return supabaseInstance
  }

  try {
    // Create real client
    supabaseInstance = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "supabase.auth.token",
      },
    })

    // Test connection
    supabaseInstance.auth
      .getSession()
      .then(({ error }) => {
        if (error) {
          console.error("Supabase connection error:", error.message)
        } else {
          console.log("Supabase connected successfully")
        }
      })
      .catch((err) => {
        console.error("Supabase connection exception:", err)
      })

    return supabaseInstance
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    supabaseInstance = createMockClient()
    return supabaseInstance
  }
}

// Create a Supabase client for server
const createServerClient = () => {
  // Use mock client in preview or when credentials are missing
  const { url, key } = getSupabaseCredentials()

  if (isPreview || !url || !key) {
    return createMockClient()
  }

  try {
    return createClient<Database>(url, key, {
      auth: {
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Error creating server Supabase client:", error)
    return createMockClient()
  }
}

// Export the appropriate client based on environment
export const supabase = isServer ? createServerClient() : createBrowserClient()

// Helper function to check if we're using a mock client
export const isMockClient = () => {
  return isPreview || !getSupabaseCredentials().url || !getSupabaseCredentials().key
}
