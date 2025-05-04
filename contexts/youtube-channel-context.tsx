"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

// Updated interface to match what we actually get from the YouTube API
interface YouTubeChannelData {
  id: string
  title: string
  description: string | null
  customUrl?: string | null
  thumbnail: string | null
  subscribers: number
  videos: number
  lastUpdated: string
  statistics?: {
    viewCount: string
    subscriberCount: string
    videoCount: string
  }
  thumbnails?: {
    default?: { url: string }
    medium?: { url: string }
    high?: { url: string }
  }
}

interface YouTubeChannelContextType {
  channelData: YouTubeChannelData | null
  isLoading: boolean
  isConnected: boolean
  error: string | null
  connectChannel: () => void
  disconnectChannel: () => Promise<void>
  refreshChannelData: () => Promise<void>
}

const YouTubeChannelContext = createContext<YouTubeChannelContextType | undefined>(undefined)

export function useYouTubeChannel() {
  const context = useContext(YouTubeChannelContext)
  if (context === undefined) {
    throw new Error("useYouTubeChannel must be used within a YouTubeChannelProvider")
  }
  return context
}

interface YouTubeChannelProviderProps {
  children: ReactNode
}

export function YouTubeChannelProvider({ children }: YouTubeChannelProviderProps) {
  const [channelData, setChannelData] = useState<YouTubeChannelData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Derived state
  const isConnected = !!channelData

  // For demo/preview purposes, create mock channel data
  const createMockChannelData = () => {
    return {
      id: "UC_demo_channel",
      title: "Demo YouTube Channel",
      description: "This is a demo YouTube channel for preview purposes",
      customUrl: "@demochannel",
      thumbnail: "/placeholder.svg?height=80&width=80",
      subscribers: 10000,
      videos: 50,
      lastUpdated: new Date().toISOString(),
      statistics: {
        viewCount: "500000",
        subscriberCount: "10000",
        videoCount: "50",
      },
      thumbnails: {
        default: { url: "/placeholder.svg?height=88&width=88" },
        medium: { url: "/placeholder.svg?height=240&width=240" },
        high: { url: "/placeholder.svg?height=800&width=800" },
      },
    }
  }

  // In preview mode, set mock data
  useEffect(() => {
    if (process.env.NODE_ENV === "development" || window.location.hostname.includes("vercel.app")) {
      setChannelData(createMockChannelData())
    }
  }, [])

  const connectChannel = () => {
    router.push("/connect-channel")
  }

  const disconnectChannel = async () => {
    try {
      setIsLoading(true)
      setChannelData(null)
      setError(null)

      // In a real app, we would clear tokens from the database
      // For now, just clear the state

      return Promise.resolve()
    } catch (error: any) {
      console.error("Error disconnecting channel:", error)
      setError(`Failed to disconnect channel: ${error.message}`)
      return Promise.reject(error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshChannelData = async () => {
    setIsLoading(true)
    try {
      // In a real app, we would fetch fresh data from the API
      // For now, just refresh the mock data
      if (process.env.NODE_ENV === "development" || window.location.hostname.includes("vercel.app")) {
        setChannelData(createMockChannelData())
      }
      return Promise.resolve()
    } catch (error: any) {
      console.error("Error refreshing channel data:", error)
      setError(`Failed to refresh channel data: ${error.message}`)
      return Promise.reject(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <YouTubeChannelContext.Provider
      value={{
        channelData,
        isLoading,
        isConnected,
        error,
        connectChannel,
        disconnectChannel,
        refreshChannelData,
      }}
    >
      {children}
    </YouTubeChannelContext.Provider>
  )
}
