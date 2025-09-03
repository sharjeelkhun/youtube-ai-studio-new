import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Helper: always resolve redirect dynamically
const getRedirectUri = (request: Request) => {
  try {
    // Always prefer the origin of the incoming request
    const url = new URL(request.url)
    return `${url.origin}/connect-channel/callback`
  } catch {
    // Fallback to Vercel or localhost
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}/connect-channel/callback`
    }
    return "http://localhost:3000/connect-channel/callback"
  }
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Authorization code is required" }, { status: 400 })
    }

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""
    const REDIRECT_URI = getRedirectUri(request)

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Google OAuth credentials are not properly configured" },
        { status: 500 }
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: tokenData.error_description || "Failed to exchange authorization code" },
        { status: tokenResponse.status }
      )
    }

    const { access_token, refresh_token, expires_in } = tokenData
    const expiryDate = new Date(Date.now() + expires_in * 1000)

    // Fetch channel data
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      { headers: { Authorization: `Bearer ${access_token}` } }
    )

    const channelData = await channelResponse.json()

    if (!channelResponse.ok) {
      return NextResponse.json(
        { error: channelData.error?.message || "Failed to fetch channel data" },
        { status: channelResponse.status }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const channel = channelData.items?.[0]

    if (!channel) {
      return NextResponse.json({ error: "No YouTube channel found" }, { status: 404 })
    }

    const channelId = channel.id;
    await supabase.from("youtube_channels").upsert(
      {
        id: channelId,
        user_id: session.user.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        subscribers: channel.statistics.subscriberCount || 0,
        videos: channel.statistics.videoCount || 0,
        thumbnail: channel.snippet.thumbnails?.default?.url || null,
        access_token,
        refresh_token,
        token_expires_at: expiryDate.toISOString(),
      },
      { onConflict: "id" }
    )

    // Fetch some videos to populate the database
    try {
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      )

      const videosData = await videosResponse.json()

      if (videosResponse.ok && videosData.items?.length > 0) {
        const videoPromises = videosData.items.map(async (item: any) => {
          const videoId = item.id.videoId
          const videoDetailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status,liveStreamingDetails&id=${videoId}`,
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            },
          )

          const videoDetails = await videoDetailsResponse.json()
          const details = videoDetails.items?.[0] || {}
          const stats = details.statistics || {}
          const contentDetails = details.contentDetails || {}
          const status = details.status || {}
          const liveStreamingDetails = details.liveStreamingDetails || null

          const iso = contentDetails?.duration || ''
          const seconds = (() => {
            try {
              const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
              const h = match?.[1] ? parseInt(match[1], 10) : 0
              const m = match?.[2] ? parseInt(match[2], 10) : 0
              const s = match?.[3] ? parseInt(match[3], 10) : 0
              return h * 3600 + m * 60 + s
            } catch { return 0 }
          })()
          const liveFlag = details?.snippet?.liveBroadcastContent
          const isShort = seconds > 0 && seconds <= 60
          const isLive = (liveFlag && liveFlag !== 'none') || !!liveStreamingDetails
          const tags: string[] = []
          if (isShort) tags.push('short')
          if (isLive) tags.push('live')

          return {
            id: videoId,
            channel_id: channelId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail_url: item.snippet.thumbnails?.medium?.url || null,
            view_count: parseInt(stats.viewCount || '0'),
            like_count: parseInt(stats.likeCount || '0'),
            comment_count: parseInt(stats.commentCount || '0'),
            duration: contentDetails.duration || '',
            status: status.privacyStatus || 'public',
            published_at: item.snippet.publishedAt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tags,
          }
        })

        const videos = await Promise.all(videoPromises)

        await supabase.from("youtube_videos").upsert(videos, {
          onConflict: "id",
        })
      }
    } catch (videoError) {
      console.error("Error fetching initial videos:", videoError)
    }

    return NextResponse.json({
      success: true,
      access_token,
      refresh_token,
      expires_in,
      channelId,
      channelTitle: channel.snippet.title,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    )
  }
}