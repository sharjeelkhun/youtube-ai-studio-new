"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Session, User, AuthError } from "@supabase/supabase-js"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isPreview: boolean
  isMockAuth: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<{ success: boolean }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  validateEmail: (email: string) => { valid: boolean; error?: string }
  validatePassword: (password: string) => { valid: boolean; error?: string }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreview] = useState(process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true')
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Initialize auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true)
    try {
      // Input validation
      if (!email || !password || !fullName) {
        throw new Error("All fields are required")
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      if (data.user?.identities?.length === 0) {
        throw new Error("This email is already registered. Please try logging in instead.")
      }

      if (data.user) {
        await supabase.from("profiles").insert([
          { id: data.user.id, full_name: fullName }
        ])

        toast({
          title: "One more step required",
          description: "We've sent you a confirmation email. Please check your inbox and click the verification link to activate your account.",
          duration: 8000
        })

        // Wait a moment before redirecting
        await new Promise(resolve => setTimeout(resolve, 2000))
        router.push("/login?verification=pending&email=" + encodeURIComponent(email))
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Could not create account",
        variant: "destructive",
        duration: 4000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Wait for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        setUser(currentSession.user)
        setSession(currentSession)
        
        toast({
          title: "Success",
          description: "Successfully logged in"
        })

        window.location.href = '/dashboard'
        return { success: true }
      } else {
        throw new Error('Failed to establish session')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast({
        title: "Error",
        description: "Invalid credentials",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      window.location.replace('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      })
    }
  }

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isPreview) {
        // Simulate password reset in preview mode
        await new Promise(resolve => setTimeout(resolve, 1000))
        return { success: true }
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'An unexpected error occurred' }
    }
  }

  const validateEmail = (email: string): { valid: boolean; error?: string } => {
    if (!email) {
      return { valid: false, error: 'Email is required' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' }
    }

    return { valid: true }
  }

  const validatePassword = (password: string): { valid: boolean; error?: string } => {
    if (!password) {
      return { valid: false, error: 'Password is required' }
    }

    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' }
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter' }
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter' }
    }

    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number' }
    }

    return { valid: true }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isPreview,
      isMockAuth: isPreview,
      signUp,
      signIn,
      signOut,
      resetPassword,
      validateEmail,
      validatePassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
