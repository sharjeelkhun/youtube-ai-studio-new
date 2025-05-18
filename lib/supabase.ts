import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Simple mock client for local development
const createDevClient = (): SupabaseClient => {
  return {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        // Accept any email/password for local development
        return {
          data: {
            user: { id: '1', email },
            session: { access_token: 'fake_token' }
          },
          error: null
        }
      },
      getSession: async () => ({
        data: { session: { user: { id: '1', email: 'dev@example.com' } } },
        error: null
      }),
      signOut: async () => ({ error: null })
    }
  } as unknown as SupabaseClient
}

// Always use dev client for local development
export const supabase = createDevClient()
