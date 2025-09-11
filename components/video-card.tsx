"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Edit2, Eye, MessageSquare, ThumbsUp } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface VideoCardProps {
  video: {
    id: string
    title: string
    description: string
    thumbnail_url: string
    published_at: string
    view_count: number
    like_count: number
    comment_count: number
    duration: string
    status: string
  }
  onVideoUpdated?: () => void
}

export function VideoCard({ video, onVideoUpdated }: VideoCardProps) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'public':
      case 'published':
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
    // Handle empty or invalid duration
    if (!duration) return '0:00'

    // Parse ISO 8601 duration format (e.g., PT1H2M3S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return '0:00'

    const hours = match[1] ? parseInt(match[1]) : 0
    const minutes = match[2] ? parseInt(match[2]) : 0
    const seconds = match[3] ? parseInt(match[3]) : 0

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
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
              <div className="flex items-center gap-2 flex-wrap justify-start w-full">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-white/90 hover:bg-white text-black flex-shrink-0 text-xs"
                  onClick={() => router.push(`/videos/${video.id}`)}
                >
                  <Edit2 className="h-3 w-3 mr-1.5" />
                  View Details
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white flex-shrink-0 text-xs whitespace-nowrap"
                  onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View on YT
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
          {video.published_at ? 
            (video.published_at === "Invalid Date" || video.published_at === "Unknown date" ? 
              "Unknown date" : 
              video.published_at
            ) : 
            "Unknown date"
          }
        </div>
      </CardContent>
    </Card>
  )
}
