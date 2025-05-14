"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

// Check if we're in a preview environment
const isPreviewEnvironment = () => {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    (typeof window !== "undefined" &&
      (window.location.hostname === "v0.dev" || window.location.hostname.includes("lite.vusercontent.net")))
  )
}

// Mock channel data for preview mode
const mockChannelData = {
  id: "UC123456789",
  user_id: "preview-user-id",
  title: "Demo YouTube Channel",
  description: "This is a demo YouTube channel for preview mode",
  subscribers: 10500,
  videos: 42,
  thumbnail: "https://via.placeholder.com/150",
  created_at: new Date().toISOString(),
  last_updated: new Date().toISOString(),
}

const YouTubeChannelContext = createContext(null)

export function YouTubeChannelProvider({ children }) {
  const [channel, setChannel] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    // Check if we're in preview mode
    const preview = isPreviewEnvironment()
    setIsPreview(preview)

    // In preview mode, set mock data
    if (preview) {
      setChannel(mockChannelData)
      setIsLoading(false)
      return
    }

    // Skip if no user
    if (!user) {
      setIsLoading(false)
      return
    }

    async function fetchChannel() {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from("youtube_channels")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (error) {
          throw error
        }

        setChannel(data)
      } catch (err) {
        console.error("Error fetching YouTube channel:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChannel()
  }, [user])

  return (
    <YouTubeChannelContext.Provider
      value={{
        channel: channel || (isPreview ? mockChannelData : null),
        isLoading,
        error,
        isPreview,
      }}
    >
      {children}
    </YouTubeChannelContext.Provider>
  )
}

export function useYouTubeChannel() {
  const context = useContext(YouTubeChannelContext)
  if (!context) {
    throw new Error("useYouTubeChannel must be used within a YouTubeChannelProvider")
  }
  return context
}
