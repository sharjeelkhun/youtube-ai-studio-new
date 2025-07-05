import { supabase } from "./supabase"
import type { Database } from "./database.types"
import { toast } from '@/components/ui/use-toast'

// Type for YouTube channel
export type YouTubeChannel = Database["public"]["Tables"]["youtube_channels"]["Row"] & {
  views?: number
  watch_time?: number
  previous_subscribers?: number
  previous_watch_time?: number
  likes?: number
  previous_likes?: number
  comments?: number
  previous_comments?: number
}
export type Video = Database["public"]["Tables"]["videos"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type AnalyticsData = Database["public"]["Tables"]["analytics_data"]["Row"]

// Check if we're in a preview environment
export const isPreviewEnvironment = () => {
  return (
    process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true' || 
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Mock data for preview mode
export const mockData = {
  channel: {
    id: "UC123456789",
    user_id: "preview-user-id",
    title: "Demo YouTube Channel",
    description: "This is a demo YouTube channel for preview mode",
    subscriber_count: 10500,
    video_count: 42,
    thumbnail: "/placeholder.svg?height=80&width=80",
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    token_expires_at: new Date(Date.now() + 3600000).toISOString(),
    last_synced: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    view_count: 250000,
    watch_time: 15000,
    previous_subscribers: 9800,
    previous_watch_time: 14200,
    likes: 8500,
    previous_likes: 7800,
    comments: 1200,
    previous_comments: 1050,
  } as YouTubeChannel,

  videos: [
    {
      id: "video1",
      channel_id: "UC123456789",
      title: "How to Get Started with YouTube",
      description: "A beginner's guide to starting your YouTube journey",
      thumbnail_url: "/placeholder.svg?height=180&width=320",
      status: "Published",
      view_count: 12500,
      like_count: 870,
      comment_count: 120,
      published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      duration: "0:00"
    },
    {
      id: "video2",
      channel_id: "UC123456789",
      title: "10 Tips for Growing Your Channel",
      description: "Learn how to grow your YouTube channel faster",
      thumbnail_url: "/placeholder.svg?height=180&width=320",
      status: "Published",
      view_count: 8700,
      like_count: 650,
      comment_count: 85,
      published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      duration: "0:00"
    },
    {
      id: "video3",
      channel_id: "UC123456789",
      title: "Content Creation Masterclass",
      description: "Advanced techniques for content creators",
      thumbnail_url: "/placeholder.svg?height=180&width=320",
      status: "Published",
      view_count: 15200,
      like_count: 1250,
      comment_count: 210,
      published_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      duration: "0:00"
    },
    {
      id: "video4",
      channel_id: "UC123456789",
      title: "YouTube Algorithm Explained",
      description: "Understanding how the YouTube algorithm works",
      thumbnail_url: "/placeholder.svg?height=180&width=320",
      status: "Published",
      view_count: 22800,
      like_count: 1870,
      comment_count: 315,
      published_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      duration: "0:00"
    },
    {
      id: "video5",
      channel_id: "UC123456789",
      title: "How to Edit Videos Like a Pro",
      description: "Professional video editing techniques",
      thumbnail_url: "/placeholder.svg?height=180&width=320",
      status: "Draft",
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      published_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      duration: "0:00"
    },
  ] as Video[],

  analytics: Array.from({ length: 30 }).map((_, i) => ({
    id: i + 1,
    channel_id: "UC123456789",
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    views: Math.floor(1000 + Math.random() * 5000),
    watch_time: Math.floor(500 + Math.random() * 2000),
    engagement: Math.floor(10 + Math.random() * 30),
    subscribers: Math.floor(5 + Math.random() * 50),
    created_at: new Date().toISOString(),
  })) as AnalyticsData[],

  comments: Array.from({ length: 20 }).map((_, i) => ({
    id: `comment${i + 1}`,
    video_id: `video${(i % 5) + 1}`,
    author: `User ${i + 1}`,
    content: `This is comment ${i + 1}. Great video, I learned a lot!`,
    likes: Math.floor(Math.random() * 50),
    timestamp: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
    responded: i % 3 === 0,
  })),
}

// Database operations
export const db = {
  // Channel operations
  channels: {
    async getByUserId(userId: string): Promise<YouTubeChannel | null> {
      try {
        if (isPreviewEnvironment()) {
          return mockData.channel
        }

        const { data, error } = await supabase
          .from("youtube_channels")
          .select(`
            *,
            videos:videos(count),
            analytics:analytics_data(
              views,
              subscribers,
              engagement,
              watch_time
            )
          `)
          .eq("user_id", userId)
          .order('created_at', { ascending: false })
          .maybeSingle() // Use maybeSingle instead of single

        if (error) throw error
        return data
      } catch (error: any) {
        console.error("Error fetching channel:", error)
        return null
      }
    },

    async create(channel: Omit<YouTubeChannel, "id" | "created_at">): Promise<YouTubeChannel | null> {
      if (isPreviewEnvironment()) {
        return mockData.channel
      }

      const { data, error } = await supabase
        .from("youtube_channels")
        .insert([{ ...channel, created_at: new Date().toISOString() }])
        .select()
        .single()

      if (error) {
        console.error("Error creating channel:", error)
        return null
      }

      return data
    },

    async update(id: string, updates: Partial<YouTubeChannel>): Promise<YouTubeChannel | null> {
      if (isPreviewEnvironment()) {
        return { ...mockData.channel, ...updates }
      }

      const { data, error } = await supabase
        .from("youtube_channels")
        .update({ ...updates, last_updated: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating channel:", error)
        return null
      }

      return data
    },
  },

  // Video operations
  videos: {
    async getByChannelId(channelId: string): Promise<Video[]> {
      if (isPreviewEnvironment()) {
        return mockData.videos
      }

      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("channel_id", channelId)
        .order("published_at", { ascending: false })

      if (error) {
        console.error("Error fetching videos:", error)
        return []
      }

      return data || []
    },

    async getById(id: string): Promise<Video | null> {
      if (isPreviewEnvironment()) {
        return mockData.videos.find((v) => v.id === id) || null
      }

      const { data, error } = await supabase.from("videos").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching video:", error)
        return null
      }

      return data
    },

    async create(video: Omit<Video, "created_at" | "updated_at">): Promise<Video | null> {
      if (isPreviewEnvironment()) {
        return { ...video, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Video
      }

      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("videos")
        .insert([{ ...video, created_at: now, updated_at: now }])
        .select()
        .single()

      if (error) {
        console.error("Error creating video:", error)
        return null
      }

      return data
    },

    async update(id: string, updates: Partial<Video>): Promise<Video | null> {
      if (isPreviewEnvironment()) {
        const videoIndex = mockData.videos.findIndex((v) => v.id === id)
        if (videoIndex >= 0) {
          mockData.videos[videoIndex] = {
            ...mockData.videos[videoIndex],
            ...updates,
            updated_at: new Date().toISOString(),
          }
          return mockData.videos[videoIndex]
        }
        return null
      }

      const { data, error } = await supabase
        .from("videos")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating video:", error)
        return null
      }

      return data
    },

    async delete(id: string): Promise<boolean> {
      if (isPreviewEnvironment()) {
        const videoIndex = mockData.videos.findIndex((v) => v.id === id)
        if (videoIndex >= 0) {
          mockData.videos.splice(videoIndex, 1)
          return true
        }
        return false
      }

      const { error } = await supabase.from("videos").delete().eq("id", id)

      if (error) {
        console.error("Error deleting video:", error)
        return false
      }

      return true
    },
  },

  // Analytics operations
  analytics: {
    async getByChannelId(channelId: string, days = 30): Promise<AnalyticsData[]> {
      if (isPreviewEnvironment()) {
        return mockData.analytics.slice(0, days)
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from("analytics_data")
        .select("*")
        .eq("channel_id", channelId)
        .gte("date", startDate.toISOString())
        .order("date", { ascending: false })

      if (error) {
        console.error("Error fetching analytics:", error)
        return []
      }

      return data || []
    },
  },

  // Comments operations
  comments: {
    async getByVideoId(videoId: string): Promise<any[]> {
      if (isPreviewEnvironment()) {
        return mockData.comments.filter((c) => c.video_id === videoId)
      }

      // In a real app, you would have a comments table
      // This is a placeholder for the actual implementation
      return []
    },

    async getRecentComments(channelId: string, limit = 10): Promise<any[]> {
      if (isPreviewEnvironment()) {
        return mockData.comments.slice(0, limit)
      }

      // In a real app, you would join videos and comments tables
      // This is a placeholder for the actual implementation
      return []
    },
  },

  // Profile operations
  profiles: {
    async getByUserId(userId: string): Promise<Profile | null> {
      if (isPreviewEnvironment()) {
        return {
          id: userId,
          full_name: "Demo User",
          avatar_url: "/placeholder.svg?height=40&width=40",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Profile
      }

      const { data, error } = await supabase
        .from('profiles')
        .select()
        .match({ id: userId })
        .maybeSingle()

      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }

      return data
    },

    async upsert(profile: Omit<Profile, "created_at" | "updated_at">): Promise<Profile | null> {
      if (isPreviewEnvironment()) {
        return {
          ...profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Profile
      }

      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("profiles")
        .upsert([{ ...profile, updated_at: now }], { onConflict: "id" })
        .select()
        .single()

      if (error) {
        console.error("Error upserting profile:", error)
        return null
      }

      return data
    },
  },
}

export async function getYouTubeChannels(userId: string) {
  try {
    const { data, error } = await supabase
      .from('youtube_channels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .throwOnError()

    if (error) throw error

    return {
      data: data || [],
      error: null
    }
  } catch (error: any) {
    console.error('Error fetching channels:', error)
    return {
      data: [],
      error: error.message
    }
  }
}
