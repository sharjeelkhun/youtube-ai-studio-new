"use client"

import { useState } from "react"
import { Eye, MessageSquare, ThumbsUp, MoreHorizontal, Edit, Trash2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Video } from "@/lib/types"
import { deleteVideo } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface VideoGridProps {
  videos: Video[]
  onVideoDeleted?: () => void
}

export function VideoGrid({ videos, onVideoDeleted }: VideoGridProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null)

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return

    setIsDeleting(true)
    try {
      const success = await deleteVideo(videoToDelete.id)
      if (success) {
        toast({
          title: "Video deleted",
          description: `"${videoToDelete.title}" has been deleted successfully.`,
        })
        if (onVideoDeleted) {
          onVideoDeleted()
        }
      } else {
        throw new Error("Failed to delete video")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem deleting the video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setVideoToDelete(null)
    }
  }

  const handleViewVideo = (videoId: string) => {
    router.push(`/dashboard/videos/${videoId}`)
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden group hover:shadow-md transition-shadow duration-200">
            <div className="aspect-video relative cursor-pointer" onClick={() => handleViewVideo(video.id)}>
              <img
                src={video.thumbnail || "/placeholder.svg"}
                alt={video.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <Badge
                variant={video.status === "Published" ? "default" : video.status === "Draft" ? "secondary" : "outline"}
                className="absolute right-2 top-2"
              >
                {video.status}
              </Badge>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-200"
                >
                  View Details
                </Button>
              </div>
            </div>
            <CardHeader className="p-4 pb-0">
              <div className="flex items-start justify-between">
                <Link href={`/dashboard/videos/${video.id}`} className="hover:underline">
                  <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2 -mt-2 h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/videos/${video.id}?tab=editor`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/videos/${video.id}?tab=analytics`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Analytics
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => setVideoToDelete(video)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-sm text-muted-foreground">
                {video.status === "Published" ? `Published ${video.publishedAt}` : video.publishedAt}
              </p>
            </CardContent>
            {video.status === "Published" && (
              <CardFooter className="flex justify-between border-t p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-sm">
                    <Eye className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    {video.views.toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm">
                    <ThumbsUp className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    {video.likes.toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm">
                    <MessageSquare className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    {video.comments.toLocaleString()}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Promote
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>

      <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Video
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{videoToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVideo}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
