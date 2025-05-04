"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"

export function OverviewTab() {
  const { channel } = useYouTubeChannel()

  if (!channel) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">No channel data available</p>
      </div>
    )
  }

  // Safely parse numbers with fallbacks
  const subscriberCount = Number.parseInt(channel.statistics?.subscriberCount || "0", 10) || 0
  const viewCount = Number.parseInt(channel.statistics?.viewCount || "0", 10) || 0
  const videoCount = Number.parseInt(channel.statistics?.videoCount || "0", 10) || 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Channel Overview</CardTitle>
          <CardDescription>Your YouTube channel at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-4">
              {channel.thumbnails?.default?.url && (
                <img
                  src={channel.thumbnails.default.url || "/placeholder.svg"}
                  alt={channel.title}
                  className="h-12 w-12 rounded-full"
                />
              )}
              <div>
                <h3 className="font-medium">{channel.title}</h3>
                {channel.customUrl && <p className="text-sm text-muted-foreground">@{channel.customUrl}</p>}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground line-clamp-3">{channel.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Subscribers</CardTitle>
          <CardDescription>Total channel subscribers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{subscriberCount.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Total Views</CardTitle>
          <CardDescription>Lifetime channel views</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{viewCount.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Videos</CardTitle>
          <CardDescription>Total videos published</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{videoCount.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  )
}
