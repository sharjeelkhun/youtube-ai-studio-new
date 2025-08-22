"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useSession } from "./session-context"
import type { Database } from "@/lib/database.types"
import { supabase } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  session: any | null
  isLoading: boolean
  isPreview: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  validateEmail: (email: string) => boolean
  validatePassword: (password: string) => boolean
  isMockAuth: boolean
  loading: boolean
  error: Error | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading: sessionLoading } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (session?.user) {
      setSupabaseUser(session.user)
      setUser({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name,
        avatar_url: session.user.user_metadata?.avatar_url,
      })
    } else {
      setSupabaseUser(null)
      setUser(null)
    }
    setIsLoading(false)
  }, [session])

  useEffect(() => {
    console.log('Auth context - Session state:', {
      hasSession: !!session,
      userId: session?.user?.id,
      currentPath: pathname
    })
  }, [session, pathname])

  const signIn = async (email: string, password: string) => {
    console.log('Starting sign in process...')
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign in error:', error)
        return { error }
      }
      
      console.log('Sign in successful:', {
        userId: data.user?.id,
        hasSession: !!data.session
      })

      // Wait for session to be set
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Force a refresh of the session
      const { data: { session: newSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error getting session after sign in:', sessionError)
        return { error: sessionError }
      }

      if (!newSession) {
        console.error('No session after sign in')
        return { error: new Error('No session after sign in') }
      }

      return { error: null }
    } catch (err) {
      console.error('Unexpected error during sign in:', err)
      const error = err instanceof Error ? err : new Error('Failed to sign in')
      setError(error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    console.log('Starting sign up process...')
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.error('Sign up error:', error)
        throw error
      }
      
      console.log('Sign up successful:', {
        userId: data.user?.id,
        hasSession: !!data.session
      })

      // Let the middleware handle the redirect
      router.refresh()
    } catch (err) {
      console.error('Unexpected error during sign up:', err)
      setError(err instanceof Error ? err : new Error('Failed to sign up'))
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const resetPassword = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const value = {
    user,
    supabaseUser,
    session,
    isLoading: isLoading || sessionLoading,
    isPreview: false,
    signIn,
    signUp,
    signOut,
    resetPassword,
    validateEmail,
    validatePassword,
    isMockAuth: false,
    loading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
