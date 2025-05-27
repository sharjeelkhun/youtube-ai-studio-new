"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { YouTubeChannel } from "@/lib/db"
import { useAuth } from "./auth-context"
import { supabase } from "@/lib/supabase"
import { youtubeService } from "@/lib/youtube-service"

// Add cache duration constant (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000

interface YouTubeChannelContextType {
  isLoading: boolean
  isConnected: boolean
  channelData: YouTubeChannel | null
  error: string | null
  refreshChannel: () => Promise<void>
}

const YouTubeChannelContext = createContext<YouTubeChannelContextType | undefined>(undefined)

export function YouTubeChannelProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [channelData, setChannelData] = useState<YouTubeChannel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchChannel = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const { data: channel, error: channelError } = await supabase
        .from('youtube_channels')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (channelError || !channel?.access_token) {
        setIsConnected(false)
        setChannelData(null)
        return
      }

      try {
        const response = await fetch('/api/youtube/channel', {
          headers: {
            'Authorization': `Bearer ${channel.access_token}`,
            'Accept': 'application/json',
          }
        })

        const data = await response.json()

        if (!response.ok) {
          // Handle quota exceeded silently
          if (response.status === 429 || data.error?.includes('quota')) {
            console.warn('YouTube API quota exceeded - Using cached data:', {
              channelId: channel.id,
              lastUpdated: channel.last_updated
            })
            // Silently use cached data without showing error to user
            setChannelData(channel)
            setIsConnected(true)
            return
          }
          throw new Error(data.error || 'Failed to fetch channel data')
        }

        const channelData = data.items?.[0]
        if (!channelData) {
          throw new Error('No channel data found')
        }

        const updatedChannel = {
          ...channel,
          subscribers: parseInt(channelData.statistics?.subscriberCount) || channel.subscribers || 0,
          videos: parseInt(channelData.statistics?.videoCount) || channel.videos || 0,
          views: parseInt(channelData.statistics?.viewCount) || channel.views || 0,
          thumbnail: channelData.snippet?.thumbnails?.default?.url,
          title: channelData.snippet?.title || channel.title,
          last_updated: new Date().toISOString()
        }

        await supabase
          .from('youtube_channels')
          .update(updatedChannel)
          .eq('id', channel.id)

        setChannelData(updatedChannel)
        setIsConnected(true)
        setError(null)
      } catch (apiError: any) {
        console.error('YouTube API Error:', apiError)
        // Use cached data without showing error to user
        if (channel) {
          console.info('Falling back to cached channel data from:', channel.last_updated)
          setChannelData(channel)
          setIsConnected(true)
        }
      }
    } catch (err) {
      console.error("Error fetching channel:", err)
      setError("Unable to load channel data")
      setChannelData(null)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Single effect to handle both initial load and URL params
  useEffect(() => {
    if (!user) return

    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') {
      window.history.replaceState({}, '', '/dashboard')
    }
    
    fetchChannel()
  }, [user, fetchChannel])

  const refreshChannel = useCallback(async () => {
    if (!user || isLoading) return
    await fetchChannel()
  }, [user, isLoading, fetchChannel])

  return (
    <YouTubeChannelContext.Provider
      value={{
        isLoading,
        isConnected,
        channelData,
        error,
        refreshChannel,
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
