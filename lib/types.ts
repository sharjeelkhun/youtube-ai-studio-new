// Define types for our application data
export interface Video {
  id: string
  thumbnail: string
  title: string
  status: "Published" | "Draft" | "Scheduled"
  views: number
  likes: number
  comments: number
  publishedAt: string
  description?: string
  tags?: string[]
  url?: string
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
    views: string
    engagement: string
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
