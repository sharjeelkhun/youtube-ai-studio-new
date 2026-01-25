import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function refreshAccessToken(refreshToken: string) {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing Google OAuth credentials:', {
      hasClientId: !!CLIENT_ID,
      hasClientSecret: !!CLIENT_SECRET
    })
    throw new Error('Google OAuth credentials are not configured')
  }

  console.log('Refreshing access token...')
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('Token refresh failed:', {
      status: response.status,
      statusText: response.statusText,
      error: error
    })
    throw new Error('Failed to refresh access token')
  }

  const data = await response.json()
  console.log('Token refresh successful')
  return data.access_token
}

async function fetchAllVideos(accessToken: string, playlistId: string, apiKey?: string) {
  let allVideos: any[] = []
  let nextPageToken = null
  let pageCount = 0
  const maxPages = 10 // Limit to prevent excessive API calls

  const appendKey = (url: string) => {
    if (!apiKey) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}key=${apiKey}`
  }

  do {
    pageCount++
    console.log(`Fetching videos page ${pageCount}...`)

    const playlistUrl: string = appendKey(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`)

    const response = await fetch(playlistUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to fetch playlist items:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        page: pageCount
      })
      throw new Error('Failed to fetch videos from YouTube')
    }

    const data = await response.json()
    console.log(`Fetched ${data.items?.length || 0} videos from page ${pageCount}`)

    allVideos = [...allVideos, ...(data.items || [])]
    nextPageToken = data.nextPageToken

    // Break if we've reached the maximum number of pages
    if (pageCount >= maxPages) {
      console.log(`Reached maximum page limit (${maxPages})`)
      break
    }
  } while (nextPageToken)

  return allVideos
}

export async function GET(request: Request) {
  console.log('Videos API called')
  const { searchParams } = new URL(request.url)
  const playlistId = searchParams.get('playlistId')

  if (!playlistId) {
    return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
  }

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }

    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Session found for user:', session.user.id)

    // Get the user's YouTube channel
    const { data: channel, error: channelError } = await supabase
      .from('youtube_channels')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (channelError) {
      console.error('Error fetching channel:', {
        error: channelError,
        userId: session.user.id
      })
      return NextResponse.json({ error: 'No YouTube channel connected' }, { status: 404 })
    }

    if (!channel) {
      console.log('No channel found for user:', {
        userId: session.user.id
      })
      return NextResponse.json({ error: 'No YouTube channel connected' }, { status: 404 })
    }

    // Found channel
    console.log('Found channel:', {
      id: (channel as any).id,
      title: (channel as any).title,
      userId: session.user.id,
      hasAccessToken: !!(channel as any).access_token,
      hasRefreshToken: !!(channel as any).refresh_token,
      tokenExpiresAt: (channel as any).token_expires_at
    })

    // Get user profile to check for personal YouTube API Key or Gemini Key
    const { data: profile } = await (supabase.from('profiles').select('youtube_api_key, ai_settings').eq('id', session.user.id) as any).single()
    const personalApiKey = (profile as any)?.youtube_api_key || (profile as any)?.ai_settings?.apiKeys?.gemini

    const appendKey = (url: string) => {
      if (!personalApiKey) return url
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}key=${personalApiKey}`
    }

    // Check if we need to refresh the token
    const tokenExpiry = new Date((channel as any).token_expires_at)
    let accessToken = (channel as any).access_token

    if (tokenExpiry <= new Date()) {
      console.log('Token expired, refreshing...')
      try {
        accessToken = await refreshAccessToken((channel as any).refresh_token)

        // Update the access token in the database
        const { error: updateError } = await (supabase
          .from('youtube_channels') as any)
          .update({
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
          })
          .eq('id', (channel as any).id)
          .eq('user_id', session.user.id)

        if (updateError) {
          console.error('Error updating token:', {
            error: updateError,
            channelId: (channel as any).id,
            userId: session.user.id
          })
          throw new Error('Failed to update access token')
        }

        console.log('Token refreshed successfully')
      } catch (error) {
        console.error('Error refreshing token:', {
          error,
          channelId: (channel as any).id,
          userId: session.user.id
        })
        return NextResponse.json({ error: 'Failed to refresh access token' }, { status: 401 })
      }
    }

    // Fetch all videos from the playlist
    const playlistItems = await fetchAllVideos(accessToken, playlistId, personalApiKey)
    console.log(`Total videos found: ${playlistItems.length}`)

    if (playlistItems.length === 0) {
      console.log('No videos found in playlist')
      return NextResponse.json({
        success: true,
        videos: [],
        message: 'No videos found in playlist'
      })
    }

    // Get video IDs for batch statistics fetch
    const videoIds = playlistItems.map(item => item.snippet.resourceId.videoId)
    const videos = []

    // Process videos in batches of 50 (YouTube API limit)
    for (let i = 0; i < videoIds.length; i += 50) {
      const batchIds = videoIds.slice(i, i + 50)
      console.log(`Processing video batch ${i / 50 + 1}...`)

      const statsUrl = appendKey(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,status&id=${batchIds.join(',')}`)
      console.log('Fetching video stats from:', statsUrl)

      const statsResponse = await fetch(statsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!statsResponse.ok) {
        console.error('Failed to fetch video statistics for batch:', {
          batch: i / 50 + 1,
          status: statsResponse.status,
          statusText: statsResponse.statusText
        })
        continue
      }

      const statsData = await statsResponse.json()
      console.log(`Fetched stats for ${statsData.items?.length || 0} videos in batch ${i / 50 + 1}`)

      // Match statistics with playlist items
      for (const item of playlistItems.slice(i, i + 50)) {
        const videoStats = statsData.items?.find(
          (stat: any) => stat.id === item.snippet.resourceId.videoId
        )

        if (!videoStats) {
          console.log('No stats found for video:', item.snippet.resourceId.videoId)
          continue
        }

        const video = {
          id: item.snippet.resourceId.videoId,
          channel_id: (channel as any).id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail_url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          published_at: item.snippet.publishedAt,
          view_count: parseInt(videoStats.statistics.viewCount || '0'),
          like_count: parseInt(videoStats.statistics.likeCount || '0'),
          comment_count: parseInt(videoStats.statistics.commentCount || '0'),
          duration: videoStats.contentDetails.duration,
          status: videoStats.status.privacyStatus
        }

        videos.push(video)
      }
    }

    console.log('Successfully processed videos:', {
      total: videos.length,
      channelId: (channel as any).id
    })

    return NextResponse.json({
      success: true,
      videos,
      message: `Successfully fetched ${videos.length} videos`
    })

  } catch (error) {
    console.error('Error in videos API:', error)
    return NextResponse.json({
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 