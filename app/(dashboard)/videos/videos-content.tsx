'use client'

import { VideoGrid } from '@/components/video-grid'
import { useEffect, useState } from 'react'
import { useYouTubeChannel } from '@/contexts/youtube-channel-context'
import { useSubscription } from '@/contexts/subscription-context'
import { useProfile } from '@/contexts/profile-context'
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

export function VideosContent() {
    const { channel, isLoading: channelIsLoading } = useYouTubeChannel()
    const { isPro, isEnterprise } = useSubscription()
    const { profile, loading: profileLoading } = useProfile()
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

    // Derive personal key status directly from context for immediate UI response
    const hasPersonalKey = !!(profile?.youtube_api_key || profile?.ai_settings?.apiKeys?.gemini)

    useEffect(() => {
        const fetchVideos = async (silent = false) => {
            if (!channel?.id) {
                setVideosLoading(false);
                return
            }

            if (!silent) setVideosLoading(true)

            try {
                console.log('[VideosContent] Recalculating limit:', {
                    youtube_key: !!profile?.youtube_api_key,
                    gemini_key: !!profile?.ai_settings?.apiKeys?.gemini,
                    limit: hasPersonalKey ? 25 : 5
                })

                const { data, error } = await supabase
                    .from('youtube_videos')
                    .select('*', { count: 'exact' })
                    .eq('channel_id', channel.id)
                    .order('published_at', { ascending: false })

                if (error) throw error

                let displayedVideos = data || []

                if (!isPro && !isEnterprise) {
                    const limit = hasPersonalKey ? 25 : 5
                    if (displayedVideos.length > limit) {
                        displayedVideos = displayedVideos.slice(0, limit)
                    }
                }

                if (!displayedVideos || displayedVideos.length === 0) {
                    if (channel.id) setShowSyncNotice(true)
                    setAllVideos([])
                    setTotalCount(0)
                } else {
                    setAllVideos(displayedVideos)
                    setTotalCount(displayedVideos.length)
                }
            } catch (error) {
                console.error('Error fetching videos:', error)
            } finally {
                if (!silent) setVideosLoading(false)
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

        if (!channelIsLoading && !profileLoading) {
            fetchVideos()

            if (shouldAutoSync) {
                console.log('Background syncing videos...')
                fetch('/api/youtube/videos/sync', { method: 'POST' })
                    .then(() => {
                        console.log('Sync complete, refreshing list...')
                        fetchVideos(true)
                    })
                    .catch((err) => console.error('Background sync failed:', err))
            }
        }
    }, [channel, channelIsLoading, isPro, isEnterprise, profile, profileLoading])

    useEffect(() => {
        const sp = searchParams
        const p = Number(sp?.get('page') || '1') || 1
        const t = (sp?.get('type') as 'all' | 'video' | 'short' | 'live') || 'all'
        const s = (sp?.get('status') as 'all' | 'public' | 'private' | 'unlisted') || 'all'
        if (p !== page) setPage(p)
        if (t !== typeFilter) setTypeFilter(t)
        if (s !== statusFilter) setStatusFilter(s)
    }, [searchParams, page, typeFilter, statusFilter])

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
            await res.json().catch(() => null)
        } catch (e) {
        } finally {
            setShowSyncNotice(false)
            window.location.reload()
            setIsSyncing(false)
        }
    }

    const videosWithSeo = allVideos.map(video => {
        const { score } = calculateSeoScore(video.title, video.description || "", video.tags || [])
        return { ...video, seoScore: score }
    })

    const filteredVideos = videosWithSeo.filter(video => {
        const isShort = video.tags?.includes('short')
        const isLive = video.tags?.includes('live')
        const isStandardVideo = !isShort && !isLive

        if (typeFilter === 'short') {
            if (!isShort) return false
        } else if (typeFilter === 'live') {
            if (!isLive) return false
        } else if (typeFilter === 'video') {
            if (!isStandardVideo) return false
        }

        if (statusFilter !== 'all') {
            const s = (video.status || '').toLowerCase()
            if (s !== statusFilter) return false
        }

        if (seoFilter === 'good' && video.seoScore < 80) return false
        if (seoFilter === 'average' && (video.seoScore < 50 || video.seoScore >= 80)) return false
        if (seoFilter === 'poor' && video.seoScore >= 50) return false

        return true
    })

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
            default:
                return new Date(b.published_at || '').getTime() - new Date(a.published_at || '').getTime()
        }
    })

    const totalFilteredCount = sortedVideos.length
    const totalPages = Math.ceil(totalFilteredCount / pageSize)
    const paginatedVideos = sortedVideos.slice((page - 1) * pageSize, page * pageSize)

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Videos</h1>
                    <p className="text-muted-foreground">Manage and optimize your YouTube content library</p>
                </div>
                <Button onClick={handleSync} disabled={isSyncing} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
                    {isSyncing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Syncing...</> : <><RefreshCw className="mr-2 h-4 w-4" />Sync from YouTube</>}
                </Button>
            </div>

            {showSyncNotice && allVideos.length === 0 && (
                <Alert className="bg-primary/5 border-primary/20">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertTitle>No videos found</AlertTitle>
                    <AlertDescription>We couldn't find any videos for your channel. Sync now to import them.</AlertDescription>
                </Alert>
            )}

            <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm border-x-0 sm:border-x rounded-none sm:rounded-2xl">
                <div className="p-3 sm:p-4 space-y-4">
                    {/* Header & Main Actions */}
                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                        <div className="flex gap-1.5 min-w-max">
                            {['all', 'video', 'short', 'live'].map((type) => (
                                <Button
                                    key={type}
                                    variant={typeFilter === type ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => { setPage(1); setTypeFilter(type as any); updateUrl({ page: 1, type: type as any }) }}
                                    className={cn(
                                        "capitalize rounded-xl px-4 h-9 min-w-[70px] transition-all duration-200",
                                        typeFilter === type ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-primary/5 text-muted-foreground"
                                    )}
                                >
                                    {type}
                                </Button>
                            ))}
                        </div>
                        <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/50 h-9 min-w-max">
                            <Button variant="ghost" size="sm" onClick={() => setViewMode('grid')} className={cn("h-7 w-9 p-0 rounded-md", viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "hover:bg-background/40 text-muted-foreground")}> <LayoutGrid className="h-4 w-4" /> </Button>
                            <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={cn("h-7 w-9 p-0 rounded-md", viewMode === 'list' ? "bg-background shadow-sm text-primary" : "hover:bg-background/40 text-muted-foreground")}> <List className="h-4 w-4" /> </Button>
                        </div>
                    </div>

                    {/* Refined Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <div className="grid grid-cols-3 gap-2 w-full">
                            <Select value={statusFilter} onValueChange={(v) => { const val = v as 'all' | 'public' | 'private' | 'unlisted'; setPage(1); setStatusFilter(val); updateUrl({ page: 1, status: val }) }}>
                                <SelectTrigger className="w-full h-9 bg-background/50 border-border/60 rounded-xl text-[13px] px-3">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="public">Published</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="unlisted">Unlisted</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={seoFilter} onValueChange={(v: any) => { setPage(1); setSeoFilter(v) }}>
                                <SelectTrigger className="w-full h-9 bg-background/50 border-border/60 rounded-xl text-[13px] px-3">
                                    <SelectValue placeholder="SEO" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All SEO</SelectItem>
                                    <SelectItem value="good">Good (80+)</SelectItem>
                                    <SelectItem value="average">Average</SelectItem>
                                    <SelectItem value="poor">Poor</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                <SelectTrigger className="w-full h-9 bg-background/50 border-border/60 rounded-xl text-[13px] px-3">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">Newest</SelectItem>
                                    <SelectItem value="views">Views</SelectItem>
                                    <SelectItem value="likes">Likes</SelectItem>
                                    <SelectItem value="seo_high">Best SEO</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </Card>

            {paginatedVideos.length === 0 && !videosLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
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
                            status: getDisplayStatus(video.status) as any,
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

                    {!isPro && !isEnterprise && allVideos.length > 0 && (
                        <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm shadow-sm p-6 mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="space-y-1 text-center md:text-left">
                                <h3 className="text-lg font-semibold text-foreground">
                                    {hasPersonalKey ? "Personal API Key Active" : "Want to see more videos?"}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-lg">
                                    {hasPersonalKey
                                        ? "Your personal API key allows syncing up to 25 videos. Upgrade to Professional for unlimited access and advanced AI tools."
                                        : "Free plans are limited to the most recent 5 videos. Connect your own YouTube API key to sync up to 25 videos, or upgrade to Professional for unlimited access."
                                    }
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {!hasPersonalKey && (
                                    <Button variant="outline" onClick={() => router.push('/settings?tab=integrations')}>
                                        Add API Key
                                    </Button>
                                )}
                                <Button onClick={() => router.push('/settings?tab=billing')} className="bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all shadow-lg shadow-primary/20">
                                    Upgrade to Pro
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
