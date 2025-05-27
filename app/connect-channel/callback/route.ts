import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(new URL('/connect-channel?error=no_code', req.url))
    }

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('Token data:', tokenData)

    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }
    )

    const channelData = await channelResponse.json()
    console.log('Channel data:', channelData)
    const channel = channelData.items?.[0]

    if (!channel) {
      return NextResponse.redirect(new URL('/connect-channel?error=no_channel', req.url))
    }

    // First delete any existing channel
    await supabase.from('youtube_channels').delete().eq('user_id', session.user.id)

    // Then insert new channel data
    await supabase.from('youtube_channels').insert({
      id: channel.id,
      user_id: session.user.id,
      title: channel.snippet.title,
      description: channel.snippet.description || '',
      thumbnail: channel.snippet.thumbnails?.default?.url || '',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString()
    })

    // Redirect to dashboard without query params
    return NextResponse.redirect(new URL('/dashboard', req.url))

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/connect-channel?error=unknown', req.url))
  }
}
