"use client"

import { AnalyticsTab } from "@/components/dashboard/analytics-tab"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"

export default function AnalyticsPage() {
  const { channel, loading } = useYouTubeChannel()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
      <AnalyticsTab channelData={channel} isLoading={loading} />
    </div>
  )
}
