"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function CommentsTab() {
  // Sample data
  const comments = [
    {
      id: "1",
      author: "Alex Johnson",
      authorAvatar: "",
      comment: "This video was super helpful! I've been struggling with Next.js routing for days.",
      video: "How to Build a Next.js App",
      date: "2023-07-25",
      likes: 24,
    },
    {
      id: "2",
      author: "Sam Wilson",
      authorAvatar: "",
      comment: "Great explanation of server components. Finally understand the difference!",
      video: "React Server Components Explained",
      date: "2023-07-24",
      likes: 18,
    },
    {
      id: "3",
      author: "Jamie Smith",
      authorAvatar: "",
      comment: "Your dashboard tutorials are always so clear and easy to follow.",
      video: "Building a Dashboard with Tailwind CSS",
      date: "2023-07-23",
      likes: 15,
    },
    {
      id: "4",
      author: "Taylor Brown",
      authorAvatar: "",
      comment: "I've been using TypeScript wrong this whole time! Thanks for the tips.",
      video: "TypeScript Tips and Tricks",
      date: "2023-07-22",
      likes: 12,
    },
    {
      id: "5",
      author: "Jordan Lee",
      authorAvatar: "",
      comment: "Zustand vs Redux comparison was exactly what I needed. Great content!",
      video: "State Management in 2023",
      date: "2023-07-21",
      likes: 9,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search comments..." className="pl-8" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border p-4">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={comment.authorAvatar} alt={comment.author} />
                <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{comment.author}</span>
                    <span className="text-xs text-muted-foreground"> on </span>
                    <span className="text-sm font-medium text-muted-foreground">{comment.video}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{comment.date}</span>
                </div>
                <p className="text-sm">{comment.comment}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{comment.likes} likes</span>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-normal">
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
