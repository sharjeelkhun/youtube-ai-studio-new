"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Edit2, Eye, MessageSquare, ThumbsUp } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Video } from "@/lib/types"

interface VideoCardProps {
  video: Video
}

export function VideoCard({ video }: VideoCardProps) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'public':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
      case 'private':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
      case 'unlisted':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
    }
  }

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return duration

    const hours = (match[1] || '').replace('H', '')
    const minutes = (match[2] || '').replace('M', '')
    const seconds = (match[3] || '').replace('S', '')

    let result = ''
    if (hours) result += `${hours}:`
    result += `${minutes.padStart(2, '0')}:`
    result += seconds.padStart(2, '0')

    return result
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  return (
    <Card className="group overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-video group">
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              <div className="flex items-center gap-2 text-white/90">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{formatDuration(video.duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-white/90 hover:bg-white text-black"
                  onClick={() => router.push(`/videos/${video.id}`)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                  onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                >
                  View on YouTube
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <Badge className={`${getStatusColor(video.status)} backdrop-blur-sm`}>
              {video.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {video.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{formatNumber(video.view_count)} views</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <ThumbsUp className="h-4 w-4" />
            <span>{formatNumber(video.like_count)}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{formatNumber(video.comment_count)}</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date(video.published_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  )
}
