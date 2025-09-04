"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, Users, Video, Eye, ThumbsUp, MessageSquare, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { YouTubeChannel } from "@/lib/db"

interface OverviewTabProps {
  channelData: YouTubeChannel | null
  isLoading: boolean
}

export function OverviewTab({ channelData, isLoading }: OverviewTabProps) {
  const [stats, setStats] = useState({
    subscribers: { current: 0, growth: 0 },
    videos: { current: 0, growth: 0 },
    views: { current: 0, growth: 0 },
    watchTime: { current: 0, growth: 0 },
    likes: { current: 0, growth: 0 },
    comments: { current: 0, growth: 0 }
  })

  useEffect(() => {
    if (channelData) {
      setStats({
    subscribers: {
          current: channelData.subscriber_count || 0,
          growth: calculateGrowth(channelData.subscriber_count, channelData.previous_subscribers)
    },
    videos: {
          current: channelData.video_count || 0,
          growth: 0 // This would need to be calculated from historical data
    },
    views: {
          current: channelData.view_count || 0,
          growth: 0 // This would need to be calculated from historical data
    },
    watchTime: {
          current: channelData.watch_time || 0,
          growth: calculateGrowth(channelData.watch_time, channelData.previous_watch_time)
    },
    likes: {
          current: channelData.likes || 0,
          growth: calculateGrowth(channelData.likes, channelData.previous_likes)
    },
    comments: {
          current: channelData.comments || 0,
          growth: calculateGrowth(channelData.comments, channelData.previous_comments)
        }
      })
    }
  }, [channelData])

  const calculateGrowth = (current: number | undefined, previous: number | undefined) => {
    if (!current || !previous || previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatGrowth = (growth: number) => {
    return growth >= 0 ? `+${growth.toFixed(1)}` : growth.toFixed(1)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </CardContent>
          </Card>
        ))}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </div>
                <div>
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </div>
                <div>
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </div>
                <div>
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <div className="text-2xl font-bold">{formatNumber(stats.subscribers.current)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">+{stats.subscribers.growth.toFixed(1)}%</span> from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
          <Video className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.videos.current)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">+{stats.videos.growth}</span> new this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.views.current)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500">+{stats.views.growth.toFixed(1)}%</span> from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Watch Time (hours)</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.watchTime.current)}</div>
          <p className="text-xs text-muted-foreground">
            <span className={stats.watchTime.growth >= 0 ? "text-green-500" : "text-red-500"}>
              {formatGrowth(stats.watchTime.growth)}%
            </span> from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.likes.current)}</div>
          <p className="text-xs text-muted-foreground">
            <span className={stats.likes.growth >= 0 ? "text-green-500" : "text-red-500"}>
              {formatGrowth(stats.likes.growth)}%
            </span> from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.comments.current)}</div>
          <p className="text-xs text-muted-foreground">
            <span className={stats.comments.growth >= 0 ? "text-green-500" : "text-red-500"}>
              {formatGrowth(stats.comments.growth)}%
            </span> from last month
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
                  {(() => {
                    const ts = channelData?.last_synced || channelData?.updated_at
                    if (!ts) return 'Not available'
                    try { return new Date(ts).toLocaleString() } catch { return 'Not available' }
                  })()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
