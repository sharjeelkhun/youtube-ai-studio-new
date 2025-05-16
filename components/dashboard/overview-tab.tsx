"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, Users, Video, Eye, ThumbsUp, MessageSquare, Loader2 } from "lucide-react"
import { db, type Video as VideoType, type AnalyticsData } from "@/lib/db"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"

// Format numbers with commas
const formatNumber = (num: number | string | null | undefined) => {
  if (num === null || num === undefined) return "0"
  return Number(num).toLocaleString()
}

export function OverviewTab({ channelData, isLoading }) {
  const [videos, setVideos] = useState<VideoType[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const { channel } = useYouTubeChannel()

  useEffect(() => {
    async function fetchData() {
      setIsLoadingData(true)
      try {
        if (channelData?.id) {
          // Fetch videos and analytics in parallel
          const [videosData, analyticsData] = await Promise.all([
            db.videos.getByChannelId(channelData.id),
            db.analytics.getByChannelId(channelData.id, 30),
          ])

          setVideos(videosData)
          setAnalytics(analyticsData)
        }
      } catch (error) {
        console.error("Error fetching overview data:", error)
      } finally {
        setIsLoadingData(false)
      }
    }

    if (channelData) {
      fetchData()
    }
  }, [channelData])

  // Calculate stats
  const totalViews = videos.reduce((sum, video) => sum + Number(video.views || 0), 0)
  const totalLikes = videos.reduce((sum, video) => sum + Number(video.likes || 0), 0)
  const totalComments = videos.reduce((sum, video) => sum + Number(video.comments || 0), 0)

  // Calculate growth percentages (mock data for now)
  const viewsGrowth = "+12.5%"
  const subscribersGrowth = "+2.5%"
  const videosGrowth = "+3"
  const watchTimeGrowth = "+7.2%"
  const likesGrowth = "+18.2%"
  const commentsGrowth = "+5.3%"

  if (isLoading || isLoadingData) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading channel data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(channelData?.subscribers)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">{subscribersGrowth}</span> from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
          <Video className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(videos.length)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">{videosGrowth}</span> new this month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalViews)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">{viewsGrowth}</span> from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Watch Time (hours)</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(analytics.reduce((sum, item) => sum + Number(item.watch_time || 0), 0))}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">{watchTimeGrowth}</span> from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalLikes)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">{likesGrowth}</span> from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalComments)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">{commentsGrowth}</span> from last month
          </p>
        </CardContent>
      </Card>
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Channel Information</CardTitle>
          <CardDescription>Details about your YouTube channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Channel Name</h3>
                <p className="text-sm">{channelData?.title || "Not available"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Channel ID</h3>
                <p className="text-sm">{channelData?.id || "Not available"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="text-sm line-clamp-3">{channelData?.description || "No description available"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                <p className="text-sm">
                  {channelData?.last_updated
                    ? new Date(channelData.last_updated).toLocaleDateString()
                    : "Not available"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
