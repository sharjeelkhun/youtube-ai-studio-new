"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./overview-tab"
import { VideosTab } from "./videos-tab"
import { AnalyticsTab } from "./analytics-tab"
import { CommentsTab } from "./comments-tab"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { YouTubeConnectionStatus } from "@/components/youtube-connection-status"

export function DashboardContent() {
  const { hasConnectedChannel, isLoading } = useYouTubeChannel()

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  if (!hasConnectedChannel) {
    return (
      <div className="mx-auto max-w-md p-4">
        <YouTubeConnectionStatus />
      </div>
    )
  }

  return (
    <div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="videos" className="space-y-4">
          <VideosTab />
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="comments" className="space-y-4">
          <CommentsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
