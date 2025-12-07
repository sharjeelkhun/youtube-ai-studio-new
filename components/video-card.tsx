"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Eye, MessageSquare, ThumbsUp, ExternalLink, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

import { calculateSeoScore, getScoreColor } from "@/lib/seo-utils"

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
    tags?: string[]
  }
  onVideoUpdated?: () => void
  layout?: 'grid' | 'list'
}

export function VideoCard({ video, onVideoUpdated, layout = 'grid' }: VideoCardProps) {
  const router = useRouter()
  // Calculate SEO Score
  const { score } = calculateSeoScore(video.title, video.description, video.tags || [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'public':
      case 'published':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800'
      case 'private':
        return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800'
      case 'unlisted':
        return 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800'
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800'
    }
  }

  const formatDuration = (duration: string) => {
    if (!duration) return '0:00'
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
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num)
  }

  if (layout === 'list') {
    return (
      <Card
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-border/50 bg-background/60 backdrop-blur-sm hover:bg-background/80 flex flex-col sm:flex-row items-center gap-4 p-4 cursor-pointer"
        onClick={() => router.push(`/videos/${video.id}`)}
      >
        <div className="relative aspect-video w-full sm:w-[240px] shrink-0 rounded-lg overflow-hidden bg-muted">
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute bottom-2 right-2 z-10">
            <span className="bg-black/80 backdrop-blur text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
              {formatDuration(video.duration)}
            </span>
          </div>
          {/* SEO Score Badge for List View */}
          <div className="absolute top-2 left-2 z-10">
            <div className={cn("backdrop-blur-md bg-black/70 shadow-sm px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/10")}>
              <span className={cn("text-[10px] font-bold", getScoreColor(score))}>SEO {score}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2 w-full">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                {video.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                {video.description || "No description"}
              </p>
            </div>
            <Badge variant="outline" className={cn("uppercase text-[10px] tracking-wider px-2 shrink-0", getStatusColor(video.status))}>
              {video.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{video.published_at !== "Unknown date" ? new Date(video.published_at).toLocaleDateString() : "Unknown"}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1" title="Views">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{formatNumber(video.view_count)}</span>
              </div>
              <div className="flex items-center gap-1" title="Likes">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{formatNumber(video.like_count)}</span>
              </div>
              <div className="flex items-center gap-1" title="Comments">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{formatNumber(video.comment_count)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-full sm:w-auto text-xs"
            onClick={(e) => { e.stopPropagation(); router.push(`/videos/${video.id}`); }}
          >
            <Edit2 className="h-3.5 w-3.5 mr-2" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-full sm:w-auto text-xs hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={(e) => { e.stopPropagation(); window.open(`https://youtube.com/watch?v=${video.id}`, '_blank'); }}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-2" />
            Watch
          </Button>
        </div>
      </Card>
    )
  }

  // Grid Layout (Default)
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-border/50 bg-background/60 backdrop-blur-sm">
      <CardHeader className="p-0">
        <div className="relative aspect-video group cursor-pointer" onClick={() => router.push(`/videos/${video.id}`)}>
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Status Badge */}
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="outline" className={cn("backdrop-blur-md bg-background/50 shadow-sm uppercase text-[10px] tracking-wider px-2", getStatusColor(video.status))}>
              {video.status}
            </Badge>
          </div>

          {/* SEO Score Badge - Top Left */}
          <div className="absolute top-2 left-2 z-10">
            <div className={cn("backdrop-blur-md bg-black/70 shadow-sm px-2 py-1 rounded-md flex items-center gap-1.5 border border-white/10 transition-transform group-hover:scale-105")}>
              <span className="text-[10px] font-bold text-white/70">SEO</span>
              <span className={cn("text-xs font-bold", getScoreColor(score))}>{score}</span>
            </div>
          </div>

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 z-10">
            <span className="bg-black/80 backdrop-blur text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
              {formatDuration(video.duration)}
            </span>
          </div>

          {/* Hover Overlay - Watch Only */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
            <Button
              size="sm"
              variant="outline"
              className="h-9 bg-background/20 border-white/20 text-white hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000] transition-colors"
              onClick={(e) => { e.stopPropagation(); window.open(`https://youtube.com/watch?v=${video.id}`, '_blank'); }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Watch
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <h3
            className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
            onClick={() => router.push(`/videos/${video.id}`)}
          >
            {video.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {video.published_at !== "Unknown date" ? new Date(video.published_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "Unknown date"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1" title="Views">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{formatNumber(video.view_count)}</span>
            </div>
            <div className="flex items-center gap-1" title="Likes">
              <ThumbsUp className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{formatNumber(video.like_count)}</span>
            </div>
            <div className="flex items-center gap-1" title="Comments">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{formatNumber(video.comment_count)}</span>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary transition-colors -mr-2"
            onClick={(e) => { e.stopPropagation(); router.push(`/videos/${video.id}`); }}
          >
            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
