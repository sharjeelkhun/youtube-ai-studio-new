"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Search, SlidersHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VideoGrid } from "@/components/video-grid"
import { EmptyState } from "@/components/empty-state"
import { getVideos } from "@/lib/api"
import type { Video } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function VideosTab() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state for new video
  const [newVideoTitle, setNewVideoTitle] = useState("")
  const [newVideoDescription, setNewVideoDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchVideos = async () => {
    setIsLoading(true)
    try {
      const data = await getVideos(searchQuery, filter)
      setVideos(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load videos. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const handler = setTimeout(() => {
      fetchVideos()
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery, filter])

  const handleCreateVideo = async () => {
    if (!newVideoTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video title",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // In a real app, you would call the API to create a new video
      // For now, we'll just simulate it by adding to our local state
      const newVideo: Video = {
        id: Math.random().toString(36).substring(2, 9),
        thumbnail: "/placeholder.svg",
        title: newVideoTitle,
        description: newVideoDescription,
        status: "Draft",
        views: 0,
        likes: 0,
        comments: 0,
        publishedAt: "N/A",
      }

      setVideos((prev) => [newVideo, ...prev])

      toast({
        title: "Success",
        description: "New video draft created successfully",
      })

      // Reset form and close dialog
      setNewVideoTitle("")
      setNewVideoDescription("")
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search videos..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Video</DialogTitle>
              <DialogDescription>
                Add a new video to your channel. You can edit details and upload the actual video later.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter video title"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter video description"
                  value={newVideoDescription}
                  onChange={(e) => setNewVideoDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleCreateVideo} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex h-[450px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : videos.length > 0 ? (
        <VideoGrid videos={videos} onVideoDeleted={fetchVideos} />
      ) : (
        <EmptyState
          title="No videos found"
          description="Try adjusting your search or filter to find what you're looking for."
          icon={Search}
          action={{
            label: "Create New Video",
            onClick: () => setIsDialogOpen(true),
          }}
        />
      )}
    </div>
  )
}
