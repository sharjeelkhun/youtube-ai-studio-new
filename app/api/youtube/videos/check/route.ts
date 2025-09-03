import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

type UploadsResult = { ids: string[] } | { error: { status?: number; body?: any } }

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function fetchAllUploadIds(accessToken: string, uploadsPlaylistId: string): Promise<UploadsResult> {
  const ids: string[] = []
  let nextPageToken: string | null = null

  do {
    const url: string = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) {
      const error = await response.json().catch(() => null)
      return { error: { status: response.status, body: error } }
    }
    const data = await response.json()
    const pageIds = (data.items || []).map((item: any) => item?.snippet?.resourceId?.videoId).filter(Boolean)
    ids.push(...pageIds)
    nextPageToken = data.nextPageToken || null
  } while (nextPageToken)

  return { ids }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find channel for user
    const { data: channel, error: channelError } = await supabase
      .from('youtube_channels')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'No YouTube channel connected' }, { status: 404 })
    }

    // Ensure valid access token (refresh if expired)
    let accessToken = channel.access_token as string | null
    const tokenExpiry = channel.token_expires_at ? new Date(channel.token_expires_at) : null
    const needsRefresh = !accessToken || (tokenExpiry && tokenExpiry <= new Date())

    if (needsRefresh) {
      const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
      const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
      if (!CLIENT_ID || !CLIENT_SECRET || !channel.refresh_token) {
        return NextResponse.json({ error: 'Missing Google OAuth credentials' }, { status: 500 })
      }
      const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: channel.refresh_token,
          grant_type: 'refresh_token',
        }),
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => null)
        return NextResponse.json({ error: 'Failed to refresh token', details: body }, { status: 401 })
      }
      const tokenJson = await resp.json()
      accessToken = tokenJson.access_token
      await supabase
        .from('youtube_channels')
        .update({ access_token: accessToken, token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString() })
        .eq('id', channel.id)
        .eq('user_id', session.user.id)
    }

    // Get uploads playlist
    const channelResp = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channel.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!channelResp.ok) {
      const body = await channelResp.json().catch(() => null)
      return NextResponse.json({ error: 'Failed to fetch channel details', details: body }, { status: channelResp.status })
    }
    const channelJson = await channelResp.json()
    const uploadsPlaylistId = channelJson?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) {
      return NextResponse.json({ error: 'Uploads playlist not found' }, { status: 404 })
    }

    // Fetch all upload IDs from YouTube
    const uploads = await fetchAllUploadIds(accessToken!, uploadsPlaylistId)
    if ('error' in uploads) {
      const err = uploads.error || {}
      return NextResponse.json({ error: 'Failed to fetch uploads', details: err }, { status: err.status || 500 })
    }

    const youtubeIds = new Set(uploads.ids)

    // Fetch existing IDs from DB
    const { data: dbRows, error: dbError } = await supabase
      .from('youtube_videos')
      .select('id')
      .eq('channel_id', channel.id)

    if (dbError) {
      return NextResponse.json({ error: 'Failed to query database' }, { status: 500 })
    }

    const dbIds = new Set((dbRows || []).map((r: any) => r.id))
    let newCount = 0
    for (const id of youtubeIds) {
      if (!dbIds.has(id)) newCount++
    }

    return NextResponse.json({ newCount })
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: String(error) }, { status: 500 })
  }
}


