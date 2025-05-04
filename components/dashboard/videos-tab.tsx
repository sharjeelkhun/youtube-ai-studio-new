"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, Filter, MoreHorizontal } from "lucide-react"

export function VideosTab() {
  // Sample data
  const videos = [
    {
      id: "1",
      title: "How to Build a Next.js App",
      views: 12543,
      likes: 1243,
      comments: 89,
      publishedAt: "2023-05-15",
    },
    {
      id: "2",
      title: "React Server Components Explained",
      views: 8765,
      likes: 765,
      comments: 54,
      publishedAt: "2023-06-02",
    },
    {
      id: "3",
      title: "Building a Dashboard with Tailwind CSS",
      views: 6543,
      likes: 543,
      comments: 32,
      publishedAt: "2023-06-18",
    },
    {
      id: "4",
      title: "TypeScript Tips and Tricks",
      views: 4321,
      likes: 321,
      comments: 21,
      publishedAt: "2023-07-05",
    },
    {
      id: "5",
      title: "State Management in 2023",
      views: 3210,
      likes: 210,
      comments: 15,
      publishedAt: "2023-07-22",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search videos..." className="pl-8" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="default" size="sm">
            Upload Video
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Likes</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Comments</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell className="font-medium">{video.title}</TableCell>
                <TableCell className="hidden md:table-cell">{video.publishedAt}</TableCell>
                <TableCell className="text-right">{video.views.toLocaleString()}</TableCell>
                <TableCell className="hidden sm:table-cell text-right">{video.likes.toLocaleString()}</TableCell>
                <TableCell className="hidden sm:table-cell text-right">{video.comments.toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
