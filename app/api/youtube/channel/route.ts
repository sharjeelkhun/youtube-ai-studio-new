import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // Get the YouTube tokens from the cookie
    const tokenCookie = cookieStore.get("youtube_tokens")

    if (!tokenCookie) {
      return NextResponse.json({ error: "No YouTube tokens found" }, { status: 401 })
    }

    let tokenData
    try {
      tokenData = JSON.parse(tokenCookie.value)
    } catch (e) {
      return NextResponse.json({ error: "Invalid token data" }, { status: 401 })
    }

    const accessToken = tokenData.access_token

    if (!accessToken) {
      return NextResponse.json({ error: "No access token found" }, { status: 401 })
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (tokenData.expiry_time && tokenData.expiry_time <= now) {
      // Token is expired, we should refresh it
      // For now, just return an error
      return NextResponse.json({ error: "Access token expired" }, { status: 401 })
    }

    // Fetch channel data from YouTube API
    const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("YouTube API error response:", errorText)

      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(
          { error: `YouTube API error: ${errorData.error?.message || errorData.error || response.statusText}` },
          { status: response.status },
        )
      } catch (e) {
        return NextResponse.json({ error: `YouTube API error: ${response.statusText}` }, { status: response.status })
      }
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: "No channel found" }, { status: 404 })
    }

    const channelData = data.items[0]

    // Format the response
    const formattedChannel = {
      id: channelData.id,
      title: channelData.snippet.title,
      description: channelData.snippet.description,
      customUrl: channelData.snippet.customUrl,
      thumbnails: channelData.snippet.thumbnails,
      statistics: {
        viewCount: channelData.statistics.viewCount,
        subscriberCount: channelData.statistics.subscriberCount,
        videoCount: channelData.statistics.videoCount,
      },
    }

    return NextResponse.json(formattedChannel)
  } catch (error: any) {
    console.error("Error fetching YouTube channel:", error)
    return NextResponse.json({ error: `Failed to fetch channel data: ${error.message}` }, { status: 500 })
  }
}
