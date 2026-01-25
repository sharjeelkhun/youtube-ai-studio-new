import type { Video, AnalyticsData, SeoScore, ContentSuggestion, TrendingTopic, VideoImprovement } from "@/lib/types"

// Add imports for YouTube API utilities
import { fetchFromYouTubeAPI } from "@/lib/youtube-api"

// Mock data for videos
const mockVideos: Video[] = [
  {
    id: "1",
    thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    title: "How to Use AI for Content Creation in 2025",
    status: "Published",
    view_count: 12500,
    like_count: 1250,
    comment_count: 320,
    published_at: "2 days ago",
    description: "Learn how to leverage AI tools to create better content faster.",
    tags: ["AI", "Content Creation", "YouTube", "Tutorial"],
  },
  {
    id: "2",
    thumbnail_url: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    title: "10 Tips for Better YouTube SEO",
    status: "Published",
    view_count: 8300,
    like_count: 940,
    comment_count: 215,
    published_at: "1 week ago",
    description: "Improve your YouTube search rankings with these proven SEO tips.",
    tags: ["SEO", "YouTube", "Growth", "Tips"],
  },
  {
    id: "3",
    thumbnail_url: "https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg",
    title: "The Ultimate Guide to Video Editing",
    status: "Draft",
    view_count: 0,
    like_count: 0,
    comment_count: 0,
    published_at: "N/A",
    description: "Master video editing with this comprehensive guide for beginners and pros.",
    tags: ["Video Editing", "Tutorial", "Beginner"],
  },
  {
    id: "4",
    thumbnail_url: "https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg",
    title: "Why You Should Start a YouTube Channel in 2025",
    status: "Published",
    view_count: 5200,
    like_count: 620,
    comment_count: 145,
    published_at: "2 weeks ago",
    description: "The benefits of starting a YouTube channel in 2025 and how to get started.",
    tags: ["YouTube", "Growth", "Beginner"],
  },
  {
    id: "5",
    thumbnail_url: "https://i.ytimg.com/vi/tVj0ZTS4WF4/hqdefault.jpg",
    title: "Advanced Lighting Techniques for YouTube",
    status: "Scheduled",
    view_count: 0,
    like_count: 0,
    comment_count: 0,
    published_at: "Tomorrow",
    description: "Professional lighting setups for YouTube creators on any budget.",
    tags: ["Lighting", "Production", "YouTube", "Advanced"],
  },
  {
    id: "6",
    thumbnail_url: "https://i.ytimg.com/vi/ZZ5LpwO-An4/hqdefault.jpg",
    title: "How I Gained 10K Subscribers in 30 Days",
    status: "Published",
    view_count: 15800,
    like_count: 2100,
    comment_count: 450,
    published_at: "3 weeks ago",
    description: "My strategy for rapid subscriber growth and how you can replicate it.",
    tags: ["Growth", "Subscribers", "Strategy", "YouTube"],
  },
]

// Mock analytics data
const mockAnalyticsData: AnalyticsData[] = [
  { date: "Jan 1", views: 4000, watchTime: 2400, engagement: 24, subscribers: 240 },
  { date: "Jan 5", views: 3000, watchTime: 1398, engagement: 22, subscribers: 210 },
  { date: "Jan 10", views: 5000, watchTime: 3800, engagement: 26, subscribers: 250 },
  { date: "Jan 15", views: 8000, watchTime: 4300, engagement: 28, subscribers: 280 },
  { date: "Jan 20", views: 12000, watchTime: 6800, engagement: 32, subscribers: 320 },
  { date: "Jan 25", views: 10000, watchTime: 5800, engagement: 30, subscribers: 300 },
  { date: "Jan 30", views: 14000, watchTime: 7800, engagement: 34, subscribers: 340 },
  { date: "Feb 5", views: 18000, watchTime: 9800, engagement: 36, subscribers: 380 },
  { date: "Feb 10", views: 16000, watchTime: 8800, engagement: 32, subscribers: 320 },
  { date: "Feb 15", views: 20000, watchTime: 11800, engagement: 38, subscribers: 400 },
]

// Mock SEO scores
const mockSeoScores: SeoScore[] = [
  {
    id: "1",
    title: "How to Use AI for Content Creation in 2025",
    score: 85,
    status: "good",
    details: {
      title: "Good",
      tags: "Good",
      description: "Good",
      thumbnail: "Average",
    },
  },
  {
    id: "2",
    title: "10 Tips for Better YouTube SEO",
    score: 92,
    status: "good",
    details: {
      title: "Good",
      tags: "Good",
      description: "Good",
      thumbnail: "Good",
    },
  },
  {
    id: "3",
    title: "The Ultimate Guide to Video Editing",
    score: 68,
    status: "average",
    details: {
      title: "Average",
      tags: "Average",
      description: "Poor",
      thumbnail: "Average",
    },
  },
  {
    id: "4",
    title: "Why You Should Start a YouTube Channel in 2025",
    score: 78,
    status: "good",
    details: {
      title: "Good",
      tags: "Average",
      description: "Good",
      thumbnail: "Average",
    },
  },
  {
    id: "5",
    title: "Advanced Lighting Techniques for YouTube",
    score: 45,
    status: "poor",
    details: {
      title: "Poor",
      tags: "Poor",
      description: "Average",
      thumbnail: "Poor",
    },
  },
  {
    id: "6",
    title: "How I Gained 10K Subscribers in 30 Days",
    score: 88,
    status: "good",
    details: {
      title: "Good",
      tags: "Good",
      description: "Good",
      thumbnail: "Average",
    },
  },
]

// Mock content suggestions
const mockContentSuggestions: ContentSuggestion[] = [
  {
    id: "1",
    title: "10 AI Tools Every Content Creator Needs in 2025",
    type: "Video Idea",
    description:
      "A comprehensive guide to the latest AI tools that can help content creators streamline their workflow and enhance their content quality.",
    metrics: { estimatedViews: "15K-25K", engagement: "High" },
  },
  {
    id: "2",
    title: "How to Use ChatGPT to Write Better YouTube Scripts",
    type: "Tutorial Idea",
    description:
      "A step-by-step tutorial showing how to leverage ChatGPT to create more engaging and well-structured YouTube scripts.",
    metrics: { estimatedViews: "10K-20K", engagement: "Medium" },
  },
  {
    id: "3",
    title: "The Future of AI in Content Creation: 2025 Predictions",
    type: "Trend Analysis",
    description:
      "An analysis of upcoming AI trends that will shape content creation in 2025, with insights from industry experts.",
    metrics: { estimatedViews: "20K-30K", engagement: "High" },
  },
]

// Mock trending topics
const mockTrendingTopics: TrendingTopic[] = [
  {
    id: "1",
    title: "AI Video Generation Tools",
    growth: "+125%",
    description: "New tools that allow creators to generate video content using AI are seeing massive interest.",
  },
  {
    id: "2",
    title: "AI Ethics in Content Creation",
    growth: "+82%",
    description: "Discussions around ethical use of AI in content creation are trending upward.",
  },
  {
    id: "3",
    title: "YouTube Algorithm Changes",
    growth: "+64%",
    description: "Recent changes to the YouTube algorithm and how creators can adapt.",
  },
]

// Mock video improvements
const mockVideoImprovements: VideoImprovement[] = [
  {
    videoId: "1",
    videoTitle: "How to Use AI for Content Creation in 2025",
    suggestions: [
      "Add timestamps to improve viewer retention and searchability.",
      "Update your description with more relevant keywords.",
    ],
  },
  {
    videoId: "2",
    videoTitle: "10 Tips for Better YouTube SEO",
    suggestions: [
      "Your thumbnail has low click-through rate. Try a more contrasting color scheme.",
      "Add more specific call-to-action to increase engagement.",
    ],
  },
  {
    videoId: "3",
    videoTitle: "The Ultimate Guide to Video Editing",
    suggestions: [
      "The first 15 seconds have high drop-off. Consider a more engaging hook.",
      "Your video length is optimal, but consider breaking complex sections into chapters.",
    ],
  },
]

// API functions with simulated delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Videos API
// Update the getVideos function to fetch real data
export async function getVideos(search?: string, filter?: string): Promise<Video[]> {
  console.log("getVideos called with search:", search, "filter:", filter)
  // Force mock data for demo purposes
  const result = await getMockVideos(search, filter)
  console.log("getVideos returning:", result)
  return result

  // Original YouTube API logic (commented out for demo)
  /*
  try {
    // Check if we have a YouTube connection
    const token = sessionStorage.getItem("youtube_access_token")
    if (!token) {
      // Fall back to mock data if no connection
      return getMockVideos(search, filter)
    }

    // Build the query parameters
    const query = "videos?part=snippet,statistics,status&mine=true&maxResults=50"

    // Fetch videos from YouTube API
    const data = await fetchFromYouTubeAPI(query, token)

    // Map the response to our Video type
    let videos = data.items.map((item: any) => ({
      id: item.id,
      thumbnail_url: item.snippet.thumbnails.medium.url,
      title: item.snippet.title,
      status:
        item.status.privacyStatus === "public"
          ? "Published"
          : item.status.privacyStatus === "private"
            ? "Draft"
            : "Scheduled",
      view_count: Number.parseInt(item.statistics.viewCount, 10),
      like_count: Number.parseInt(item.statistics.likeCount, 10),
      comment_count: Number.parseInt(item.statistics.commentCount, 10),
      published_at: new Date(item.snippet.publishedAt).toLocaleDateString(),
      description: item.snippet.description,
      tags: item.snippet.tags || [],
    }))

    // Apply search filter if provided
    if (search) {
      videos = videos.filter((video: Video) => video.title.toLowerCase().includes(search.toLowerCase()))
    }

    // Apply status filter if provided
    if (filter && filter !== "all") {
      videos = videos.filter((video: Video) => video.status.toLowerCase() === filter.toLowerCase())
    }

    return videos
  } catch (error) {
    console.error("Error fetching videos from YouTube:", error)
    // Fall back to mock data on error
    return getMockVideos(search, filter)
  }
  */
}

// Helper function to get mock videos (for fallback)
function getMockVideos(search?: string, filter?: string): Promise<Video[]> {
  // Use the existing mock data logic
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredVideos = [...mockVideos]

      console.log("Mock videos being returned:", filteredVideos)

      if (search) {
        filteredVideos = filteredVideos.filter((video) => video.title.toLowerCase().includes(search.toLowerCase()))
      }

      if (filter && filter !== "all") {
        filteredVideos = filteredVideos.filter((video) => video.status.toLowerCase() === filter.toLowerCase())
      }

      resolve(filteredVideos)
    }, 800)
  })
}

export async function getVideo(id: string): Promise<Video | null> {
  try {
    // Check if we have a YouTube connection
    const token = sessionStorage.getItem("youtube_access_token")
    if (!token) {
      // Fall back to mock data if no connection
      return mockVideos.find((video) => video.id === id) || null
    }

    // Build the query parameters
    const query = `videos?part=snippet,statistics,status&id=${id}`

    // Fetch video from YouTube API
    const data = await fetchFromYouTubeAPI(query, token)

    if (!data.items || data.items.length === 0) {
      return null
    }

    const item = data.items[0]
    return {
      id: item.id,
      thumbnail_url: item.snippet.thumbnails.medium.url,
      title: item.snippet.title,
      status:
        item.status.privacyStatus === "public"
          ? "Published"
          : item.status.privacyStatus === "private"
            ? "Draft"
            : "Scheduled",
      view_count: Number.parseInt(item.statistics.viewCount, 10),
      like_count: Number.parseInt(item.statistics.likeCount, 10),
      comment_count: Number.parseInt(item.statistics.commentCount, 10),
      published_at: new Date(item.snippet.publishedAt).toLocaleDateString(),
      description: item.snippet.description,
      tags: item.snippet.tags || [],
    }
  } catch (error) {
    console.error("Error fetching video from YouTube:", error)
    // Fall back to mock data on error
    return mockVideos.find((video) => video.id === id) || null
  }
}

export async function createVideo(video: Omit<Video, "id">): Promise<Video> {
  await delay(1000)
  const newVideo = {
    ...video,
    id: Math.random().toString(36).substring(2, 9),
  }
  mockVideos.push(newVideo as Video)
  return newVideo as Video
}

export async function updateVideo(id: string, updates: Partial<Video>): Promise<Video | null> {
  await delay(1000)
  const index = mockVideos.findIndex((video) => video.id === id)
  if (index === -1) return null

  mockVideos[index] = { ...mockVideos[index], ...updates }
  return mockVideos[index]
}

export async function deleteVideo(id: string): Promise<boolean> {
  await delay(1000)
  const index = mockVideos.findIndex((video) => video.id === id)
  if (index === -1) return false

  mockVideos.splice(index, 1)
  return true
}

// Analytics API
export async function getAnalyticsData(period = "30d"): Promise<AnalyticsData[]> {
  await delay(1000)
  return mockAnalyticsData
}

// SEO API
export async function getSeoScores(): Promise<SeoScore[]> {
  await delay(800)
  return mockSeoScores
}

export async function analyzeSeo(url: string): Promise<SeoScore | null> {
  await delay(2000)
  return mockSeoScores[0] // Just return the first mock score for demo
}

// AI Suggestions API
export async function getContentSuggestions(): Promise<ContentSuggestion[]> {
  await delay(800)
  return mockContentSuggestions
}

export async function getTrendingTopics(): Promise<TrendingTopic[]> {
  await delay(800)
  return mockTrendingTopics
}

export async function getVideoImprovements(): Promise<VideoImprovement[]> {
  await delay(800)
  return mockVideoImprovements
}

export async function generateAiContent(prompt: string): Promise<string> {
  await delay(2000) // Longer delay to simulate AI processing
  return `Generated content based on: "${prompt}"\n\nThis is a simulated AI response that would contain content suggestions, title ideas, or other AI-generated content based on the user's prompt.`
}
