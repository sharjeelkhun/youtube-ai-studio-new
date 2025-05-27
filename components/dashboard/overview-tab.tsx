"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, Users, Video, Eye, ThumbsUp, MessageSquare, Loader2 } from "lucide-react"
import type { YouTubeChannel } from "@/lib/db"

interface OverviewTabProps {
  channelData: YouTubeChannel | null
  isLoading: boolean
}

// Helper function to format numbers
function formatNumber(num: number | null | undefined): string {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

function calculateGrowth(current: number, previous: number): number {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

export function OverviewTab({ channelData, isLoading }: OverviewTabProps) {
  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading channel data...</p>
        </div>
      </div>
    )
  }

  const stats = {
    subscribers: {
      current: channelData?.subscribers || 0,
      previous: channelData?.previous_subscribers || 0,
      get growth() {
        return calculateGrowth(this.current, this.previous)
      }
    },
    videos: {
      current: channelData?.videos || 0,
      growth: 0
    },
    views: {
      current: channelData?.views || 0,
      previous: 0, // No previous views data available
      get growth() {
        return 0 // Growth calculation disabled for views
      }
    },
    watchTime: {
      current: channelData?.watch_time || 0,
      previous: channelData?.previous_watch_time || 0,
      get growth() {
        return calculateGrowth(this.current, this.previous)
      }
    },
    likes: {
      current: channelData?.likes || 0,
      previous: channelData?.previous_likes || 0,
      get growth() {
        return calculateGrowth(this.current, this.previous)
      }
    },
    comments: {
      current: channelData?.comments || 0,
      previous: channelData?.previous_comments || 0,
      get growth() {
        return calculateGrowth(this.current, this.previous)
      }
    }
  }

  const formatGrowth = (value: number) => {
    const formatted = Math.abs(value).toFixed(1)
    const sign = value >= 0 ? '+' : '-'
    return `${sign}${formatted}`
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
            <span className="text-green-500">+{stats.subscribers.growth}%</span> from last month
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
            <span className="text-green-500">+{stats.views.growth}%</span> from last month
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
