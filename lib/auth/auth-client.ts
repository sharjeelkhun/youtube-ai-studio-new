import { createBrowserClient } from '@supabase/ssr'
import type { Database } from "@/lib/database.types"
import type { CookieOptions } from '@supabase/ssr'

const createAuthClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'supabase.auth.token',
        detectSessionInUrl: false,
        flowType: 'pkce'
      },
      cookies: {
        get: (name: string) => {
          if (typeof document === 'undefined') return ''
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
          return match ? match[2] : ''
        },
        set: (name: string, value: string, options: CookieOptions) => {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=${value}; path=${options.path || '/'}; max-age=${options.maxAge || 86400}`
        },
        remove: (name: string, options?: { path?: string }) => {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; path=${options?.path || '/'}; expires=Thu, 01 Jan 1970 00:00:01 GMT`
        }
      }
    }
  )
}

export const authClient = createAuthClient()
