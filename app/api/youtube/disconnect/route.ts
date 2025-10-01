import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'

export async function POST() {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: channel, error: channelError } = await supabase
      .from('youtube_channels')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'No YouTube channel connected' }, { status: 404 })
    }

    // Delete associated videos first to maintain referential integrity
    const { error: videosError } = await supabase
      .from('youtube_videos')
      .delete()
      .eq('channel_id', channel.id)

    if (videosError) {
      console.error('Error disconnecting youtube channel (deleting videos):', videosError)
      return NextResponse.json({ error: 'Failed to delete associated videos' }, { status: 500 })
    }

    // Delete the channel itself
    const { error: deleteChannelError } = await supabase
      .from('youtube_channels')
      .delete()
      .eq('id', channel.id)

    if (deleteChannelError) {
      console.error('Error disconnecting youtube channel (deleting channel):', deleteChannelError)
      return NextResponse.json({ error: 'Failed to disconnect YouTube channel' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Successfully disconnected YouTube channel.' })
  } catch (error) {
    console.error('Error disconnecting youtube channel:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
