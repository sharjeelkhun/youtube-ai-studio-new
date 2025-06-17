import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useYouTubeChannel } from '@/contexts/youtube-channel-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Filter } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface Video {
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

export function VideoGrid() {
  const router = useRouter()
  const { channel, loading: channelLoading } = useYouTubeChannel()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('VideoGrid mounted, fetching videos...')
    fetchVideos()
  }, [channel?.id])

  const fetchVideos = async () => {
    console.log('Fetching videos...')
    if (!channel?.id) {
      console.log('No channel connected')
      setError('No channel connected')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // First get channel details to get the uploads playlist ID
      const channelResponse = await fetch(`/api/youtube/channel?channelId=${channel.id}`)
      if (!channelResponse.ok) {
        throw new Error('Failed to fetch channel details')
      }
      const channelData = await channelResponse.json()
      console.log('Channel details:', channelData)

      if (!channelData.uploads_playlist_id) {
        throw new Error('No uploads playlist found')
      }

      // Then fetch videos from the uploads playlist
      const videosResponse = await fetch(`/api/youtube/videos?playlistId=${channelData.uploads_playlist_id}`)
      if (!videosResponse.ok) {
        throw new Error('Failed to fetch videos')
      }
      const videosData = await videosResponse.json()
      console.log('Videos fetched from YouTube:', videosData.videos?.length || 0)

      if (videosData.videos) {
        setVideos(videosData.videos)
      } else {
        setVideos([])
      }
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch videos')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!channel?.id) {
      toast.error('No channel connected')
      return
    }

    try {
      setSyncing(true)
      setError(null)

      const response = await fetch('/api/youtube/videos/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelId: channel.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to sync videos')
      }

      const data = await response.json()
      console.log('Videos synced successfully:', data)
      toast.success(data.message || 'Videos synced successfully')
      
      // Refresh the videos after syncing
      await fetchVideos()
    } catch (err) {
      console.error('Error syncing videos:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to sync videos')
    } finally {
      setSyncing(false)
    }
  }

  const handleVideoClick = (videoId: string) => {
    router.push(`/videos/${videoId}`)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
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

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchVideos}>Try Again</Button>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p>No channel connected</p>
        <Button onClick={() => router.push('/settings')}>Connect Channel</Button>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p>No videos found. Click &quot;Sync Videos&quot; to fetch your videos from YouTube.</p>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            'Sync Videos'
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="unlisted">Unlisted</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            'Sync Videos'
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card
            key={video.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleVideoClick(video.id)}
          >
            <div className="relative aspect-video">
              <Image
                src={video.thumbnail_url}
                alt={video.title}
                fill
                className="object-cover rounded-t-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </div>
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-2">{video.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {video.description}
              </p>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Badge variant="secondary">{formatNumber(video.view_count)} views</Badge>
              <Badge variant="secondary">{formatNumber(video.like_count)} likes</Badge>
              <Badge variant="secondary">{formatNumber(video.comment_count)} comments</Badge>
              <Badge variant={video.status === 'public' ? 'default' : 'secondary'}>
                {video.status}
              </Badge>
              <Badge variant="outline">
                {formatDistanceToNow(new Date(video.published_at), { addSuffix: true })}
              </Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 