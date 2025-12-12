'use client'

import { VideoGrid } from '@/components/video-grid'
import { useEffect, useState, Suspense } from 'react'
import { useYouTubeChannel } from '@/contexts/youtube-channel-context'
import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase/client'
import VideosLoading from './loading'
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
import { LayoutGrid, AlertCircle, RefreshCw, Loader2, Video, List, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { calculateSeoScore } from "@/lib/seo-utils"
import { ConnectChannelHero } from '@/components/connect-channel-hero'

function Videos() {
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
  const [seoFilter, setSeoFilter] = useState<'all' | 'good' | 'average' | 'poor'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [isSyncing, setIsSyncing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes' | 'seo_high' | 'seo_low'>('date')

  const [allVideos, setAllVideos] = useState<Database['public']['Tables']['youtube_videos']['Row'][]>([])
  // We don't use 'videos' state for the source anymore, 'allVideos' is the source.
  // We can derive 'videos' (displayed videos) from the processed list.

  useEffect(() => {
    const fetchVideos = async (silent = false) => {
      if (!channel?.id) {
        setVideosLoading(false);
        return
      }

      // If silent is true, we don't show the loading skeleton
      // This is used for background updates after sync
      if (!silent) setVideosLoading(true)

      try {
        // Fetch ALL videos for the channel to enable accurate client-side filtering/sorting/pagination
        // especially for simulated fields like "SEO Score" which don't exist in DB.
        const { data, error, count } = await supabase
          .from('youtube_videos')
          .select('*', { count: 'exact' })
          .eq('channel_id', channel.id)
          .order('published_at', { ascending: false })
        // No .range() here - we fetch all

        if (error) throw error

        if (!data || data.length === 0) {
          if (channel.id) setShowSyncNotice(true) // Only show if we actually tried a channel
          setAllVideos([])
          setTotalCount(0)
        } else {
          setAllVideos(data)
          setTotalCount(count || 0)
        }
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        if (!silent) setVideosLoading(false)
      }
    }

    // Auto-sync logic remains...
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
      // 1. Fetch local data IMMEDIATELY
      fetchVideos()

      // 2. Trigger sync in background if needed (fire and forget)
      if (shouldAutoSync) {
        console.log('Background syncing videos...')
        fetch('/api/youtube/videos/sync', { method: 'POST' })
          .then(() => {
            console.log('Sync complete, refreshing list...')
            // Silent refresh to update UI with any new videos
            fetchVideos(true)
          })
          .catch((err) => console.error('Background sync failed:', err))
      }
    }
  }, [channel, channelIsLoading, supabase])
  // Removed page/filters from dependency array because we fetch ONCE (or on sync) now.

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

  const handleSync = async () => {
    if (!channel?.id) return
    setIsSyncing(true)
    try {
      const res = await fetch('/api/youtube/videos/sync', { method: 'POST' })
      // ignore body; we refetch list
      await res.json().catch(() => null)
    } catch (e) {
      // noop
    } finally {
      // refetch list
      setShowSyncNotice(false)
      // trigger effect by updating state via a no-op; simplest is to call fetchVideos again, but it's scoped.
      // We can force a reload via window or just simpler re-trigger logic.
      // For now, simpler to reload page content
      window.location.reload()
      setIsSyncing(false)
    }
  }

  // --- Client-Side Processing Pipeline ---

  // 1. Pre-computation (SEO Scores)
  const videosWithSeo = allVideos.map(video => {
    const { score } = calculateSeoScore(video.title, video.description || "", video.tags || [])
    return { ...video, seoScore: score }
  })

  // 2. Filter
  const filteredVideos = videosWithSeo.filter(video => {
    // Robust parsing
    let durationSeconds = 0
    if (video.duration) {
      try {
        const match = video.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
        if (match) {
          const h = parseInt(match[1] || '0', 10)
          const m = parseInt(match[2] || '0', 10)
          const s = parseInt(match[3] || '0', 10)
          durationSeconds = h * 3600 + m * 60 + s
        }
      } catch (e) {
        // Ignore parse errors, default to 0
      }
    }

    const hasShortTag = video.tags?.includes('short')
    // const isDurationShort = durationSeconds > 0 && durationSeconds <= 60 // REMOVED heuristic

    // Definitions
    // STRICT: Only treat as short if explicitly tagged (by our robust sync logic)
    const isShort = hasShortTag
    const isLive = video.tags?.includes('live')
    // A standard video is defined as NOT a short and NOT a live stream
    const isStandardVideo = !isShort && !isLive

    // Apply Type Filter (Inclusive Logic that allows Fallthrough)
    // If a type is selected, we filter OUT items that don't match.
    // We do NOT "return true" immediately, because we still need to check Status and SEO.
    if (typeFilter === 'short') {
      if (!isShort) return false
    } else if (typeFilter === 'live') {
      if (!isLive) return false
    } else if (typeFilter === 'video') {
      if (!isStandardVideo) return false
    }

    // Status Filter
    if (statusFilter !== 'all') {
      const s = (video.status || '').toLowerCase()
      if (s !== statusFilter) return false
    }

    // SEO Filter
    if (seoFilter === 'good' && video.seoScore < 80) return false
    if (seoFilter === 'average' && (video.seoScore < 50 || video.seoScore >= 80)) return false
    if (seoFilter === 'poor' && video.seoScore >= 50) return false

    return true
  })

  // 3. Sort
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return (b.view_count || 0) - (a.view_count || 0)
      case 'likes':
        return (b.like_count || 0) - (a.like_count || 0)
      case 'seo_high':
        return b.seoScore - a.seoScore
      case 'seo_low':
        return a.seoScore - b.seoScore
      default: // date
        return new Date(b.published_at || '').getTime() - new Date(a.published_at || '').getTime()
    }
  })

  // 4. Paginate
  const totalFilteredCount = sortedVideos.length
  const totalPages = Math.ceil(totalFilteredCount / pageSize)
  const paginatedVideos = sortedVideos.slice((page - 1) * pageSize, page * pageSize)

  // Use 'paginatedVideos' for display mapping

  // Helper for status display
  const getDisplayStatus = (status: string | null) => {
    if (!status) return 'Published'
    const s = status.toLowerCase()
    if (s === 'public') return 'Published'
    if (s === 'private') return 'Private'
    if (s === 'unlisted') return 'Unlisted'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (videosLoading) {
    return <VideosLoading />
  }

  if (!channel?.id) {
    return (
      <div className="container py-8 px-4 md:px-6">
        <ConnectChannelHero />
      </div>
    )
  }

  return (
    <div className="container py-8 px-4 md:px-6 space-y-8">
      {/* ... Header ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* ... buttons ... */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Videos</h1>
          <p className="text-muted-foreground">Manage and optimize your YouTube content library</p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
          {isSyncing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Syncing...</> : <><RefreshCw className="mr-2 h-4 w-4" />Sync from YouTube</>}
        </Button>
      </div>

      {/* Alerts - Logic update: check if ALL videos are empty, vs filtered */}
      {showSyncNotice && allVideos.length === 0 && (
        <Alert className="bg-primary/5 border-primary/20">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle>No videos found</AlertTitle>
          <AlertDescription>We couldn't find any videos for your channel. Sync now to import them.</AlertDescription>
        </Alert>
      )}
      {/* ... newCount alert ... */}

      {/* Filters and Controls */}
      <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
        <div className="p-4 flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
          {/* ... Filters JSX (keep exactly as is, state updater handles it) ... */}
          <div className="flex flex-wrap gap-2">
            {['all', 'video', 'short', 'live'].map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { setPage(1); setTypeFilter(type as any); updateUrl({ page: 1, type: type as any }) }}
                className={cn(
                  "capitalize rounded-full px-4",
                  typeFilter === type ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" : "hover:bg-primary/5"
                )}
              >
                {type}
              </Button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:inline-block">Status:</span>
              <Select value={statusFilter} onValueChange={(v) => { const val = v as 'all' | 'public' | 'private' | 'unlisted'; setPage(1); setStatusFilter(val); updateUrl({ page: 1, status: val }) }}>
                <SelectTrigger className="w-[140px] bg-background/50 border-border/60">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="public">Published</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-px h-6 bg-border/60 hidden sm:block" />

            {/* SEO Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:inline-block">SEO:</span>
              <Select value={seoFilter} onValueChange={(v: any) => { setPage(1); setSeoFilter(v) }}>
                <SelectTrigger className="w-[130px] bg-background/50 border-border/60">
                  <SelectValue placeholder="All Scores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="good">Good (80+)</SelectItem>
                  <SelectItem value="average">Average (50-79)</SelectItem>
                  <SelectItem value="poor">Poor (&lt;50)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-px h-6 bg-border/60 hidden sm:block" />

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:inline-block">Sort:</span>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[140px] bg-background/50 border-border/60">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Newest</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="likes">Most Liked</SelectItem>
                  <SelectItem value="seo_high">Highest SEO</SelectItem>
                  <SelectItem value="seo_low">Lowest SEO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* ... View Toggle ... */}
            <div className="w-px h-6 bg-border/60 hidden sm:block" />
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50">
              <Button variant="ghost" size="sm" onClick={() => setViewMode('grid')} className={cn("h-7 w-7 p-0 rounded-md", viewMode === 'grid' ? "bg-background shadow-sm" : "hover:bg-background/50")}> <LayoutGrid className="h-4 w-4" /> </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={cn("h-7 w-7 p-0 rounded-md", viewMode === 'list' ? "bg-background shadow-sm" : "hover:bg-background/50")}> <List className="h-4 w-4" /> </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Content Grid */}
      {paginatedVideos.length === 0 && !videosLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
          {/* Empty State */}
          <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            {allVideos.length === 0 ? (
              <Video className="h-8 w-8 text-muted-foreground/50" />
            ) : (
              <Search className="h-8 w-8 text-muted-foreground/50" />
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {allVideos.length === 0 ? "No videos found" : "No matches found"}
          </h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            {allVideos.length === 0
              ? "We couldn't find any videos for your channel. Sync now to import them."
              : "No videos match your current filters. Try adjusting them."}
          </p>
          {allVideos.length === 0 ? (
            <Button variant="outline" onClick={handleSync}>Sync Channel</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setPage(1)
                setTypeFilter('all')
                setStatusFilter('all')
                setSeoFilter('all')
                setSearchQuery('')
                updateUrl({ page: 1, type: 'all', status: 'all' })
              }}>Clear Filters</Button>
              <Button variant="ghost" onClick={handleSync} className="text-muted-foreground">Force Sync</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <VideoGrid
            viewMode={viewMode}
            videos={paginatedVideos.map(video => ({
              id: video.id,
              thumbnail_url: video.thumbnail_url || '',
              title: video.title,
              status: getDisplayStatus(video.status) as "Published" | "Private" | "Unlisted" | "Draft" | "Scheduled",
              views: video.view_count,
              likes: video.like_count,
              comments: video.comment_count,
              published_at: video.published_at || 'Unknown date',
              publishedAt: video.published_at || 'Unknown date',
              description: video.description || '',
              tags: video.tags || [],
              url: undefined,
              duration: video.duration || '0'
            }))} />

          {/* Pagination */}
          {totalFilteredCount > pageSize && (
            <div className="border-t border-border/40 pt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      className={cn(page <= 1 && 'pointer-events-none opacity-50')}
                      onClick={() => { if (page > 1) { setPage(page - 1); updateUrl({ page: page - 1 }); } }}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4 text-sm font-medium text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      className={cn(page >= totalPages && 'pointer-events-none opacity-50')}
                      onClick={() => { if (page < totalPages) { setPage(page + 1); updateUrl({ page: page + 1 }); } }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
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
