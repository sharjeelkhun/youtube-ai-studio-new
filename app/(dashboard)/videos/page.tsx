'use client'

import { VideoGrid } from '@/components/video-grid'
import { useEffect, useState } from 'react'
import { useYouTubeChannel } from '@/contexts/youtube-channel-context'
import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import VideosLoading from '@/app/dashboard/videos/loading'

export default function VideosPage() {
  const [videos, setVideos] = useState<Database['public']['Tables']['youtube_videos']['Row'][]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { channel } = useYouTubeChannel()

  useEffect(() => {
    const fetchVideos = async () => {
      if (!channel?.id) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('youtube_videos')
          .select('*')
          .eq('channel_id', channel.id)
          .order('published_at', { ascending: false })

        if (error) throw error

        // If no videos in database, use mock data
        if (!data || data.length === 0) {
          const mockVideos: Database['public']['Tables']['youtube_videos']['Row'][] = [
            {
              id: "1",
              channel_id: channel.id,
              thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
              title: "How to Use AI for Content Creation in 2025",
              status: "Published",
              view_count: 12500,
              like_count: 1250,
              comment_count: 320,
              published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              description: "Learn how to leverage AI tools to create better content faster. Discover the latest AI techniques that can transform your content creation workflow.",
              tags: ["AI", "Content Creation", "YouTube", "Tutorial"],
              duration: "PT15M30S",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "2",
              channel_id: channel.id,
              thumbnail_url: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
              title: "10 Tips for Better YouTube SEO",
              status: "Published",
              view_count: 8300,
              like_count: 940,
              comment_count: 215,
              published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              description: "Improve your YouTube search rankings with these proven SEO tips. Boost your channel's visibility and grow your audience.",
              tags: ["SEO", "YouTube", "Growth", "Tips"],
              duration: "PT12M45S",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "3",
              channel_id: channel.id,
              thumbnail_url: "https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg",
              title: "The Ultimate Guide to Video Editing",
              status: "Draft",
              view_count: 0,
              like_count: 0,
              comment_count: 0,
              published_at: null,
              description: "Master video editing with this comprehensive guide for beginners and pros. Learn professional techniques to create stunning videos.",
              tags: ["Video Editing", "Tutorial", "Beginner"],
              duration: "PT20M15S",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ]
                  setVideos(mockVideos)
      } else {
        // Format the database videos to have better data
        const formattedVideos = (data || []).map(video => ({
          ...video,
          title: video.title || "Untitled Video",
          description: video.description ?
            (video.description.length > 100 ? video.description.substring(0, 100) + "..." : video.description) :
            "No description available",
          published_at: video.published_at ?
            (() => {
              try {
                const date = new Date(video.published_at)
                return isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString()
              } catch (error) {
                return "Unknown date"
              }
            })() : "Unknown date",
          view_count: video.view_count || 0,
          like_count: video.like_count || 0,
          comment_count: video.comment_count || 0,
          thumbnail_url: video.thumbnail_url || "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          // Add the fields that VideoCard expects
          views: video.view_count || 0,
          likes: video.like_count || 0,
          comments: video.comment_count || 0,
          publishedAt: video.published_at ? new Date(video.published_at).toLocaleDateString() : "Unknown date"
        }))
        setVideos(formattedVideos)
      }
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [channel?.id, supabase])

  if (isLoading) {
    return <VideosLoading />
  }

  return (
    <div className="container py-6">
      <VideoGrid videos={videos.map(video => ({
        id: video.id,
        thumbnail_url: video.thumbnail_url || '',
        title: video.title,
        status: (video.status === 'Published' || video.status === 'Draft' || video.status === 'Scheduled') ? video.status : 'Published',
        views: video.view_count,
        likes: video.like_count,
        comments: video.comment_count,
        published_at: video.published_at || 'Unknown date',
        publishedAt: video.published_at || 'Unknown date',
        description: video.description || '',
        tags: video.tags || [],
        url: undefined, // or construct a URL if needed
        duration: video.duration || '0'
      }))} />
    </div>
  )
}
