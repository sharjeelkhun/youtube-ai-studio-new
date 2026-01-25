// Define types for our application data
export interface Video {
  id: string
  thumbnail_url: string
  title: string
  status: "Published" | "Draft" | "Scheduled" | "Private" | "Unlisted"
  view_count: number
  like_count: number
  comment_count: number
  published_at: string
  description?: string
  tags?: string[]
  url?: string
  duration?: string
}

export interface AnalyticsData {
  date: string
  views: number
  watchTime?: number
  engagement?: number
  subscribers?: number
}

export interface SeoScore {
  id: string
  title: string
  score: number
  status: "good" | "average" | "poor"
  details: {
    title: "Good" | "Average" | "Poor"
    tags: "Good" | "Average" | "Poor"
    description: "Good" | "Average" | "Poor"
    thumbnail: "Good" | "Average" | "Poor"
  }
}

export interface ContentSuggestion {
  id: string
  title: string
  type: string
  description: string
  metrics: {
    estimatedViews: string
    engagement: string
  }
  metadata?: {
    tags: string[]
  }
}


export interface TrendingTopic {
  id: string
  title: string
  growth: string
  description: string
}

export interface VideoImprovement {
  videoId: string
  videoTitle: string
  suggestions: string[]
}

export interface AiSettingsResponse {
  provider: string | null
  settings: {
    apiKeys: {
      openai: string
      gemini: string
      anthropic: string
      mistral: string
    }
    features: {
      enhanceVideoTitles: boolean
      generateThumbnailIdeas: boolean
      improveDescriptions: boolean
      suggestTags: boolean
      contentIdeas: boolean
      defaultModel: string
      temperature: string
    }
  } | null
}
