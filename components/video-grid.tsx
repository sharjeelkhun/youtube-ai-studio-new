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
import { useToast } from "@/hooks/use-toast"
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

interface VideoGridProps {
  videos: Video[]
  onVideoDeleted?: () => void
}

export function VideoGrid({ videos, onVideoDeleted }: VideoGridProps) {
  const router = useRouter()
  const { channel } = useYouTubeChannel()
  const { session } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    console.log('Starting video sync...')
    setIsSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/youtube/videos/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to sync videos')
      }

      const result = await response.json()
      console.log('Sync response:', result)

      if (result.success) {
        // Refresh the videos list
        if (onVideoDeleted) {
        onVideoDeleted()
        }
        toast.success(`Successfully synced ${result.videos.length} videos`)
      } else {
        throw new Error(result.error || 'Failed to sync videos')
      }
    } catch (err) {
      console.error('Error in handleSync:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync videos')
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

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">Please log in to view your videos</h2>
        <Button onClick={() => router.push('/login')}>Log In</Button>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">Connect Your YouTube Channel</h2>
        <p className="text-muted-foreground">Connect your YouTube channel to manage your videos</p>
        <Button onClick={() => router.push('/settings')}>Connect Channel</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSync} disabled={isSyncing} className="w-full sm:w-auto">
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Videos
            </>
          )}
        </Button>
      </div>

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
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start by syncing your YouTube videos'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={{
                id: video.id,
                title: video.title,
                description: video.description || '',
                thumbnail_url: video.thumbnail_url || '/placeholder.svg',
                published_at: video.published_at || '',
                view_count: video.views ?? video.view_count ?? 0,
                like_count: video.likes ?? video.like_count ?? 0,
                comment_count: video.comments ?? video.comment_count ?? 0,
                duration: '0:00',
                status: video.status
              }}
              onVideoUpdated={onVideoDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
