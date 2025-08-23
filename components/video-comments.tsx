"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, MessageSquare, Flag, MoreHorizontal, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Comment {
  id: string
  author: {
    name: string
    avatar: string
    initials: string
  }
  content: string
  timestamp: string
  likes: number
  replies: number
  isLiked: boolean
}

interface VideoCommentsProps {
  videoId: string
}

export function VideoComments({ videoId }: VideoCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Simulate fetching comments
    const fetchComments = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data
        setComments([
          {
            id: "1",
            author: {
              name: "Sarah Johnson",
              avatar: "/placeholder.svg",
              initials: "SJ",
            },
            content: "This video was super helpful! I've been looking for a clear explanation of this topic for ages.",
            timestamp: "2 days ago",
            likes: 24,
            replies: 3,
            isLiked: false,
          },
          {
            id: "2",
            author: {
              name: "Michael Chen",
              avatar: "/placeholder.svg",
              initials: "MC",
            },
            content: "Great content as always! Would love to see a follow-up video on advanced techniques.",
            timestamp: "1 week ago",
            likes: 18,
            replies: 2,
            isLiked: true,
          },
          {
            id: "3",
            author: {
              name: "Alex Rodriguez",
              avatar: "/placeholder.svg",
              initials: "AR",
            },
            content: "I tried implementing this and it worked perfectly. Thanks for the clear instructions!",
            timestamp: "3 days ago",
            likes: 12,
            replies: 0,
            isLiked: false,
          },
        ])
      } catch (error) {
        toast.error("Error", {
          description: "Failed to load comments. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchComments()
  }, [videoId])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Add the new comment to the list
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        author: {
          name: "You",
          avatar: "/placeholder.svg",
          initials: "YO",
        },
        content: newComment,
        timestamp: "Just now",
        likes: 0,
        replies: 0,
        isLiked: false,
      }

      setComments([newCommentObj, ...comments])
      setNewComment("")

      toast.success("Comment added", {
        description: "Your comment has been added successfully.",
      })
    } catch (error) {
      toast.error("Error", {
        description: "Failed to add comment. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleLike = (commentId: string) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          }
        }
        return comment
      }),
    )
  }

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
          <CardTitle>Add a Comment</CardTitle>
      </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit">Post Comment</Button>
            </div>
          </form>
        </CardContent>
      </Card>

          <div className="space-y-4">
            {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback>{comment.author.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{comment.author.name}</span>
                    <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1 ${comment.isLiked ? "text-primary" : ""}`}
                      onClick={() => toggleLike(comment.id)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {comment.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {comment.replies > 0
                        ? `${comment.replies} ${comment.replies === 1 ? "reply" : "replies"}`
                        : "Reply"}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Flag className="h-4 w-4" />
                      Report
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            ))}
          </div>
    </div>
  )
}
