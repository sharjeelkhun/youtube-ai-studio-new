"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Check if we're in a preview environment
const isPreviewEnvironment = () => {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof window !== "undefined" && window.location.hostname === "v0.dev")
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const [isPreview, setIsPreview] = useState(isPreviewEnvironment())

  useEffect(() => {
    // Skip Supabase initialization in preview mode
    if (isPreview) {
      // Check if we have a preview login cookie
      const checkPreviewLogin = () => {
        const previewLoggedIn = document.cookie.includes("preview_logged_in=true")
        if (previewLoggedIn) {
          // Create a mock user and session for preview mode
          const mockUser = {
            id: "preview-user-id",
            email: "preview@example.com",
            user_metadata: {
              full_name: "Preview User",
            },
          }
          setUser(mockUser as any)
          setSession({ user: mockUser } as any)
        } else {
          setUser(null)
          setSession(null)
        }
        setIsLoading(false)
      }

      checkPreviewLogin()
      return
    }

    // Check if Supabase is properly initialized
    if (!supabase.auth) {
      console.warn("Supabase auth not available - skipping auth initialization")
      setIsLoading(false)
      return
    }

    try {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error("Error initializing auth:", error)
      setIsLoading(false)
    }
  }, [isPreview])

  const signUp = async (email: string, password: string, fullName: string) => {
    if (isPreview) {
      // Simulate signup in preview mode
      toast({
        title: "Preview Mode",
        description: "Account creation simulated. Please log in.",
      })
      router.push("/login")
      return
    }

    if (!supabase.auth) {
      throw new Error("Authentication service not available")
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      // Create a profile for the user
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            full_name: fullName,
          },
        ])

        if (profileError) throw profileError
      }

      toast({
        title: "Account created",
        description: "Please check your email to confirm your account.",
      })

      router.push("/login")
    } catch (error: any) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (isPreview) {
      // Set a cookie to indicate preview login
      document.cookie = "preview_logged_in=true; path=/; max-age=86400"

      // Create a mock user for preview
      const mockUser = {
        id: "preview-user-id",
        email: email,
        user_metadata: {
          full_name: "Preview User",
        },
      }

      // Set mock user and session
      setUser(mockUser as any)
      setSession({ user: mockUser } as any)

      // Show success toast
      toast({
        title: "Preview Mode",
        description: "Logged in successfully in preview mode.",
      })

      // Redirect to dashboard
      router.push("/dashboard")
      return
    }

    if (!supabase.auth) {
      throw new Error("Authentication service not available")
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push("/dashboard")
    } catch (error: any) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    if (isPreview) {
      // Clear preview login cookie
      document.cookie = "preview_logged_in=false; path=/; max-age=0"

      // Clear mock user and session
      setUser(null)
      setSession(null)

      // Show success toast
      toast({
        title: "Preview Mode",
        description: "Logged out successfully in preview mode.",
      })

      router.push("/login")
      return
    }

    if (!supabase.auth) {
      throw new Error("Authentication service not available")
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      router.push("/login")
    } catch (error: any) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    if (isPreview) {
      toast({
        title: "Preview Mode",
        description: "Password reset simulated. Check your email.",
      })
      return
    }

    if (!supabase.auth) {
      throw new Error("Authentication service not available")
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link.",
      })
    } catch (error: any) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signUp,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
