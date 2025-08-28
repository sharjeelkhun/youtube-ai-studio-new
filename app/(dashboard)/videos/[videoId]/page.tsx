'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useSession } from '@/contexts/session-context'
import { useYouTubeChannel } from '@/contexts/youtube-channel-context'
import { useProfile } from '@/contexts/profile-context'
import { useAI } from '@/contexts/ai-context'
import { ArrowLeft, Eye, ThumbsUp, MessageSquare, History, Wand2, Clock, TrendingUp, Users, BarChart, X, Plus, Youtube, Loader } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface Video {
  id: string
  title: string
  description: string
  status: string
  thumbnail_url: string
  published_at: string
  view_count: number
  like_count: number
  comment_count: number
  watch_time?: number
  engagement_rate?: number
  subscriber_gained?: number
  retention_rate?: number
  tags?: string[]
}

interface VideoHistory {
  id: string
  title: string
  description: string
  created_at: string
  tags?: string[]
}

export default function VideoPage() {
  const params = useParams()
  const router = useRouter()
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editedVideo, setEditedVideo] = useState<Video | null>(null)
  const [history, setHistory] = useState<VideoHistory[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const { session, isLoading: isSessionLoading } = useSession()
  const { profile, loading: isProfileLoading } = useProfile()
  const { channel, loading: isChannelLoading } = useYouTubeChannel()
  const { setHasBillingError } = useAI()

  useEffect(() => {
    if (editedVideo && video) {
      const changes =
        editedVideo.title !== video.title ||
        editedVideo.description !== video.description ||
        JSON.stringify(editedVideo.tags?.sort()) !== JSON.stringify(video.tags?.sort())
      setHasChanges(changes)
    }
  }, [editedVideo, video])

  useEffect(() => {
    if (isSessionLoading || isChannelLoading || isProfileLoading) return

    const fetchVideo = async () => {
      try {
        if (!session) {
          router.push('/login')
          return
        }

        if (!channel) {
          setError('No connected YouTube channel found')
          return
        }

        const supabase = createClientComponentClient()

        // First get the video from our database
        const { data: video, error } = await supabase
          .from('youtube_videos')
          .select('*')
          .eq('id', params.videoId)
          .eq('channel_id', channel.id)
          .single()

        if (error) throw error
        if (!video) {
          setError('Video not found')
          return
        }

        // Fetch the video details from YouTube API to get live data
        const response = await fetch(`/api/youtube/videos/${params.videoId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch video details from YouTube')
        }

        const youtubeData = await response.json()

        // Combine database data with YouTube data
        const fullVideoDetails = {
          ...video,
          ...youtubeData,
          watch_time: Math.floor(Math.random() * 1000), // These are still mock
          engagement_rate: Math.random() * 100,
          subscriber_gained: Math.floor(Math.random() * 100),
          retention_rate: Math.random() * 100,
        }

        setVideo(fullVideoDetails)
        setEditedVideo(fullVideoDetails)

        // Fetch video history
        const { data: historyData } = await supabase
          .from('video_history')
          .select('*')
          .eq('video_id', video.id)
          .order('created_at', { ascending: false })

        if (historyData) {
          setHistory(historyData)
        }
      } catch (error) {
        console.error('Error fetching video:', error)
        setError('Failed to load video')
      } finally {
        setLoading(false)
      }
    }

    fetchVideo()
  }, [params.videoId, router, session, channel, isSessionLoading, isChannelLoading, isProfileLoading])

  const handleSave = async () => {
    if (!editedVideo) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/youtube/videos/${video?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editedVideo.title,
          description: editedVideo.description,
          tags: editedVideo.tags
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update video on YouTube')
      }

      // Save to local history table
      const supabase = createClientComponentClient()
      await supabase.from('video_history').insert({
        video_id: video?.id,
        title: editedVideo.title,
        description: editedVideo.description,
        tags: editedVideo.tags
      })

      setVideo(editedVideo)
      setHasChanges(false)
      toast.success('Success', {
        description: 'Video details updated successfully on YouTube and in your database.'
      })
    } catch (error) {
      console.error('Error saving video:', error)
      toast.error('Error', {
        description: 'Failed to update video details',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRevert = async (historyItem: VideoHistory) => {
    if (!video) return

    try {
      const supabase = createClientComponentClient()
      const { error } = await supabase
        .from('youtube_videos')
        .update({
          title: historyItem.title,
          description: historyItem.description,
          tags: historyItem.tags
        })
        .eq('id', video.id)

      if (error) throw error

      setVideo({
        ...video,
        title: historyItem.title,
        description: historyItem.description,
        tags: historyItem.tags
      })
      setEditedVideo({
        ...video,
        title: historyItem.title,
        description: historyItem.description,
        tags: historyItem.tags
      })

      toast.success('Success', {
        description: 'Video reverted to previous version'
      })
    } catch (error) {
      console.error('Error reverting video:', error)
      toast.error('Error', {
        description: 'Failed to revert video',
      })
    }
  }

  const handleAIGenerate = async () => {
    if (!editedVideo) return

    if (!profile?.ai_provider || !profile.ai_settings) {
      toast.error('AI Provider Not Configured', {
        description: 'Please select an AI provider and add your API key in the settings.',
      })
      return
    }

    const settings = profile.ai_settings as any
    const apiKeys = settings.apiKeys
    if (!apiKeys || !apiKeys[profile.ai_provider]) {
      toast.error('API Key Missing', {
        description: `You have not added an API key for ${profile.ai_provider}. Please add it in the settings.`,
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedVideo.title,
          description: editedVideo.description,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        if (errorBody?.errorCode === 'billing_error') {
          setHasBillingError(true)
          router.push('/settings')
        }
        const errorMessage = errorBody?.error || 'An unknown error occurred.'
        throw new Error(errorMessage)
      }

      const data = await response.json()

      setEditedVideo((prev) => ({
        ...prev!,
        title: data.title,
        description: data.description,
        tags: data.tags,
      }))

      toast.success('Success!', {
        description: 'AI has optimized your video details.',
      })
    } catch (error) {
      console.error('Error generating AI content:', error)
      toast.error('AI Generation Failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred. Please check the console for details.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddTag = () => {
    if (!newTag.trim() || !editedVideo) return

    const tag = newTag.trim()
    if (editedVideo.tags?.includes(tag)) {
      toast.error('Error', {
        description: 'Tag already exists',
      })
      return
    }

    setEditedVideo({
      ...editedVideo,
      tags: [...(editedVideo.tags || []), tag]
    })
    setNewTag('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (!editedVideo) return

    setEditedVideo({
      ...editedVideo,
      tags: editedVideo.tags?.filter(tag => tag !== tagToRemove) || []
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  if (loading || isSessionLoading || isChannelLoading || isProfileLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[400px] animate-pulse rounded-lg bg-muted" />
          <div className="space-y-4">
            <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
            <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold">Video not found</h2>
        <p className="text-muted-foreground">{error || 'The video you are looking for does not exist.'}</p>
        <Button onClick={() => router.push('/videos')}>Back to Videos</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.open(`https://studio.youtube.com/video/${video.id}/edit`, '_blank')}
          >
            <Youtube className="mr-2 h-4 w-4" />
            Edit in Studio
          </Button>
          <Button variant="outline" onClick={handleAIGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            AI Generate
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editedVideo?.title || ''}
                    onChange={(e) => setEditedVideo({ ...editedVideo!, title: e.target.value })}
                    placeholder="Enter video title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={editedVideo?.description || ''}
                    onChange={(e) => setEditedVideo({ ...editedVideo!, description: e.target.value })}
                    placeholder="Enter video description"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add a tag"
                    />
                    <Button type="button" onClick={handleAddTag} disabled={!newTag.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {editedVideo?.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {tag} tag</span>
                        </Button>
                      </Badge>
                    ))}
                    {(!editedVideo?.tags || editedVideo.tags.length === 0) && (
                      <span className="text-sm text-muted-foreground">No tags added yet</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Changed on {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleRevert(item)}>
                      <History className="mr-2 h-4 w-4" />
                      Revert
                    </Button>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-center text-muted-foreground">No change history available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className="capitalize">{video.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Published</span>
                  <span className="font-medium">
                    {new Date(video.published_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      Views
                    </div>
                    <div className="text-2xl font-bold">{video.view_count.toLocaleString()}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ThumbsUp className="h-4 w-4" />
                      Likes
                    </div>
                    <div className="text-2xl font-bold">{video.like_count.toLocaleString()}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Watch Time
                      </div>
                      <span className="text-sm font-medium">{video.watch_time} minutes</span>
                    </div>
                    <Progress value={Math.min((video.watch_time || 0) / 10, 100)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        Engagement Rate
                      </div>
                      <span className="text-sm font-medium">{video.engagement_rate?.toFixed(1)}%</span>
                    </div>
                    <Progress value={video.engagement_rate || 0} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Subscribers Gained
                      </div>
                      <span className="text-sm font-medium">+{video.subscriber_gained}</span>
                    </div>
                    <Progress value={Math.min((video.subscriber_gained || 0) * 2, 100)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BarChart className="h-4 w-4" />
                        Retention Rate
                      </div>
                      <span className="text-sm font-medium">{video.retention_rate?.toFixed(1)}%</span>
                    </div>
                    <Progress value={video.retention_rate || 0} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 