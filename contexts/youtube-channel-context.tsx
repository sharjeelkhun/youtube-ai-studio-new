"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import { db, type YouTubeChannel, isPreviewEnvironment } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { usePathname } from "next/navigation"

interface YouTubeChannelContextType {
  channel: YouTubeChannel | null
  isLoading: boolean
  error: string | null
  refreshChannel: () => Promise<void>
  hasConnectedChannel: boolean
}

const YouTubeChannelContext = createContext<YouTubeChannelContextType | undefined>(undefined)

export function YouTubeChannelProvider({ children }: { children: ReactNode }) {
  const [channel, setChannel] = useState<YouTubeChannel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasConnectedChannel, setHasConnectedChannel] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const pathname = usePathname()
  const isPreview = isPreviewEnvironment()

  // Determine if we're on a page that requires a channel
  const requiresChannel =
    pathname?.includes("/dashboard") &&
    !pathname?.includes("/connect-channel") &&
    !pathname?.includes("/settings") &&
    !pathname?.includes("/profile")

  const fetchChannel = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (isPreview) {
        // Use mock data in preview mode
        const mockChannel = await db.channels.getByUserId("preview-user-id")
        setChannel(mockChannel)
        setHasConnectedChannel(true)
        return
      }

      if (!user) {
        setChannel(null)
        setHasConnectedChannel(false)
        return
      }

      const channelData = await db.channels.getByUserId(user.id)

      if (channelData) {
        setChannel(channelData)
        setHasConnectedChannel(true)

        // Check if token is expired and needs refresh
        const tokenExpiresAt = new Date(channelData.token_expires_at || 0)
        if (tokenExpiresAt < new Date()) {
          // Token is expired, should refresh
          // This would be implemented in a real app
          console.log("Token expired, should refresh")
        }
      } else {
        setChannel(null)
        setHasConnectedChannel(false)

        if (requiresChannel) {
          toast({
            title: "No YouTube Channel",
            description: "Please connect your YouTube channel to continue",
            variant: "destructive",
          })
        }
      }
    } catch (err: any) {
      console.error("Error in fetchChannel:", err)
      setError(`An unexpected error occurred: ${err.message}`)

      if (requiresChannel) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to fetch YouTube channel: ${err.message}`,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshChannel = async () => {
    await fetchChannel()
  }

  useEffect(() => {
    if (user || isPreview) {
      fetchChannel()
    } else {
      setIsLoading(false)
      setChannel(null)
      setHasConnectedChannel(false)
    }
  }, [user, isPreview])

  return (
    <YouTubeChannelContext.Provider
      value={{
        channel,
        isLoading,
        error,
        refreshChannel,
        hasConnectedChannel,
      }}
    >
      {children}
    </YouTubeChannelContext.Provider>
  )
}

export function useYouTubeChannel() {
  const context = useContext(YouTubeChannelContext)
  if (context === undefined) {
    throw new Error("useYouTubeChannel must be used within a YouTubeChannelProvider")
  }
  return context
}
