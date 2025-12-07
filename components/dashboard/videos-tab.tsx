"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, ThumbsUp, MessageSquare, Loader2, Search, Filter, MoreHorizontal, Sparkles, Image as ImageIcon, Video as VideoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Video, YouTubeChannel } from "@/lib/db"

interface VideosTabProps {
  channelData: YouTubeChannel | null
  isLoading: boolean
}

export function VideosTab({ channelData, isLoading }: VideosTabProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchVideos = async () => {
    console.log('Fetching videos for channel:', channelData?.id)
    setIsLoadingVideos(true)
    setError(null)

    try {
      if (channelData?.id) {
        const { data: videosData, error: videosError } = await supabase
          .from('youtube_videos')
          .select('*')
          .eq('channel_id', channelData.id)
          .order('published_at', { ascending: false })

        if (videosError) {
          throw videosError
        }

        setVideos(videosData || [])
        setFilteredVideos(videosData || [])
      }
    } catch (err) {
      console.error('Unexpected error fetching videos:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch videos'))
    } finally {
      setIsLoadingVideos(false)
    }
  }

  const handleSync = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/youtube/videos/sync', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to sync videos')
      }

      await fetchVideos()
    } catch (err) {
      console.error('Error syncing videos:', err)
      setError(err instanceof Error ? err : new Error('Failed to sync videos'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (channelData?.id) {
      fetchVideos()
    }
  }, [channelData?.id])

  // Apply filters when search query or status filter changes
  useEffect(() => {
    let filtered = [...videos]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (video) =>
          video.title.toLowerCase().includes(query) ||
          (video.description && video.description.toLowerCase().includes(query))
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((video) => video.status === statusFilter)
    }

    setFilteredVideos(filtered)
  }, [videos, searchQuery, statusFilter])

  // Format numbers with commas
  const formatNumber = (num: number | string | null | undefined) => {
    if (num === null || num === undefined) return "0"
    if (Number(num) >= 1000000) return `${(Number(num) / 1000000).toFixed(1)}M`
    if (Number(num) >= 1000) return `${(Number(num) / 1000).toFixed(1)}K`
    return Number(num).toLocaleString()
  }

  // Calculate generic max values for progress bars (avoiding 0 division)
  const maxViews = Math.max(...videos.map(v => v.view_count || 0), 1)
  const maxLikes = Math.max(...videos.map(v => v.like_count || 0), 1)

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Handle video click
  const handleVideoClick = (videoId: string) => {
    router.push(`/videos/${videoId}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-400">Error Loading Videos</CardTitle>
          <CardDescription className="text-red-600/80 dark:text-red-400/80">{error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchVideos} variant="outline" className="border-red-200 hover:bg-red-100 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-900/50">
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-background/60 backdrop-blur-xl shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">Content Library</CardTitle>
            <CardDescription>Manage your video performance and optimization</CardDescription>
          </div>
          <Button onClick={handleSync} disabled={loading} size="sm" className="bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync from YouTube'
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] bg-background/50 border-border/50">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="public">Published</SelectItem>
                  <SelectItem value="private">Draft</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingVideos ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-xl bg-card/50">
                  <Skeleton className="h-16 w-28 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/5 p-8 text-center animate-in fade-in-50">
              <div className="rounded-full bg-muted p-4 mb-4">
                <VideoIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium text-foreground">No videos found</p>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                {searchQuery ? "Try adjusting your search or filters to find what you're looking for." : "Sync your channel to get started with AI analysis."}
              </p>
              {(searchQuery || statusFilter !== "all") && (
                <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 overflow-hidden bg-background/40">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[400px]">Video</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">Views</TableHead>
                    <TableHead className="w-[150px]">Likes</TableHead>
                    <TableHead className="text-right">Published</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVideos.map((video) => (
                    <TableRow
                      key={video.id}
                      className="group cursor-pointer hover:bg-muted/40 transition-colors border-border/40"
                      onClick={() => handleVideoClick(video.id)}
                    >
                      <TableCell>
                        <div className="flex gap-4">
                          <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted shadow-sm">
                            {video.thumbnail_url ? (
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted">
                                <VideoIcon className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col justify-center gap-1 min-w-0">
                            <span className="font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                              {video.title}
                            </span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {video.description || "No description"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border ${video.status === "public"
                            ? "bg-green-500/10 text-green-700 border-green-200 dark:border-green-900/50 dark:text-green-400"
                            : video.status === "private"
                              ? "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                              : "bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:border-yellow-900/50 dark:text-yellow-400"
                            }`}
                        >
                          {video.status === "public" ? "Published" : video.status === "private" ? "Draft" : "Unlisted"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{formatNumber(video.view_count)}</span>
                          </div>
                          <Progress
                            value={((video.view_count || 0) / maxViews) * 100}
                            className="h-1.5 w-full bg-muted"
                          // Using custom css variable for color or utility class if Progress supports it, usually expects value
                          />
                          {/* Note: Shadcn Progress doesn't easily support custom indicator color via props, usually via class. 
                               We can wrap it or just rely on Primary color */}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{formatNumber(video.like_count)}</span>
                          </div>
                          <Progress
                            value={((video.like_count || 0) / maxLikes) * 100}
                            className="h-1.5 w-full bg-muted"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatDate(video.published_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/videos/${video.id}/analyze`) }}>
                              <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                              AI Analyze
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Handle thumbnail gen */ }}>
                              <ImageIcon className="mr-2 h-4 w-4 text-blue-500" />
                              Gen Thumbnail
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`https://youtube.com/watch?v=${video.id}`, '_blank') }}>
                              View on YouTube
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
