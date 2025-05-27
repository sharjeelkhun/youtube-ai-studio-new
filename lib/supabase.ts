import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Environment detection
export const isServer = typeof window === "undefined"
export const isDevelopment = process.env.NODE_ENV === "development"

// Check if we're in the v0 preview environment
export const isPreview =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vusercontent.net") || window.location.hostname === "v0.dev")

// Export isPreviewEnvironment as an alias to isPreview for backward compatibility
export const isPreviewEnvironment = isPreview

// Create a mock client for preview mode
const createMockClient = () => {
  console.log("Using mock Supabase client for preview environment")

  // Mock storage for users in preview mode
  const mockUsers = new Map()
  let mockSession = null

  return {
    auth: {
      getSession: async () => ({ data: { session: mockSession }, error: null }),
      signInWithPassword: async ({ email, password }) => {
        // In preview mode, accept any credentials
        const user = {
          id: "preview-user-id",
          email,
          user_metadata: { full_name: "Preview User" },
        }
        mockSession = { user }
        return { data: { user, session: mockSession }, error: null }
      },
      signUp: async ({ email, password, options }) => {
        const user = {
          id: "preview-user-id",
          email,
          user_metadata: options?.data || {},
        }
        mockUsers.set(email, { user, password })
        return { data: { user, session: null }, error: null }
      },
      signOut: async () => {
        mockSession = null
        return { error: null }
      },
      onAuthStateChange: (callback) => {
        // Return mock subscription
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
    }),
  }
}

// Helper function to check if we're using a mock client
export const isMockClient = () => {
  return isPreview || !getSupabaseCredentials().url || !getSupabaseCredentials().key
}

// Get Supabase URL and key with fallbacks
const getSupabaseCredentials = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn("Supabase credentials missing")
    return { url: null, key: null }
  }

  return { url, key }
}

// Create a Supabase client
const createSupabaseClient = () => {
  // Check if we're in preview mode
  if (isPreview) {
    console.log("Preview environment detected - using mock authentication")
    return createMockClient()
  }

  // For real environments, use actual credentials
  const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseCredentials()

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials - authentication will not work properly")
    // Return mock client as fallback
    return createMockClient()
  }

  try {
    console.log("Creating real Supabase client with URL:", supabaseUrl)
    const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })

    // Test the connection
    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error connecting to Supabase:", error)
        } else {
          console.log("Supabase connected successfully")
        }
      })
      .catch((err) => {
        console.error("Exception connecting to Supabase:", err)
      })

    return client
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return createMockClient() // Fallback to mock client
  }
}

// Export the client
export const supabase = createSupabaseClient()
