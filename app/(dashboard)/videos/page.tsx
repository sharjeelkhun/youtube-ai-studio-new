'use client'

import { VideoGrid } from '@/components/video-grid'
import { useEffect, useState, Suspense } from 'react'
import { useYouTubeChannel } from '@/contexts/youtube-channel-context'
import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import VideosLoading from './loading'
import { set } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function Videos() {
  const [videos, setVideos] = useState<Database['public']['Tables']['youtube_videos']['Row'][]>([])
  const { channel, isLoading: channelIsLoading } = useYouTubeChannel()
  const [videosLoading, setVideosLoading] = useState(true);
  const [showSyncNotice, setShowSyncNotice] = useState(false);
  const [newCount, setNewCount] = useState<number | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPage = Number(searchParams?.get('page') || '1') || 1
  const initialType = (searchParams?.get('type') as 'all' | 'video' | 'short' | 'live') || 'all'
  const initialStatus = (searchParams?.get('status') as 'all' | 'public' | 'private' | 'unlisted') || 'all'
  const [page, setPage] = useState(initialPage)
  const pageSize = 12
  const [totalCount, setTotalCount] = useState<number>(0)
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'short' | 'live'>(initialType)
  const [statusFilter, setStatusFilter] = useState<'all' | 'public' | 'private' | 'unlisted'>(initialStatus)

  // keep state in sync if URL changes externally
  useEffect(() => {
    const sp = searchParams
    const p = Number(sp?.get('page') || '1') || 1
    const t = (sp?.get('type') as 'all' | 'video' | 'short' | 'live') || 'all'
    const s = (sp?.get('status') as 'all' | 'public' | 'private' | 'unlisted') || 'all'
    if (p !== page) setPage(p)
    if (t !== typeFilter) setTypeFilter(t)
    if (s !== statusFilter) setStatusFilter(s)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const updateUrl = (next: { page?: number, type?: 'all' | 'video' | 'short' | 'live', status?: 'all' | 'public' | 'private' | 'unlisted' }) => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const p = next.page ?? page
    const t = next.type ?? typeFilter
    const s = next.status ?? statusFilter
    params.set('page', String(p))
    params.set('type', t)
    params.set('status', s)
    const query = params.toString()
    router.replace(`/videos${query ? `?${query}` : ''}`)
  }

  useEffect(() => {
    const fetchVideos = async () => {
      if (!channel?.id) {
        setVideosLoading(false);
        return
      }

      try {
        let query = supabase
          .from('youtube_videos')
          .select('*', { count: 'exact' })
          .eq('channel_id', channel.id)
        if (typeFilter === 'short') {
          query = query.contains('tags', ['short'])
        } else if (typeFilter === 'live') {
          query = query.contains('tags', ['live'])
        } else if (typeFilter === 'video') {
          // normal videos: not short, not live
          query = query.not('tags', 'cs', '{short}').not('tags', 'cs', '{live}')
        }
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }
        const { data, error, count } = await query
          .range((page - 1) * pageSize, page * pageSize - 1)
          .order('published_at', { ascending: false })

        if (error) throw error

        // If no videos in database, show sync notice and no mock data
        if (!data || data.length === 0) {
          setShowSyncNotice(true)
          setTotalCount(0)
          setVideos([])
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
          setTotalCount(count || 0)
        }
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setVideosLoading(false)
      }
    }

    const shouldAutoSync = (() => {
      if (!channel?.last_synced) return true
      try {
        const last = new Date(channel.last_synced as unknown as string)
        return Date.now() - last.getTime() > 60 * 60 * 1000 // > 1 hour
      } catch {
        return true
      }
    })()

    if (!channelIsLoading) {
      if (shouldAutoSync) {
        // fire-and-forget; we'll refetch list afterwards
        fetch('/api/youtube/videos/sync', { method: 'POST' }).finally(fetchVideos)
      } else {
        fetchVideos()
      }
    }
  }, [channel, channelIsLoading, supabase, page, typeFilter, statusFilter])

  useEffect(() => {
    let aborted = false
    async function checkNew() {
      if (!channel?.id) return
      try {
        const res = await fetch('/api/youtube/videos/check')
        if (!res.ok) return
        const json = await res.json()
        if (!aborted) setNewCount(typeof json.newCount === 'number' ? json.newCount : 0)
      } catch { }
    }
    if (!channelIsLoading) checkNew()
    return () => { aborted = true }
  }, [channel?.id, channelIsLoading])

  if (videosLoading || channelIsLoading) {
    return <VideosLoading />
  }

  const handleSync = async () => {
    if (!channel?.id) return
    try {
      setVideosLoading(true)
      const res = await fetch('/api/youtube/videos/sync', { method: 'POST' })
      // ignore body; we refetch list
      await res.json().catch(() => null)
    } catch (e) {
      // noop
    } finally {
      // refetch list
      setShowSyncNotice(false)
      // trigger effect by updating state via a no-op; simplest is to call fetchVideos again, but it's scoped.
      // Easiest: force a reload of the page section
      setTimeout(() => {
        // Re-run the effect by toggling loading
        setVideosLoading(false)
      }, 50)
    }
  }

  return (
    <div className="container py-4 px-4 md:py-6 md:px-6">
      {showSyncNotice && (
        <div className="mb-6">
          <Alert>
            <AlertTitle>No videos found in your workspace</AlertTitle>
            <AlertDescription>
              We couldn't find any saved videos for your connected channel. You can still explore with sample videos below, or sync your latest videos now.
            </AlertDescription>
            <div className="mt-4">
              <Button
                onClick={handleSync}
                className="bg-[#FF0000] hover:bg-[#CC0000] text-white"
              >
                Sync videos
              </Button>
            </div>
          </Alert>
        </div>
      )}
      {/* Filters - Premium horizontal layout on desktop, stacked on mobile */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        {/* Type Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-sm font-semibold text-foreground">Type:</span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setPage(1); setTypeFilter('all'); updateUrl({ page: 1, type: 'all' }) }}
              className={typeFilter === 'all' ? 'bg-[#FF0000] hover:bg-[#CC0000] text-white border-[#FF0000]' : 'hover:border-[#FF0000]/30'}
            >
              All
            </Button>
            <Button
              variant={typeFilter === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setPage(1); setTypeFilter('video'); updateUrl({ page: 1, type: 'video' }) }}
              className={typeFilter === 'video' ? 'bg-[#FF0000] hover:bg-[#CC0000] text-white border-[#FF0000]' : 'hover:border-[#FF0000]/30'}
            >
              Videos
            </Button>
            <Button
              variant={typeFilter === 'short' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setPage(1); setTypeFilter('short'); updateUrl({ page: 1, type: 'short' }) }}
              className={typeFilter === 'short' ? 'bg-[#FF0000] hover:bg-[#CC0000] text-white border-[#FF0000]' : 'hover:border-[#FF0000]/30'}
            >
              Shorts
            </Button>
            <Button
              variant={typeFilter === 'live' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setPage(1); setTypeFilter('live'); updateUrl({ page: 1, type: 'live' }) }}
              className={typeFilter === 'live' ? 'bg-[#FF0000] hover:bg-[#CC0000] text-white border-[#FF0000]' : 'hover:border-[#FF0000]/30'}
            >
              Live
            </Button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-sm font-semibold text-foreground">Status:</span>
          <Select value={statusFilter} onValueChange={(v) => { const val = v as 'all' | 'public' | 'private' | 'unlisted'; setPage(1); setStatusFilter(val); updateUrl({ page: 1, status: val }) }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="public">Published</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="unlisted">Unlisted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {!!newCount && newCount > 0 && (
        <div className="mb-4">
          <Alert>
            <AlertTitle>{newCount} new {newCount === 1 ? 'video' : 'videos'} available</AlertTitle>
            <AlertDescription>
              We detected new uploads on your channel. Sync to pull them into your workspace.
            </AlertDescription>
            <div className="mt-4">
              <Button
                onClick={handleSync}
                className="bg-[#FF0000] hover:bg-[#CC0000] text-white"
              >
                Sync now
              </Button>
            </div>
          </Alert>
        </div>
      )}

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
      <div className="mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {(() => {
                const maxPage = Math.max(1, Math.ceil(totalCount / pageSize))
                const isDisabled = page <= 1
                return (
                  <PaginationPrevious
                    className={isDisabled ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      if (isDisabled) return
                      e.preventDefault()
                      setPage(page - 1)
                      updateUrl({ page: page - 1 })
                    }}
                    href={isDisabled ? undefined : '#'}
                  />
                )
              })()}
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 py-2 text-sm text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))}</span>
            </PaginationItem>
            <PaginationItem>
              {(() => {
                const maxPage = Math.max(1, Math.ceil(totalCount / pageSize))
                const isDisabled = page >= maxPage
                return (
                  <PaginationNext
                    className={isDisabled ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      if (isDisabled) return
                      e.preventDefault()
                      setPage(page + 1)
                      updateUrl({ page: page + 1 })
                    }}
                    href={isDisabled ? undefined : '#'}
                  />
                )
              })()}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

export default function VideosPage() {
  return (
    <Suspense fallback={<VideosLoading />}>
      <Videos />
    </Suspense>
  )
}
