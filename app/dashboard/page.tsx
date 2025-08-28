"use client"

import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { OverviewTab } from "@/components/dashboard/overview-tab"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { channel, loading } = useYouTubeChannel()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <OverviewTab channelData={channel} isLoading={loading} />
    </div>
  )
}
