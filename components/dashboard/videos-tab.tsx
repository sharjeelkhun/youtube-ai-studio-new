"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, ThumbsUp, MessageSquare, Loader2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { YouTubeChannel } from "@/lib/db"
import { getVideos } from "@/lib/api"
import { type Video } from "@/lib/types"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"

interface VideosTabProps {}

export function VideosTab({}: VideosTabProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()
  const [error, setError] = useState<Error | null>(null)
  const { channel, isLoading } = useYouTubeChannel()

  const fetchVideos = async () => {
    if (!channel) return
    setIsLoadingVideos(true)
    setError(null)
    try {
      const videosData = await getVideos(
        channel.access_token,
        searchQuery,
        statusFilter
      )
      setVideos(videosData)
      setFilteredVideos(videosData)
    } catch (err) {
      console.error("Error fetching videos:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch videos"))
    } finally {
      setIsLoadingVideos(false)
    }
  }

  const handleSync = async () => {
    setIsLoadingVideos(true)
    try {
      await fetch("/api/youtube/videos/sync", { method: "POST" })
      await fetchVideos()
    } catch (err) {
      console.error("Error syncing videos:", err)
      setError(err instanceof Error ? err : new Error("Failed to sync videos"))
    } finally {
      setIsLoadingVideos(false)
    }
  }

  useEffect(() => {
    if (channel) {
      fetchVideos()
    }
  }, [channel, searchQuery, statusFilter])

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
    return Number(num).toLocaleString()
  }

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  // Handle video click
  const handleVideoClick = (videoId: string) => {
    router.push(`/dashboard/videos/${videoId}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-full sm:w-[180px]" />
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-16" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="hidden h-4 w-12 md:block" />
                  <Skeleton className="hidden h-4 w-12 md:block" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchVideos}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Videos</CardTitle>
          <CardDescription>Manage and analyze your YouTube videos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Videos</SelectItem>
                  <SelectItem value="public">Published</SelectItem>
                  <SelectItem value="private">Draft</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingVideos ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-16" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="hidden h-4 w-12 md:block" />
                  <Skeleton className="hidden h-4 w-12 md:block" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">No videos found</p>
              {searchQuery || statusFilter !== "all" ? (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-4">
                    Click "Sync Videos" to fetch your videos from YouTube
                </p>
                  <Button onClick={handleSync} disabled={isLoadingVideos}>
                    {isLoadingVideos ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      'Sync Videos'
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end">
                      <Eye className="mr-1 h-4 w-4" />
                      Views
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-right">
                    <div className="flex items-center justify-end">
                      <ThumbsUp className="mr-1 h-4 w-4" />
                      Likes
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-right">
                    <div className="flex items-center justify-end">
                      <MessageSquare className="mr-1 h-4 w-4" />
                      Comments
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map((video) => (
                  <TableRow
                    key={video.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleVideoClick(video.id)}
                  >
                    <TableCell className="font-medium">{video.title}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          video.status === "Published"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : video.status === "Draft"
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {video.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(video.view_count)}</TableCell>
                    <TableCell className="hidden md:table-cell text-right">{formatNumber(video.like_count)}</TableCell>
                    <TableCell className="hidden md:table-cell text-right">{formatNumber(video.comment_count)}</TableCell>
                    <TableCell className="text-right">{formatDate(video.published_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
