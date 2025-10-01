import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const supabase = createClient()
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

export async function POST(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: channel } = await supabase
      .from('youtube_channels')
      .select('access_token')
      .eq('user_id', session.user.id)
      .single()

    if (!channel?.access_token) {
      return NextResponse.json({ error: 'No YouTube connection found' }, { status: 404 })
    }

    const { title, description, tags } = await request.json()

    const videoDetails = {
      id: params.videoId,
      snippet: {
        title,
        description,
        tags,
        categoryId: '28' //  Science & Technology. This should probably be fetched from the video.
      }
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${channel.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(videoDetails)
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('YouTube API Error:', errorData)
      return NextResponse.json({ error: 'Failed to update video on YouTube', details: errorData }, { status: response.status })
    }

    const updatedVideo = await response.json()

    // Also update our local database
    const { error: dbError } = await supabase
      .from('youtube_videos')
      .update({
        title,
        description,
        tags
      })
      .eq('id', params.videoId)

    if (dbError) {
      console.error('Error updating video in DB:', dbError)
      // If this fails, the YouTube update still succeeded, so we don't want to return an error to the client
    }

    return NextResponse.json({ success: true, video: updatedVideo })
  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
} 