"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getVideo } from "@/lib/api"
import type { Video } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, Edit, Eye, MessageSquare, Share2, ThumbsUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { VideoComments } from "@/components/video-comments"
import { VideoAnalytics } from "@/components/video-analytics"
import { VideoEditor } from "@/components/video-editor"

export default function VideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [video, setVideo] = useState<Video | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVideo = async () => {
      if (params.id) {
        try {
          const data = await getVideo(params.id as string)
          setVideo(data)
        } catch (error) {
          console.error("Failed to fetch video:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchVideo()
  }, [params.id])

  if (isLoading) {
    return <VideoDetailSkeleton />
  }

  if (!video) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">Video not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="default" size="sm">
            <Edit className="mr-2 h-4 w-4" /> Edit Video
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
            <img src={video.thumbnail || video.thumbnail_url || "/placeholder.svg"} alt={video.title} className="h-full w-full object-cover" />
          </div>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{video.title}</CardTitle>
                <CardDescription className="mt-2 flex items-center gap-3">
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    {video.publishedAt || video.published_at}
                  </span>
                  <Badge variant={video.status === "Published" ? "default" : "secondary"}>{video.status}</Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{video.description || "No description provided."}</p>

            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">{(video.views || video.view_count || 0).toLocaleString()}</div>
                <div className="mt-1 flex items-center justify-center text-xs text-muted-foreground">
                  <Eye className="mr-1 h-3 w-3" /> Views
                </div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">{(video.likes || video.like_count || 0).toLocaleString()}</div>
                <div className="mt-1 flex items-center justify-center text-xs text-muted-foreground">
                  <ThumbsUp className="mr-1 h-3 w-3" /> Likes
                </div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">{(video.comments || video.comment_count || 0).toLocaleString()}</div>
                <div className="mt-1 flex items-center justify-center text-xs text-muted-foreground">
                  <MessageSquare className="mr-1 h-3 w-3" /> Comments
                </div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">4:32</div>
                <div className="mt-1 flex items-center justify-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" /> Duration
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 font-medium">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {video.tags?.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                )) || <span className="text-sm text-muted-foreground">No tags</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Eye className="mr-2 h-4 w-4" /> View on YouTube
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Edit className="mr-2 h-4 w-4" /> Edit Metadata
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <ThumbsUp className="mr-2 h-4 w-4" /> Promote Video
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>View-to-Subscriber Ratio</span>
                    <span className="font-medium">25.8%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "25.8%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>Engagement Rate</span>
                    <span className="font-medium">12.4%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "12.4%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>Retention Rate</span>
                    <span className="font-medium">42.7%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "42.7%" }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics" className="mt-4">
          <VideoAnalytics videoId={video.id} />
        </TabsContent>
        <TabsContent value="comments" className="mt-4">
          <VideoComments videoId={video.id} />
        </TabsContent>
        <TabsContent value="editor" className="mt-4">
          <VideoEditor video={video} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function VideoDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Button variant="ghost" disabled className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
