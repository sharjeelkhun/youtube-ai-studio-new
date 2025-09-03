import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Get the authorization code from the request body
    const { code } = await request.json()

    console.log("Received auth callback request:", {
      hasCode: !!code,
      codeLength: code?.length,
      requestHeaders: Object.fromEntries(request.headers.entries())
    })

    if (!code) {
      console.error("Missing authorization code in request")
      return NextResponse.json({ error: "Authorization code is required" }, { status: 400 })
    }

    // Define your YouTube OAuth configuration
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""
    const getRedirectUri = () => {
      if (process.env.NODE_ENV === 'production') {
        return 'https://youtube-ai-studio-new.vercel.app/connect-channel/callback';
      }
      return 'http://localhost:3000/connect-channel/callback';
    };

    const REDIRECT_URI = getRedirectUri();

    console.log("OAuth configuration:", {
      hasClientId: !!CLIENT_ID,
      hasClientSecret: !!CLIENT_SECRET,
      redirectUri: REDIRECT_URI
    })

    // Validate environment variables
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing OAuth credentials:", {
        clientId: !!CLIENT_ID,
        clientSecret: !!CLIENT_SECRET,
        redirectUri: REDIRECT_URI
      })
      return NextResponse.json(
        {
          error: "Google OAuth credentials are not properly configured",
          debug: {
            env: {
              GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
              GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
              NEXT_PUBLIC_REDIRECT_URI: process.env.NEXT_PUBLIC_REDIRECT_URI,
            },
          },
        },
        { status: 500 },
      )
    }

    console.log("Exchanging code for tokens with:", {
      redirectUri: REDIRECT_URI,
      clientIdConfigured: !!CLIENT_ID,
      codeLength: code.length
    })

    // Exchange code for access token and refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
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
      console.error("Token exchange error:", {
        status: tokenResponse.status,
        error: tokenData.error,
        errorDescription: tokenData.error_description,
        redirectUri: REDIRECT_URI,
        requestBody: {
          codeLength: code.length,
          redirectUri: REDIRECT_URI,
          grantType: "authorization_code"
        }
      })
      return NextResponse.json(
        {
          error: tokenData.error_description || "Failed to exchange authorization code",
          details: tokenData,
          debug: {
            code: code.substring(0, 10) + "...", // Only show part of the code for security
            redirectUri: REDIRECT_URI,
            status: tokenResponse.status
          },
        },
        { status: tokenResponse.status },
      )
    }

    // Extract tokens and expiry
    const { access_token, refresh_token, expires_in } = tokenData
    const expiryDate = new Date(Date.now() + expires_in * 1000)

    console.log("Token exchange successful:", {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
      expiresIn: expires_in
    })

    // Get user's YouTube channel information
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    )

    const channelData = await channelResponse.json()

    if (!channelResponse.ok) {
      console.error("Channel fetch error:", channelData)
      return NextResponse.json(
        {
          error: channelData.error?.message || "Failed to fetch channel data",
          details: channelData,
        },
        { status: channelResponse.status },
      )
    }

    // Access the authenticated user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userId = session.user.id

    // Get the first channel (most users only have one)
    const channel = channelData.items[0]

    if (!channel) {
      return NextResponse.json({ error: "No YouTube channel found" }, { status: 404 })
    }

    const channelId = channel.id
    const channelTitle = channel.snippet.title
    const channelDescription = channel.snippet.description
    const channelThumbnail = channel.snippet.thumbnails?.default?.url || null
    const subscriberCount = channel.statistics.subscriberCount || 0
    const videoCount = channel.statistics.videoCount || 0

    // Save channel data to database
    const { error: channelError } = await supabase.from("youtube_channels").upsert(
      {
        id: channelId,
        user_id: userId,
        title: channelTitle,
        description: channelDescription,
        subscribers: subscriberCount,
        videos: videoCount,
        thumbnail: channelThumbnail,
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: expiryDate.toISOString(),
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )

    if (channelError) {
      console.error("Database error:", channelError)
      return NextResponse.json({ error: `Failed to save channel data: ${channelError.message}` }, { status: 500 })
    }

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
        // Process videos in parallel
        const videoPromises = videosData.items.map(async (item: any) => {
          const videoId = item.id.videoId
          const videoTitle = item.snippet.title
          const videoDescription = item.snippet.description
          const videoThumbnail = item.snippet.thumbnails?.medium?.url || null
          const publishedAt = item.snippet.publishedAt

          // Get video statistics and content details
          const videoDetailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,status&id=${videoId}`,
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

          return {
            video_id: videoId,
            channel_id: channelId,
            title: videoTitle,
            description: videoDescription,
            thumbnail_url: videoThumbnail,
            view_count: parseInt(stats.viewCount || '0'),
            like_count: parseInt(stats.likeCount || '0'),
            comment_count: parseInt(stats.commentCount || '0'),
            duration: contentDetails.duration || '',
            status: status.privacyStatus || 'public',
            published_at: publishedAt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tags: [],
            thumbnails: item.snippet.thumbnails || {},
            last_synced_at: new Date().toISOString()
          }
        })

        const videos = await Promise.all(videoPromises)

        // Insert videos into database
        const { error: videosError } = await supabase.from("youtube_videos").upsert(videos, {
          onConflict: "video_id",
        })

        if (videosError) {
          console.error("Error saving videos:", videosError)
        }
      }
    } catch (videoError) {
      console.error("Error fetching videos:", videoError)
    }

    return NextResponse.json({
      success: true,
      access_token: access_token,
      refresh_token: refresh_token,
      expires_in: expires_in,
      channelId: channelId,
      channelTitle: channelTitle,
      channelDescription: channelDescription,
      channelThumbnail: channelThumbnail,
      subscriberCount: subscriberCount,
      videoCount: videoCount
    })
  } catch (error: any) {
    console.error("YouTube auth callback error:", error)
    return NextResponse.json(
      {
        error: `An unexpected error occurred: ${error.message}`,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
