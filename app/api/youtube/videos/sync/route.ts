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

async function fetchAllVideos(accessToken: string, uploadsPlaylistId: string) {
  let allVideos: any[] = []
  let nextPageToken: string | null = null
  let pageCount = 0

  do {
    pageCount++
    console.log(`Fetching videos page ${pageCount}...`)
    
    const playlistUrl: string = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`
    console.log('Fetching from URL:', playlistUrl)
    
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
    
    if (data.items) {
      allVideos = [...allVideos, ...data.items]
    }
    
    nextPageToken = data.nextPageToken

  } while (nextPageToken)

  return allVideos
}

export async function POST(request: Request) {
  console.log('Sync videos API called')

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
      .single()

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

    console.log('Found channel:', {
      id: channel.id,
      title: channel.title,
      userId: session.user.id
    })

    // Check if we need to refresh the token
    const tokenExpiry = new Date(channel.token_expires_at)
    let accessToken = channel.access_token

    if (tokenExpiry <= new Date()) {
      console.log('Token expired, refreshing...')
      try {
        accessToken = await refreshAccessToken(channel.refresh_token)
        
        // Update the access token in the database
        const { error: updateError } = await supabase
          .from('youtube_channels')
          .update({
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
          })
          .eq('id', channel.id)
          .eq('user_id', session.user.id)

        if (updateError) {
          console.error('Error updating token:', {
            error: updateError,
            channelId: channel.id,
            userId: session.user.id
          })
          throw new Error('Failed to update access token')
        }
        
        console.log('Token refreshed successfully')
      } catch (error) {
        console.error('Error refreshing token:', {
          error,
          channelId: channel.id,
          userId: session.user.id
        })
        return NextResponse.json({ error: 'Failed to refresh access token' }, { status: 401 })
      }
    }

    // Get the channel's uploads playlist ID
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&id=${channel.id}`
    console.log('Fetching channel details from:', channelUrl)

    const channelResponse = await fetch(channelUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!channelResponse.ok) {
      const error = await channelResponse.json()
      console.error('YouTube API error (channels):', {
        status: channelResponse.status,
        statusText: channelResponse.statusText,
        error: error
      })
      return NextResponse.json({ error: 'Failed to fetch channel details from YouTube' }, { status: channelResponse.status })
    }

    const channelData = await channelResponse.json()
    console.log('Channel data response:', channelData)

    if (!channelData.items?.length) {
      console.log('No channel data found')
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads
    console.log('Found uploads playlist:', uploadsPlaylistId)

    // Fetch all videos from the uploads playlist
    const playlistItems = await fetchAllVideos(accessToken, uploadsPlaylistId)
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
      console.log(`Processing video batch ${i/50 + 1}...`)

      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status,liveStreamingDetails&id=${batchIds.join(',')}`
      console.log('Fetching video stats from:', statsUrl)

      const statsResponse = await fetch(statsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!statsResponse.ok) {
        const error = await statsResponse.json()
        console.error('YouTube API error (videos):', {
          status: statsResponse.status,
          statusText: statsResponse.statusText,
          error: error
        })
        return NextResponse.json({ error: 'Failed to fetch video statistics' }, { status: statsResponse.status })
      }

      const statsData = await statsResponse.json()
      console.log(`Fetched stats for ${statsData.items?.length || 0} videos`)

      // Process each video
      for (const video of statsData.items) {
        const base = playlistItems.find(item => item.snippet.resourceId.videoId === video.id)?.snippet
        const iso = video.contentDetails?.duration || ''
        const seconds = (() => {
          try {
            const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
            const h = match?.[1] ? parseInt(match[1], 10) : 0
            const m = match?.[2] ? parseInt(match[2], 10) : 0
            const s = match?.[3] ? parseInt(match[3], 10) : 0
            return h * 3600 + m * 60 + s
          } catch { return 0 }
        })()
        const isShort = seconds > 0 && seconds <= 60
        const liveFlag = video?.snippet?.liveBroadcastContent
        const hasLiveDetails = !!video?.liveStreamingDetails
        const isLive = (liveFlag && liveFlag !== 'none') || hasLiveDetails
        const computedTags: string[] = []
        if (isShort) computedTags.push('short')
        if (isLive) computedTags.push('live')
        const videoData = {
          id: video.id,
          channel_id: channel.id,
          title: base?.title || '',
          description: base?.description || '',
          thumbnail_url: base?.thumbnails?.medium?.url || base?.thumbnails?.default?.url || null,
          published_at: base?.publishedAt || '',
          view_count: parseInt(video.statistics.viewCount || '0'),
          like_count: parseInt(video.statistics.likeCount || '0'),
          comment_count: parseInt(video.statistics.commentCount || '0'),
          duration: video.contentDetails.duration || '',
          status: video.status.privacyStatus || 'private',
          tags: computedTags
        }

        // Upsert the video data
        const { error: upsertError } = await supabase
          .from('youtube_videos')
          .upsert(videoData, {
            onConflict: 'id'
          })

        if (upsertError) {
          console.error('Error upserting video:', {
            error: upsertError,
            videoId: video.id
          })
          continue
        }

        videos.push(videoData)
      }
    }

    // Calculate total statistics from all videos
    const totalViews = videos.reduce((sum, video) => sum + (video.view_count || 0), 0)
    const totalLikes = videos.reduce((sum, video) => sum + (video.like_count || 0), 0)
    const totalComments = videos.reduce((sum, video) => sum + (video.comment_count || 0), 0)

    // Update channel statistics
    const { error: updateError } = await supabase
      .from('youtube_channels')
      .update({
        view_count: totalViews,
        video_count: videos.length,
        last_synced: new Date().toISOString()
      })
      .eq('id', channel.id)
      .eq('user_id', session.user.id)

    if (updateError) {
      console.error('Error updating channel statistics:', updateError)
    }

    return NextResponse.json({
      success: true,
      videos: videos,
      message: `Successfully synced ${videos.length} videos`
    })

  } catch (error) {
    console.error('Error in sync videos API:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}