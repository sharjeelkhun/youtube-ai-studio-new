import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') {
          return null;
        }
        // First try to get from cookie
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${key}=`))
          ?.split('=')[1];

        if (cookieValue) {
          try {
            return JSON.parse(decodeURIComponent(cookieValue));
          } catch {
            return cookieValue;
          }
        }

        // Fallback to localStorage
        const value = localStorage.getItem(key);
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') {
          return;
        }
        // Set in both cookie and localStorage
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        document.cookie = `${key}=${encodeURIComponent(stringValue)}; path=/; max-age=2592000; SameSite=Lax`;
        localStorage.setItem(key, stringValue);
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') {
          return;
        }
        // Remove from both cookie and localStorage
        document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
        localStorage.removeItem(key);
      }
    }
  },
  global: {
    headers: {
      'x-application-name': 'youtube-ai-studio'
    }
  }
});

// Preview/Mock mode utilities
export const isPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export const isMockClient = () => {
  return process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'
}
