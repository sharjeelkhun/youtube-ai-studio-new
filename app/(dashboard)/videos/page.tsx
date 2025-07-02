'use client'

import { VideoGrid } from '@/components/video-grid'
import { useEffect, useState } from 'react'
import { useYouTubeChannel } from '@/contexts/youtube-channel-context'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

export default function VideosPage() {
  const [videos, setVideos] = useState<Database['public']['Tables']['youtube_videos']['Row'][]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { channel } = useYouTubeChannel()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchVideos = async () => {
      if (!channel?.id) return

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('youtube_videos')
          .select('*')
          .eq('channel_id', channel.id)
          .order('published_at', { ascending: false })

        if (error) throw error
        setVideos(data || [])
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [channel?.id, supabase])

  return (
    <div className="container py-6">
      <VideoGrid videos={videos} />
    </div>
  )
}
