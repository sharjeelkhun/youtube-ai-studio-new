"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase, isPreview, isMockClient } from "@/lib/supabase"
import type { Session, User, AuthError } from "@supabase/supabase-js"
import { useToast } from "@/components/ui/use-toast"

// Define validation rules
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 6

// Define error messages
const ERROR_MESSAGES = {
  INVALID_EMAIL: "Please enter a valid email address",
  PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  INVALID_CREDENTIALS: "Invalid login credentials",
  EMAIL_IN_USE: "This email is already in use",
  SERVER_ERROR: "Server error. Please try again later",
  NETWORK_ERROR: "Network error. Please check your connection",
  UNKNOWN_ERROR: "An unknown error occurred",
}

// Define auth context type
interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isMockAuth: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  validateEmail: (email: string) => { valid: boolean; error?: string }
  validatePassword: (password: string) => { valid: boolean; error?: string }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMockAuth, setIsMockAuth] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email || !EMAIL_REGEX.test(email)) {
      return { valid: false, error: ERROR_MESSAGES.INVALID_EMAIL }
    }
    return { valid: true }
  }

  const validatePassword = (password: string) => {
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      return { valid: false, error: ERROR_MESSAGES.PASSWORD_TOO_SHORT }
    }
    return { valid: true }
  }

  // Handle Supabase errors
  const handleAuthError = (error: AuthError | Error | any): string => {
    console.error("Auth error:", error)

    // Network errors
    if (error.message?.includes("fetch") || error.message?.includes("network")) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }

    // Supabase specific errors
    if (error.code) {
      switch (error.code) {
        case "auth/invalid-email":
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "invalid_credentials":
          return ERROR_MESSAGES.INVALID_CREDENTIALS
        case "auth/email-already-in-use":
        case "email_in_use":
          return ERROR_MESSAGES.EMAIL_IN_USE
        case "server_error":
          return ERROR_MESSAGES.SERVER_ERROR
        default:
          return error.message || ERROR_MESSAGES.UNKNOWN_ERROR
      }
    }

    // Generic error handling
    return error.message || ERROR_MESSAGES.UNKNOWN_ERROR
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      setIsMockAuth(isMockClient())

      // Handle preview mode
      if (isPreview) {
        const checkPreviewLogin = () => {
          const previewLoggedIn = document.cookie.includes("preview_logged_in=true")
          if (previewLoggedIn) {
            // Create mock user and session
            const mockUser = {
              id: "preview-user-id",
              email: "preview@example.com",
              user_metadata: { full_name: "Preview User" },
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

      try {
        // Get initial session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
        } else {
          setSession(data.session)
          setUser(data.session?.user ?? null)
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Sign up function
  const signUp = async (email: string, password: string, fullName: string) => {
    // Validate inputs
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error }
    }

    if (!fullName.trim()) {
      return { success: false, error: "Please enter your name" }
    }

    setIsLoading(true)

    try {
      // Handle preview mode
      if (isPreview) {
        toast({
          title: "Preview Mode",
          description: "Account created successfully (simulated)",
        })

        setTimeout(() => {
          router.push("/login")
        }, 1000)

        return { success: true }
      }

      // Real signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (error) throw error

      // Create profile
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
        description: "Please check your email to confirm your account",
      })

      router.push("/login")
      return { success: true }
    } catch (error) {
      const errorMessage = handleAuthError(error)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    // Validate inputs
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error }
    }

    setIsLoading(true)

    try {
      // Handle preview mode
      if (isPreview) {
        // Set cookie for preview mode
        document.cookie = "preview_logged_in=true; path=/; max-age=86400"

        // Create mock user
        const mockUser = {
          id: "preview-user-id",
          email,
          user_metadata: { full_name: "Preview User" },
        }

        // Update state
        setUser(mockUser as any)
        setSession({ user: mockUser } as any)

        toast({
          title: "Logged in",
          description: "You have successfully logged in (preview mode)",
        })

        router.push("/dashboard")
        return { success: true }
      }

      // Real login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Update state
      setUser(data.user)
      setSession(data.session)

      toast({
        title: "Logged in",
        description: "You have successfully logged in",
      })

      router.push("/dashboard")
      return { success: true }
    } catch (error) {
      const errorMessage = handleAuthError(error)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    setIsLoading(true)

    try {
      // Handle preview mode
      if (isPreview) {
        // Clear cookie
        document.cookie = "preview_logged_in=false; path=/; max-age=0"

        // Clear state
        setUser(null)
        setSession(null)

        toast({
          title: "Logged out",
          description: "You have successfully logged out (preview mode)",
        })

        router.push("/login")
        return { success: true }
      }

      // Real logout
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      // Clear state
      setUser(null)
      setSession(null)

      toast({
        title: "Logged out",
        description: "You have successfully logged out",
      })

      router.push("/login")
      return { success: true }
    } catch (error) {
      const errorMessage = handleAuthError(error)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Reset password function
  const resetPassword = async (email: string) => {
    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error }
    }

    setIsLoading(true)

    try {
      // Handle preview mode
      if (isPreview) {
        toast({
          title: "Password reset email sent",
          description: "Check your email for a password reset link (simulated)",
        })

        return { success: true }
      }

      // Real password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link",
      })

      return { success: true }
    } catch (error) {
      const errorMessage = handleAuthError(error)
      return { success: false, error: errorMessage }
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
        isMockAuth,
        signUp,
        signIn,
        signOut,
        resetPassword,
        validateEmail,
        validatePassword,
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
