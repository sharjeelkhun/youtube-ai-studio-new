"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, ThumbsUp, MessageSquare, Loader2, Search, Filter } from "lucide-react"
import { db, type Video, type YouTubeChannel } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

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

  useEffect(() => {
    async function fetchVideos() {
      setIsLoadingVideos(true)
      try {
        if (channelData?.id) {
          const videosData = await db.videos.getByChannelId(channelData.id)
          setVideos(videosData)
          setFilteredVideos(videosData)
        }
      } catch (error) {
        console.error("Error fetching videos:", error)
      } finally {
        setIsLoadingVideos(false)
      }
    }

    if (channelData) {
      fetchVideos()
    }
  }, [channelData])

  // Apply filters when search query or status filter changes
  useEffect(() => {
    let filtered = [...videos]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (video) =>
          video.title.toLowerCase().includes(query) ||
          (video.description && video.description.toLowerCase().includes(query)),
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

  if (isLoading || isLoadingVideos) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading videos...</p>
        </div>
      </div>
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
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredVideos.length === 0 ? (
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
                <p className="text-xs text-muted-foreground mt-2">
                  Connect your YouTube channel to see your videos here
                </p>
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
                    <TableCell className="text-right">{formatNumber(video.views)}</TableCell>
                    <TableCell className="hidden md:table-cell text-right">{formatNumber(video.likes)}</TableCell>
                    <TableCell className="hidden md:table-cell text-right">{formatNumber(video.comments)}</TableCell>
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
