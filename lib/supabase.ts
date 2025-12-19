import { supabase as browserClient } from './supabase/client'

// Re-export the standard browser client to ensure a single instance
export const supabase = browserClient

// Preview/Mock mode utilities
export const isPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export const isMockClient = () => {
  return process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'
}
