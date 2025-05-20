"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabase, isPreview } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isPreview: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if we're in preview mode
    setIsPreviewMode(isPreview)
    console.log("Auth environment:", isPreview ? "Preview Mode" : "Production Mode")

    // For preview mode, check the cookie
    if (isPreview) {
      const previewLoggedIn = document.cookie.includes("preview_logged_in=true")
      if (previewLoggedIn) {
        // Create a mock user and session
        const mockUser = {
          id: "preview-user-id",
          email: "preview@example.com",
          user_metadata: { full_name: "Preview User" },
        }
        setUser(mockUser as any)
        setSession({ user: mockUser } as any)
      }
      setIsLoading(false)
      return
    }

    // For real environments, use Supabase auth
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error)
      } else {
        console.log("Initial session:", session ? "Found" : "None")
        setSession(session)
        setUser(session?.user ?? null)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session ? "Session exists" : "No session")
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true)
    try {
      // For preview mode
      if (isPreviewMode) {
        console.log("Preview mode: Simulating signup")
        // Create a mock user
        const mockUser = {
          id: "preview-user-id",
          email,
          user_metadata: { full_name: fullName },
        }

        // Set cookie for preview mode
        document.cookie = "preview_logged_in=true; path=/; max-age=86400"

        // Update state
        setUser(mockUser as any)
        setSession({ user: mockUser } as any)

        toast({
          title: "Account created",
          description: "Preview mode: Account created successfully",
        })

        router.push("/dashboard")
        return
      }

      // For real environments
      console.log("Production mode: Attempting to sign up with:", email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error("Signup error:", error)
        throw error
      }

      console.log("Signup successful:", data.user ? "User created" : "No user created")

      // Create a profile for the user
      if (data.user) {
        console.log("Creating profile for user:", data.user.id)
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            full_name: fullName,
          },
        ])

        if (profileError) {
          console.error("Profile creation error:", profileError)
          throw profileError
        }
      }

      toast({
        title: "Account created",
        description: "Please check your email to confirm your account.",
      })

      router.push("/login")
    } catch (error: any) {
      console.error("Signup process error:", error)
      toast({
        title: "Error",
        description: error.message || "Could not create your account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // For preview mode
      if (isPreviewMode) {
        console.log("Preview mode: Simulating login")
        // Create a mock user
        const mockUser = {
          id: "preview-user-id",
          email,
          user_metadata: { full_name: "Preview User" },
        }

        // Set cookie for preview mode
        document.cookie = "preview_logged_in=true; path=/; max-age=86400"

        // Update state
        setUser(mockUser as any)
        setSession({ user: mockUser } as any)

        toast({
          title: "Welcome back",
          description: "Preview mode: Logged in successfully",
        })

        router.push("/dashboard")
        return
      }

      // For real environments
      console.log("Production mode: Attempting to sign in with:", email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Login error:", error)
        throw error
      }

      console.log("Login successful:", data.user ? "User found" : "No user")

      setUser(data.user)
      setSession(data.session)

      toast({
        title: "Welcome back",
        description: "You have successfully logged in.",
      })

      router.push("/dashboard")
    } catch (error: any) {
      console.error("Login process error:", error)
      toast({
        title: "Error",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      // For preview mode
      if (isPreviewMode) {
        console.log("Preview mode: Simulating logout")
        // Clear cookie
        document.cookie = "preview_logged_in=false; path=/; max-age=0"

        // Clear state
        setUser(null)
        setSession(null)

        toast({
          title: "Logged out",
          description: "Preview mode: Logged out successfully",
        })

        router.push("/login")
        return
      }

      // For real environments
      console.log("Production mode: Signing out")
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Logout error:", error)
        throw error
      }

      console.log("Logout successful")

      setUser(null)
      setSession(null)

      toast({
        title: "Logged out",
        description: "You have successfully logged out.",
      })

      router.push("/login")
    } catch (error: any) {
      console.error("Logout process error:", error)
      toast({
        title: "Error",
        description: "Could not log out. Please try again.",
        variant: "destructive",
      })
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
        isPreview: isPreviewMode,
        signUp,
        signIn,
        signOut,
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
