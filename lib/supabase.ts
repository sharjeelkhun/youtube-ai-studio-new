import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Preview/Mock mode utilities
export const isPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export const isMockClient = () => {
  return process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'
}

// Preview/Mock mode utilities
export const isPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export const isMockClient = () => {
  return process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'
}
