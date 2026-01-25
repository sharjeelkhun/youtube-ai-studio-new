"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, Users, Video, Eye, ThumbsUp, MessageSquare, Loader2, Wand2, FileText, Lightbulb, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { YouTubeChannel } from "@/lib/db"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface OverviewTabProps {
  channelData: YouTubeChannel | null
  isLoading: boolean
}

export function OverviewTab({ channelData, isLoading }: OverviewTabProps) {
  const router = useRouter()
  const [stats, setStats] = useState({
    subscribers: { current: 0, growth: 0 },
    videos: { current: 0, growth: 0 },
    views: { current: 0, growth: 0 },
    watchTime: { current: 0, growth: 0 },
    likes: { current: 0, growth: 0 },
    comments: { current: 0, growth: 0 }
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (channelData) {
      setStats({
        subscribers: {
          current: channelData.subscriber_count || 0,
          growth: calculateGrowth(channelData.subscriber_count, channelData.previous_subscribers)
        },
        videos: {
          current: channelData.video_count || 0,
          growth: 0
        },
        views: {
          current: channelData.view_count || 0,
          growth: 0
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
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num)
  }

  const formatGrowth = (growth: number) => {
    return growth >= 0 ? `+${growth.toFixed(1)}` : growth.toFixed(1)
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>

        {/* Channel Info Skeleton */}
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  const quickActions = [
    {
      title: "New Video Idea",
      description: "Brainstorm with AI",
      icon: Lightbulb,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      onClick: () => router.push('/dashboard?tab=ideas')
    },
    {
      title: "Optimize Video",
      description: "Improve existing content",
      icon: Wand2,
      color: "text-primary",
      bg: "bg-primary/10",
      onClick: () => router.push('/dashboard?tab=videos')
    },
    {
      title: "Channel Analysis",
      description: "Deep dive insights",
      icon: Sparkles,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      onClick: () => router.push('/dashboard?tab=analytics')
    }
  ]

  const statCards = [
    {
      title: "Total Subscribers",
      value: stats.subscribers.current,
      growth: stats.subscribers.growth,
      icon: Users,
      color: "text-red-500",
      bg: "bg-red-500/10",
      label: "from last month"
    },
    {
      title: "Total Views",
      value: stats.views.current,
      growth: stats.views.growth,
      icon: Eye,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      label: "from last month"
    },
    {
      title: "Watch Time (Hours)",
      value: stats.watchTime.current,
      growth: stats.watchTime.growth,
      icon: ArrowUpRight,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      label: "from last month"
    },
    {
      title: "Total Videos",
      value: stats.videos.current,
      growth: stats.videos.growth,
      icon: Video,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      label: "new this month"
    },
    {
      title: "Total Likes",
      value: stats.likes.current,
      growth: stats.likes.growth,
      icon: ThumbsUp,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      label: "from last month"
    },
    {
      title: "Total Comments",
      value: stats.comments.current,
      growth: stats.comments.growth,
      icon: MessageSquare,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      label: "from last month"
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Quick Actions Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/60 backdrop-blur-xl hover:bg-background/80 hover:shadow-lg hover:scale-[1.02] transition-all text-left group"
            >
              <div className={cn("h-12 w-12 rounded-full flex items-center justify-center transition-colors", action.bg)}>
                <action.icon className={cn("h-6 w-6", action.color)} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Stats Grid */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Channel Performance</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat, i) => (
            <Card key={i} className="overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl hover:shadow-xl transition-all group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.title}
                </CardTitle>
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{formatNumber(stat.value)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {stat.growth !== 0 && (
                    <span className={cn("flex items-center font-medium mr-1", stat.growth >= 0 ? "text-green-500" : "text-red-500")}>
                      {stat.growth >= 0 ? "+" : ""}{formatGrowth(stat.growth)}%
                    </span>
                  )}
                  <span>{stat.label}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Legacy Channel Info - kept generic but styled */}
      <Card className="border-border/50 bg-background/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Channel Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">ID</span>
              <p className="font-mono text-xs bg-muted/50 p-1 rounded w-fit">{channelData?.id || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Last Synced</span>
              <p>
                {(() => {
                  const ts = channelData?.last_synced || channelData?.updated_at
                  if (!ts) return 'Never'
                  if (!mounted) return 'Loading...'
                  try { return new Date(ts).toLocaleString() } catch { return 'Invalid Date' }
                })()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
