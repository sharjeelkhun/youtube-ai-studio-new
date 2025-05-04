"use client"

import type React from "react"

import { ArrowDown, ArrowUp, BarChart3, Eye, ThumbsUp, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { TopVideosChart } from "@/components/charts/top-videos-chart"
import { RecentVideos } from "@/components/recent-videos"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"

export function OverviewTab() {
  const { channelData } = useYouTubeChannel()

  // Use channel name in the description if available
  const channelName = channelData?.title || "your channel"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Views"
        value="2.4M"
        description={`This month for ${channelName}`}
        trend={12.5}
        icon={Eye}
      />
      <StatsCard
        title="Watch Time"
        value="142K hrs"
        description={`This month for ${channelName}`}
        trend={8.2}
        icon={BarChart3}
      />
      <StatsCard
        title="Subscribers"
        value={channelData ? channelData.subscribers.toLocaleString() : "48.5K"}
        description="Total"
        trend={-2.4}
        icon={Users}
      />
      <StatsCard title="Engagement" value="24.8%" description="Avg. this month" trend={5.1} icon={ThumbsUp} />

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
