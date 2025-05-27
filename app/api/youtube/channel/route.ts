import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const headersList = headers()
    const accessToken = headersList.get('authorization')?.split(' ')[1]

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      )
    }

    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 429 || data.error?.message?.includes('quota')) {
        // Return status code that indicates quota exceeded 
        return NextResponse.json(
          { error: 'API quota exceeded', isQuotaError: true },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: data.error?.message || 'YouTube API error' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Channel API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
