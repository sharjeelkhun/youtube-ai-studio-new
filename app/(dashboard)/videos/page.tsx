"use client"

import { VideosTab } from "@/components/tabs/videos-tab"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { EmptyChannelState } from "@/components/empty-channel-state"
import { Loader2 } from "lucide-react"

export default function VideosPage() {
  const { isLoading, isConnected, channelData } = useYouTubeChannel()

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isConnected || !channelData) {
    return <EmptyChannelState />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Videos</h1>
          <p className="text-sm text-muted-foreground">
            Manage videos for {channelData.title}
          </p>
        </div>
        {channelData.thumbnail && (
          <img
            src={channelData.thumbnail}
            alt={channelData.title}
            className="h-12 w-12 rounded-full"
          />
        )}
      </div>
      <VideosTab />
    </div>
  )
}
