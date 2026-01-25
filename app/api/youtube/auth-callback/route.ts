import { createServerClient } from '@supabase/ssr'
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

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
    const { code, state } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Authorization code is required" }, { status: 400 })
    }

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""
    const REDIRECT_URI = getRedirectUri(request)

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('❌ Missing Google OAuth credentials in auth callback:', {
        hasClientId: !!CLIENT_ID,
        hasClientSecret: !!CLIENT_SECRET,
        hint: 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local. See GOOGLE_OAUTH_SETUP.md for instructions.'
      });
      return NextResponse.json(
        {
          error: "Google OAuth credentials are not properly configured",
          details: "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET",
          setupUrl: "/GOOGLE_OAUTH_SETUP.md"
        },
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

    const cookieStore = cookies()
    let userId: string | undefined

    // 1. Try Bearer Token
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (user && !error) userId = user.id
    }

    // 2. Fallback to Cookies
    if (!userId) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) { return cookieStore.get(name)?.value },
            set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
            remove(name: string, options: any) { cookieStore.delete(name) },
          },
        } as any
      )
      const { data: { session } } = await supabase.auth.getSession()
      userId = session?.user?.id
    }

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile using Admin client
    const { data: profile } = await (supabaseAdmin.from('profiles').select('youtube_api_key, ai_settings').eq('id', userId) as any).single()
    const personalApiKey = (profile as any)?.youtube_api_key || (profile as any)?.ai_settings?.apiKeys?.gemini

    const appendKey = (url: string) => {
      if (!personalApiKey) return url
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}key=${personalApiKey}`
    }

    // Fetch channel data (with contentDetails to get uploads playlist)
    const channelResponse = await fetch(
      appendKey("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true"),
      { headers: { Authorization: `Bearer ${access_token}` } }
    )

    const channelData = await channelResponse.json()

    if (!channelResponse.ok) {
      if (channelData.error?.errors?.[0]?.reason === 'quotaExceeded') {
        return NextResponse.json(
          {
            error: "YouTube API quota exceeded for the app. Please try again tomorrow or add your own YouTube API Key in settings to proceed.",
            errorCode: 'quota_exceeded'
          },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: channelData.error?.message || "Failed to fetch channel data" },
        { status: channelResponse.status }
      )
    }

    // Moved up

    const channel = channelData.items?.[0]

    if (!channel) {
      return NextResponse.json({ error: "No YouTube channel found" }, { status: 404 })
    }

    const channelId = channel.id;

    // Check if channel is already connected to another user
    // Check if channel is already connected to another user
    // Check if channel is already connected to another user
    const { data: existingChannel } = await (supabaseAdmin
      .from("youtube_channels")
      .select("user_id")
      .eq("id", channelId) as any)
      .single()

    if (existingChannel && (existingChannel as any).user_id !== userId) {
      // Parse force claim from state
      const forceClaim = state && state.toString().endsWith('::force')

      if (!forceClaim) {
        // Get the email of the existing owner to show in the error
        const { data: channelOwner } = await (supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', (existingChannel as any).user_id) as any)
          .single()

        return NextResponse.json(
          {
            error: `This YouTube channel is already connected to another account (${(channelOwner as any)?.email || 'Unknown'}). Do you want to claim it?`,
            conflict: true,
            channelTitle: channel.snippet.title
          },
          { status: 409 }
        )
      }

      // Force claim: Delete existing channel and videos
      console.log(`Force claiming channel ${channelId} from user ${(existingChannel as any).user_id} to ${userId}`)

      // Delete associated videos first
      await supabaseAdmin
        .from('youtube_videos')
        .delete()
        .eq('channel_id', channelId)

      // Delete the channel
      await supabaseAdmin
        .from('youtube_channels')
        .delete()
        .eq('id', channelId)
    }

    await (supabaseAdmin.from("youtube_channels") as any).upsert(
      {
        id: channelId,
        user_id: userId,
        title: channel.snippet.title,
        description: channel.snippet.description,
        subscriber_count: channel.statistics.subscriberCount || 0,
        video_count: channel.statistics.videoCount || 0,
        thumbnail: channel.snippet.thumbnails?.default?.url || null,
        access_token,
        refresh_token,
        token_expires_at: expiryDate.toISOString(),
        last_updated: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

    // Fetch the recent videos from the uploads playlist (Quota efficient: 1 unit)
    try {
      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads
      if (!uploadsPlaylistId) throw new Error("No uploads playlist found")

      const videosResponse = await fetch(
        appendKey(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10`),
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      )

      const videosData = await videosResponse.json()

      if (videosResponse.ok && videosData.items?.length > 0) {
        const videoPromises = videosData.items.map(async (item: any) => {
          const videoId = item.snippet.resourceId.videoId
          const videoDetailsResponse = await fetch(
            appendKey(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status,liveStreamingDetails&id=${videoId}`),
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

        await (supabaseAdmin.from("youtube_videos") as any).upsert(videos, {
          onConflict: "id",
        })
      }

      // Update profile onboarding status
      await (supabaseAdmin
        .from('profiles') as any)
        .update({ onboarding_completed: true })
        .eq('id', userId)
    } catch (videoError: any) {
      console.error("Error fetching initial videos:", videoError)
      // Check for quota error in video fetch too
      if (videoError.message?.includes('quotaExceeded') || (videoError.errors?.[0]?.reason === 'quotaExceeded')) {
        console.warn("Quota exceeded during initial video fetch. Proceeding with partial data.")
      }
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