import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the channel's access token
    const { data: channel } = await supabase
      .from('youtube_channels')
      .select('access_token')
      .eq('user_id', session.user.id)
      .single()

    if (!channel?.access_token) {
      return NextResponse.json({ error: 'No YouTube connection found' }, { status: 404 })
    }

    // Fetch video details from YouTube API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${params.videoId}`,
      {
        headers: {
          Authorization: `Bearer ${channel.access_token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch video from YouTube')
    }

    const data = await response.json()
    const video = data.items?.[0]

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      tags: video.snippet.tags || [],
      publishedAt: video.snippet.publishedAt,
      thumbnails: video.snippet.thumbnails
    })
  } catch (error) {
    console.error('Error fetching video from YouTube:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video details' },
      { status: 500 }
    )
  }
} 