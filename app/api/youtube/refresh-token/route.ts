import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { channelId, refreshToken } = await request.json()

    if (!channelId || !refreshToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get Google OAuth credentials
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'OAuth credentials not configured' },
        { status: 500 }
      )
    }

    // Request new access token from Google
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Token refresh error:', data)
      return NextResponse.json(
        { error: data.error || 'Failed to refresh token' },
        { status: response.status }
      )
    }

    // Update the channel in database with new token
    const supabase = createServerClient()
    const { error: updateError } = await supabase
      .from('youtube_channels')
      .update({
        access_token: data.access_token,
        token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })
      .eq('id', channelId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update channel' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
