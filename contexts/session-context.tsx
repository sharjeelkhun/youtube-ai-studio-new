'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  supabase: SupabaseClient<Database>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          console.log('Initial session:', session);
          setSession(session);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Session error:', error);
        if (mounted) {
          setError(error as Error);
          setIsLoading(false);
        }
      }
    };

    initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (mounted) {
        setSession(session);
        
        if (event === 'SIGNED_IN' && !pathname.startsWith('/dashboard')) {
          // Wait a bit to ensure session is properly set
          await new Promise(resolve => setTimeout(resolve, 100));
          router.replace('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          // Don't redirect on sign out - let the logout function handle it
          console.log('User signed out, clearing session');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <SessionContext.Provider value={{ session, isLoading, error, supabase }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
} 