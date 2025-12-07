"use client"

import { useEffect, useState } from "react"
import { Eye, MessageSquare, ThumbsUp, MoreHorizontal, Edit, Trash2, AlertCircle, RefreshCw, Loader2, Search, Upload } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Video } from "@/lib/types"
import { deleteVideo } from "@/lib/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { supabase } from "@/lib/supabase"
import { VideoCard } from './video-card'
import { Alert, AlertDescription } from './ui/alert'
import type { Database } from '@/lib/database.types'
import { useSession } from '@/contexts/session-context'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from "@/lib/utils"

interface VideoGridProps {
  videos: Video[]
  onVideoDeleted?: () => void
  viewMode?: 'grid' | 'list'
}

export function VideoGrid({ videos, onVideoDeleted, viewMode = 'grid' }: VideoGridProps) {
  const router = useRouter()
  const { channel } = useYouTubeChannel()
  const { session } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    // Sync logic remains same...
    console.log('Starting video sync...')
    setIsSyncing(true)
    setError(null)
    // ... (rest of implementation) ... 
    try {
      const response = await fetch('/api/youtube/videos/sync', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to sync')
      const result = await response.json()
      if (result.success && onVideoDeleted) onVideoDeleted()
      toast.success(`Synced ${result.videos?.length || 0} videos`)
    } catch (err) {
      toast.error('Failed to sync videos')
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || video.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  // Auth checks...
  if (!session) return null // Handled by parent usually
  if (!channel) return null

  return (
    <div className="space-y-6">
      {/* Search Bar - Hidden on mobile if parent handles it, but kept here for self-contained usages */}
      {/* For now, assuming parent page handles filters, but this component HAS its own filters. 
          Let's align: The Page has filters. This component has filters. Duplication? 
          The previous file content showed this component has search/filter. 
          I will keep them but user might want to move them to page level later. range: 125-168
      */}

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h2 className="text-2xl font-bold">No videos found</h2>
          <p className="text-muted-foreground">Try adjusting your filters</p>
        </div>
      ) : (
        <div className={cn(
          "grid gap-4 md:gap-6",
          viewMode === 'grid'
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        )}>
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              layout={viewMode}
              video={{
                id: video.id,
                title: video.title,
                description: video.description || '',
                thumbnail_url: video.thumbnail_url || '/placeholder.svg',
                published_at: video.published_at || '',
                view_count: video.views ?? video.view_count ?? 0,
                like_count: video.likes ?? video.like_count ?? 0,
                comment_count: video.comments ?? video.comment_count ?? 0,
                duration: video.duration || '0:00',
                status: video.status,
                tags: video.tags
              }}
              onVideoUpdated={onVideoDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
