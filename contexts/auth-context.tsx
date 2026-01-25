"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "./session-context"
import type { Database } from "@/lib/database.types"
import { supabase } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface User {
  id: string
  email: string
  name?: string
  phone?: string
  avatar_url?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  session: any | null
  isLoading: boolean
  isPreview: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string, phone: string, plan?: string | null) => Promise<void>
  verifyOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'magiclink') => Promise<{ error: any }>
  resendOtp: (email: string, type: 'signup' | 'email_change') => Promise<{ error: any }>
  signInWithGoogle: () => Promise<void>
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const syncUser = async () => {
      if (session?.user) {
        setSupabaseUser(session.user)

        // Fetch profile to get role
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single() as any

        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: profile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          phone: profile?.phone || session.user.user_metadata?.phone,
          avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
          role: profile?.role || 'user'
        })
      } else {
        setSupabaseUser(null)
        setUser(null)
      }
      setIsLoading(false)
    }

    syncUser()
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

  const signUp = async (email: string, password: string, name: string, phone: string, plan?: string | null) => {
    console.log('Starting sign up process with name:', name, 'and phone:', phone)
    console.log('Starting sign up process...')
    setLoading(true)
    setError(null)

    try {
      // 1. Pre-registration check: Verify if email already exists
      // This provides better UX because Supabase often silently fails for security
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (checkRes.ok) {
        const { exists } = await checkRes.json()
        if (exists) {
          throw new Error("An account with this email already exists. Please sign in instead.")
        }
      }

      const redirectUrl = plan
        ? `${window.location.origin}/callback?plan=${plan}`
        : `${window.location.origin}/callback`

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
            phone: phone,
          }
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

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'recovery' | 'magiclink') => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      })
      if (error) throw error
      return { error: null }
    } catch (err: any) {
      setError(err)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async (email: string, type: 'signup' | 'email_change') => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.resend({
        email,
        type,
      })
      if (error) throw error
      return { error: null }
    } catch (err: any) {
      setError(err)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    console.log('Starting Google sign in...')
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      console.error('Error during Google sign in:', err)
      setError(err instanceof Error ? err : new Error('Failed to sign in with Google'))
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
    signInWithGoogle,
    verifyOtp,
    resendOtp,
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
