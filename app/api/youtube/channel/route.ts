import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

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

export async function GET(request: Request) {
  console.log('Channel API called')

  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      console.log('No channel ID provided')
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
    }

    console.log('Fetching channel:', channelId)
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
      .eq('id', channelId)
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (channelError) {
      console.error('Error fetching channel:', {
        error: channelError,
        channelId,
        userId: session.user.id
      })
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    if (!channel) {
      console.log('No channel found:', {
        channelId,
        userId: session.user.id
      })
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    console.log('Found channel:', {
      id: (channel as any).id,
      title: (channel as any).title,
      userId: session.user.id
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

    // Get the channel's uploads playlist ID
    const channelUrl = appendKey(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&id=${(channel as any).id}`)
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

    return NextResponse.json({
      success: true,
      uploads_playlist_id: uploadsPlaylistId,
      channel: {
        id: (channel as any).id,
        title: (channel as any).title,
        description: (channel as any).description,
        thumbnail_url: (channel as any).thumbnail_url,
        subscriber_count: channelData.items[0].statistics.subscriberCount,
        video_count: channelData.items[0].statistics.videoCount,
        view_count: channelData.items[0].statistics.viewCount,
      }
    })

  } catch (error) {
    console.error('Error in channel API:', error)
    return NextResponse.json({
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
