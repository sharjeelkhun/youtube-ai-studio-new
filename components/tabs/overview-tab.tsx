"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, BarChart3, Eye, ThumbsUp, Users, MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { TopVideosChart } from "@/components/charts/top-videos-chart"
import { RecentVideos } from "@/components/recent-videos"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import { Loader2 } from "lucide-react"

interface ChannelStats {
  total_views: number
  total_likes: number
  total_comments: number
  total_subscribers: number
  total_videos: number
  watch_time: number
  views_change: number
  likes_change: number
  comments_change: number
  subscribers_change: number
  watch_time_change: number
}

export function OverviewTab() {
  const { channelData, isLoading: isChannelLoading } = useYouTubeChannel()
  const [stats, setStats] = useState<ChannelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchStats = async () => {
      if (!channelData?.id) {
        console.log('No channel data available yet')
        return
      }

      console.log('Fetching stats for channel:', channelData.id)
      try {
        setLoading(true)
        setError(null)

        // First, check if we have any videos
        const { count, error: countError } = await supabase
          .from('youtube_videos')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', channelData.id)

        if (countError) {
          console.error('Error checking video count:', countError)
          throw countError
        }

        console.log('Found video count:', count)

        if (count === 0) {
          // If no videos, use channel data for basic stats
          const { data: channelStats, error: channelError } = await supabase
            .from('youtube_channels')
            .select('subscriber_count, video_count')
            .eq('id', channelData.id)
            .single()

          if (channelError) {
            console.error('Error fetching channel stats:', channelError)
            throw channelError
          }

          console.log('Channel stats (no videos):', channelStats)

          const newStats = {
            total_views: 0,
            total_likes: 0,
            total_comments: 0,
            total_subscribers: channelStats.subscriber_count || 0,
            total_videos: channelStats.video_count || 0,
            watch_time: 0,
            views_change: 0,
            likes_change: 0,
            comments_change: 0,
            subscribers_change: 0,
            watch_time_change: 0
          }

          console.log('Setting new stats (no videos):', newStats)
          setStats(newStats)
          return
        }

        // Get total views, likes, and comments from videos
        const { data: videoStats, error: videoError } = await supabase
          .from('youtube_videos')
          .select('view_count, like_count, comment_count')
          .eq('channel_id', channelData.id)

        if (videoError) {
          console.error('Error fetching video stats:', videoError)
          throw videoError
        }

        console.log('Video stats:', videoStats)

        // Calculate totals
        const totals = videoStats.reduce((acc, video) => ({
          total_views: acc.total_views + (video.view_count || 0),
          total_likes: acc.total_likes + (video.like_count || 0),
          total_comments: acc.total_comments + (video.comment_count || 0)
        }), { total_views: 0, total_likes: 0, total_comments: 0 })

        console.log('Calculated totals:', totals)

        // Get channel stats
        const { data: channelStats, error: channelError } = await supabase
          .from('youtube_channels')
          .select('subscriber_count, video_count')
          .eq('id', channelData.id)
          .single()

        if (channelError) {
          console.error('Error fetching channel stats:', channelError)
          throw channelError
        }

        console.log('Channel stats:', channelStats)

        // Calculate changes (mock data for now)
        const changes = {
          views_change: 5.2,
          likes_change: 3.8,
          comments_change: 2.1,
          subscribers_change: 1.5,
          watch_time_change: 4.2
        }

        const newStats = {
          ...totals,
          total_subscribers: channelStats.subscriber_count || 0,
          total_videos: channelStats.video_count || 0,
          watch_time: Math.floor(totals.total_views * 0.1), // Mock watch time calculation
          ...changes
        }

        console.log('Setting new stats:', newStats)
        setStats(newStats)
      } catch (error) {
        console.error('Error in fetchStats:', error)
        setError(error instanceof Error ? error.message : 'An error occurred while fetching stats')
      } finally {
        setLoading(false)
      }
    }

    if (!isChannelLoading) {
      fetchStats()
    }
  }, [channelData?.id, supabase, isChannelLoading])

  // Use channel name in the description if available
  const channelName = channelData?.title || "your channel"

  if (isChannelLoading || loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!channelData) {
    return <div>No channel data available</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (!stats) {
    return <div>No stats available</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Views"
        value={stats.total_views.toLocaleString()}
        description={`This month for ${channelName}`}
        trend={stats.views_change}
        icon={Eye}
      />
      <StatsCard
        title="Watch Time"
        value={`${Math.floor(stats.watch_time / 60)} hrs`}
        description={`This month for ${channelName}`}
        trend={stats.watch_time_change}
        icon={BarChart3}
      />
      <StatsCard
        title="Subscribers"
        value={stats.total_subscribers.toLocaleString()}
        description="Total"
        trend={stats.subscribers_change}
        icon={Users}
      />
      <StatsCard
        title="Engagement"
        value={`${Math.round((stats.total_likes / (stats.total_views || 1)) * 100)}%`}
        description="Avg. this month"
        trend={stats.likes_change}
        icon={ThumbsUp}
      />

      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Views and engagement over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <PerformanceChart />
        </CardContent>
      </Card>

      <Card className="col-span-full md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Performing Videos</CardTitle>
            <CardDescription>Based on views in the last 30 days</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <TopVideosChart />
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Videos</CardTitle>
            <CardDescription>Latest uploads from {channelName}</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <RecentVideos />
        </CardContent>
      </Card>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: string
  description: string
  trend: number
  icon: React.ElementType
}

function StatsCard({ title, value, description, trend, icon: Icon }: StatsCardProps) {
  const isPositive = trend > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center pt-1">
          <span className="text-xs text-muted-foreground">{description}</span>
          <span className={`ml-auto flex items-center text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
