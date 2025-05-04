"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function YouTubeChannelDisplay() {
  const [channelData, setChannelData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        setIsLoading(true)

        // Get the access token from session storage
        const accessToken = sessionStorage.getItem("youtube_access_token")

        if (!accessToken) {
          setIsLoading(false)
          return
        }

        // Fetch channel data from YouTube API
        const response = await fetch(
          "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          },
        )

        if (!response.ok) {
          throw new Error(`YouTube API error: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.items || data.items.length === 0) {
          throw new Error("No channel found")
        }

        const channelData = data.items[0]
        setChannelData(channelData)
      } catch (error: any) {
        console.error("Error fetching channel data:", error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChannelData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Channel</CardTitle>
          <CardDescription>There was a problem loading your YouTube channel</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => (window.location.href = "/connect-channel")}>
            Reconnect Channel
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!channelData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Channel Connected</CardTitle>
          <CardDescription>Connect your YouTube channel to see analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => (window.location.href = "/connect-channel")}>Connect YouTube Channel</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{channelData.snippet.title}</CardTitle>
        <CardDescription>{channelData.snippet.customUrl}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {channelData.snippet.thumbnails?.default?.url && (
            <img
              src={channelData.snippet.thumbnails.default.url || "/placeholder.svg"}
              alt={channelData.snippet.title}
              className="h-16 w-16 rounded-full"
            />
          )}
          <div>
            <p>
              <strong>Subscribers:</strong> {Number.parseInt(channelData.statistics.subscriberCount).toLocaleString()}
            </p>
            <p>
              <strong>Videos:</strong> {Number.parseInt(channelData.statistics.videoCount).toLocaleString()}
            </p>
            <p>
              <strong>Views:</strong> {Number.parseInt(channelData.statistics.viewCount).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
