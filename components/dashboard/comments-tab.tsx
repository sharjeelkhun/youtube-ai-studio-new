"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CheckCircle, MessageCircle, ThumbsUp, Loader2, Search } from "lucide-react"
import { db } from "@/lib/db"
import { Input } from "@/components/ui/input"

export function CommentsTab({ channelData, isLoading }: { channelData: any; isLoading: boolean }) {
  const [comments, setComments] = useState<any[]>([])
  const [filteredComments, setFilteredComments] = useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchComments() {
      setIsLoadingComments(true)
      try {
        if (channelData?.id) {
          // In a real app, you would fetch comments for all videos
          // For now, we'll use mock data
          const mockComments = await db.comments.getRecentComments(channelData.id, 20)
          setComments(mockComments)
          setFilteredComments(mockComments)
        }
      } catch (error) {
        console.error("Error fetching comments:", error)
      } finally {
        setIsLoadingComments(false)
      }
    }

    if (channelData) {
      fetchComments()
    }
  }, [channelData])

  // Apply search filter when search query changes
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = comments.filter(
        (comment) => comment.content.toLowerCase().includes(query) || comment.author.toLowerCase().includes(query),
      )
      setFilteredComments(filtered)
    } else {
      setFilteredComments(comments)
    }
  }, [comments, searchQuery])

  if (isLoading || isLoadingComments) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Recent Comments</CardTitle>
          <CardDescription>Manage and respond to comments on your videos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search comments..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredComments.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">No comments found</p>
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="hidden md:table-cell">Video</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={comment.avatar || "/placeholder.svg?height=32&width=32"}
                            alt={comment.author}
                          />
                          <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{comment.author}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {comment.likes} ·{" "}
                            {typeof comment.timestamp === "string"
                              ? comment.timestamp
                              : new Date(comment.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate">{comment.content}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {comment.videoTitle || "Video " + comment.video_id}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {comment.responded ? (
                          <Button size="sm" variant="ghost" className="text-green-500" disabled>
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Responded
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            <MessageCircle className="mr-1 h-4 w-4" />
                            Reply
                          </Button>
                        )}
                      </div>
                    </TableCell>
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
