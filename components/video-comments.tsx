"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, MessageSquare, Flag, MoreHorizontal, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export function VideoComments({ videoId }: { videoId: string }) {
  const { toast } = useToast()
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
        toast({
          title: "Error",
          description: "Failed to load comments. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchComments()
  }, [videoId, toast])

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

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
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
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg" alt="Your avatar" />
            <AvatarFallback>YO</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Comment"
                )}
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 pt-4 border-t">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                  <AvatarFallback>{comment.author.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{comment.author.name}</p>
                      <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-sm">{comment.content}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 ${comment.isLiked ? "text-primary" : ""}`}
                      onClick={() => toggleLike(comment.id)}
                    >
                      <ThumbsUp className="mr-1 h-4 w-4" />
                      {comment.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <MessageSquare className="mr-1 h-4 w-4" />
                      {comment.replies > 0
                        ? `${comment.replies} ${comment.replies === 1 ? "reply" : "replies"}`
                        : "Reply"}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Flag className="mr-1 h-4 w-4" />
                      Report
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
