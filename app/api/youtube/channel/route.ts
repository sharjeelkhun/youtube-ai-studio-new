import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the channel data from the database
    const { data: channelData, error: channelError } = await supabase
      .from("youtube_channels")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (channelError) {
      return NextResponse.json({ error: `Failed to fetch channel data: ${channelError.message}` }, { status: 500 })
    }

    if (!channelData) {
      return NextResponse.json({ error: "No YouTube channel connected" }, { status: 404 })
    }

    // Check if the token is expired
    const tokenExpiresAt = new Date(channelData.token_expires_at).getTime()
    const now = Date.now()

    let accessToken = channelData.access_token

    if (now >= tokenExpiresAt) {
      // Token is expired, refresh it
      const refreshResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/youtube/refresh-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channelId: channelData.id,
            refreshToken: channelData.refresh_token,
          }),
        },
      )

      if (!refreshResponse.ok) {
        return NextResponse.json({ error: "Failed to refresh access token" }, { status: refreshResponse.status })
      }

      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token
    }

    // Fetch the latest channel data from YouTube API
    const youtubeResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    )

    if (!youtubeResponse.ok) {
      return NextResponse.json(
        { error: `YouTube API error: ${youtubeResponse.statusText}` },
        { status: youtubeResponse.status },
      )
    }

    const youtubeData = await youtubeResponse.json()

    if (!youtubeData.items || youtubeData.items.length === 0) {
      return NextResponse.json({ error: "No channel found" }, { status: 404 })
    }

    const channel = youtubeData.items[0]

    // Format the response
    const response = {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description || null,
      customUrl: channel.snippet.customUrl || null,
      thumbnail: channel.snippet.thumbnails?.default?.url || null,
      subscribers: Number.parseInt(channel.statistics.subscriberCount) || 0,
      videos: Number.parseInt(channel.statistics.videoCount) || 0,
      views: Number.parseInt(channel.statistics.viewCount) || 0,
      lastUpdated: new Date().toISOString(),
      statistics: channel.statistics,
      thumbnails: channel.snippet.thumbnails,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error fetching channel data:", error)
    return NextResponse.json({ error: `Failed to fetch channel data: ${error.message}` }, { status: 500 })
  }
}
