"use client"

import { useState } from "react"
import { Eye, MessageSquare, ThumbsUp, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { useRouter } from "next/navigation"

const recentVideos = [
  {
    id: "1",
    thumbnail: "/placeholder.svg",
    title: "How to Use AI for Content Creation in 2025",
    status: "Published",
    views: 12500,
    likes: 1250,
    comments: 320,
    publishedAt: "2 days ago",
  },
  {
    id: "2",
    thumbnail: "/placeholder.svg",
    title: "10 Tips for Better YouTube SEO",
    status: "Published",
    views: 8300,
    likes: 940,
    comments: 215,
    publishedAt: "1 week ago",
  },
  {
    id: "3",
    thumbnail: "/placeholder.svg",
    title: "The Ultimate Guide to Video Editing",
    status: "Draft",
    views: 0,
    likes: 0,
    comments: 0,
    publishedAt: "N/A",
  },
  {
    id: "4",
    thumbnail: "/placeholder.svg",
    title: "Why You Should Start a YouTube Channel in 2025",
    status: "Published",
    views: 5200,
    likes: 620,
    comments: 145,
    publishedAt: "2 weeks ago",
  },
]

export function RecentVideos() {
  const [videos, setVideos] = useState(recentVideos)
  const router = useRouter()

  const handleViewVideo = (videoId: string) => {
    router.push(`/dashboard/videos/${videoId}`)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Video</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Views</TableHead>
          <TableHead className="hidden md:table-cell">Engagement</TableHead>
          <TableHead className="hidden md:table-cell">Published</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {videos.map((video) => (
          <TableRow key={video.id} className="group hover:bg-muted/50">
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-20 rounded-sm cursor-pointer" onClick={() => handleViewVideo(video.id)}>
                  <AvatarImage src={video.thumbnail} alt={video.title} className="object-cover" />
                  <AvatarFallback className="rounded-sm">{video.title.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <Link href={`/dashboard/videos/${video.id}`} className="font-medium hover:underline">
                  {video.title}
                </Link>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={video.status === "Published" ? "default" : "secondary"}>{video.status}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">{video.views.toLocaleString()}</TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-sm">
                  <ThumbsUp className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  {video.likes.toLocaleString()}
                </div>
                <div className="flex items-center text-sm">
                  <MessageSquare className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  {video.comments.toLocaleString()}
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">{video.publishedAt}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/videos/${video.id}?tab=editor`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/videos/${video.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Analytics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
