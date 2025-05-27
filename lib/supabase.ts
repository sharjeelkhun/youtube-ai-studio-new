import { createBrowserClient } from '@supabase/ssr'
import type { Database } from "@/lib/database.types"

const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      cookies: {
        get: (name: string) => {
          if (typeof document === 'undefined') return ''
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : ''
        },
        set: (name: string, value: string, options: { path?: string; domain?: string; maxAge?: number; secure?: boolean }) => {
          if (typeof document === 'undefined') return
          let cookie = `${name}=${value}; path=${options.path || '/'}`
          if (options.maxAge) cookie += `; max-age=${options.maxAge}`
          if (options.secure) cookie += '; secure; samesite=strict'
          document.cookie = cookie
        },
        remove: (name: string) => {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
        }
      }
    }
  )
}

export const supabase = createClient()
