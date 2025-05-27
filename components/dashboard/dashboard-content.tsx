"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./overview-tab"
import { VideosTab } from "./videos-tab"
import { AnalyticsTab } from "./analytics-tab"
import { CommentsTab } from "./comments-tab"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { EmptyChannelState } from "@/components/empty-channel-state"

export function DashboardContent() {
  const { isLoading, isConnected, channelData } = useYouTubeChannel()

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    }

    if (!isConnected || !channelData) {
      return <EmptyChannelState />
    }

    return (
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab channelData={channelData} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="videos">
          <VideosTab channelData={channelData} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab channelData={channelData} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="comments">
          <CommentsTab channelData={channelData} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    )
  }

  return <div className="w-full">{renderContent()}</div>
}
