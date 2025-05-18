"use client"

import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Youtube, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function YouTubeConnectionStatus() {
  const { channel, isLoading, error, refreshChannel, hasConnectedChannel } = useYouTubeChannel()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshChannel()
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>YouTube Connection</CardTitle>
          <CardDescription>Checking connection status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>YouTube Connection</CardTitle>
          <CardDescription>There was an error checking your connection</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Try Again"}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (!hasConnectedChannel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>YouTube Connection</CardTitle>
          <CardDescription>Connect your YouTube channel to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <Youtube className="h-8 w-8 text-red-600 dark:text-red-300" />
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              You need to connect your YouTube channel to use this feature.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/connect-channel")}>
            Connect YouTube Channel
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>YouTube Connection</CardTitle>
        <CardDescription>Your YouTube channel is connected</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <img
              src={channel?.thumbnail || "/placeholder.svg?height=48&width=48"}
              alt={channel?.title || "Channel"}
              className="h-12 w-12 rounded-full"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium">{channel?.title}</h3>
            <p className="text-sm text-gray-500">
              {channel?.subscribers.toLocaleString()} subscribers • {channel?.videos.toLocaleString()} videos
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/connect-channel")}>
          Reconnect
        </Button>
      </CardFooter>
    </Card>
  )
}
