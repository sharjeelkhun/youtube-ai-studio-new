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
import { ArrowLeft, Eye, ThumbsUp, MessageSquare, History, Wand2, Clock, TrendingUp, Users, BarChart, X, Plus, Youtube, Loader, AlertCircle, Image as ImageIcon, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import NextImage from 'next/image'
import { ImageOptimization } from '@/components/image-optimization'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

const handleApiResponse = async (
  response: Response, 
  profile: { ai_provider: string | undefined | null } | null, 
  setBillingErrorProvider: (provider: string) => void, 
  router: { push: (path: string) => void }
) => {
  if (response.status === 429) {
    throw new Error('Rate limit reached');
  }

  const data = await response.json().catch(() => null);
  
  if (!response.ok) {
    if (data?.errorCode === 'billing_error' && profile?.ai_provider) {
      setBillingErrorProvider(profile.ai_provider);
      router.push('/settings');
    }
    throw new Error(data?.error || 'Failed to complete operation');
  }

  return data;
};

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
  const [isGettingThumbnailIdeas, setIsGettingThumbnailIdeas] = useState(false)
  const [thumbnailIdeas, setThumbnailIdeas] = useState<string[]>([])
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const { session, isLoading: isSessionLoading } = useSession()
  const { profile, loading: isProfileLoading } = useProfile()
  const { channel, loading: isChannelLoading } = useYouTubeChannel()
  const { billingErrorProvider, setBillingErrorProvider } = useAI()

  const isAiConfigured =
    profile?.ai_provider &&
    profile.ai_settings &&
    profile.ai_settings.apiKeys &&
    profile.ai_settings.apiKeys[profile.ai_provider]

  const canGenerateImages = profile?.ai_provider === 'openai' || profile?.ai_provider === 'gemini'

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
      setIsSaving(true)
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

      // First update YouTube
      const response = await fetch(`/api/youtube/videos/${video?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: historyItem.title,
          description: historyItem.description,
          tags: historyItem.tags
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update video on YouTube')
      }

      // Then update local state
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
      setHasChanges(false)

      toast.success('Success', {
        description: 'Video reverted to previous version'
      })
    } catch (error) {
      console.error('Error reverting video:', error)
      toast.error('Error', {
        description: 'Failed to revert video',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const [isOptimizingTitle, setIsOptimizingTitle] = useState(false)
  const [isOptimizingDescription, setIsOptimizingDescription] = useState(false)
  const [isOptimizingTags, setIsOptimizingTags] = useState(false)

  const checkAIConfig = () => {
    // Wait for profile to load
    if (isProfileLoading) {
      toast.error('Loading', {
        description: 'Please wait while we load your profile.',
      })
      return false
    }

    // Check if profile exists
    if (!profile) {
      toast.error('Error', {
        description: 'Profile not found. Please refresh the page.',
      })
      return false
    }

    // Check for AI provider
    if (!profile.ai_provider) {
      toast.error('AI Provider Not Selected', {
        description: 'Please select an AI provider in the settings.',
      })
      router.push('/settings')
      return false
    }

    // Check for API key
    if (!profile.ai_settings?.apiKeys?.[profile.ai_provider]) {
      toast.error('API Key Missing', {
        description: `Please add an API key for ${profile.ai_provider} in the settings.`,
      })
      router.push('/settings')
      return false
    }

    // Check for billing errors
    if (billingErrorProvider && billingErrorProvider === profile.ai_provider) {
      const proceed = confirm(`You have previously encountered a billing issue with ${profile.ai_provider}. Are you sure you want to proceed?`)
      if (!proceed) {
        router.push('/settings')
        return false
      }
    }

    return true
  }

  // Log profile state in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Profile state:', {
        hasProfile: !!profile,
        aiProvider: profile?.ai_provider,
        hasSettings: !!profile?.ai_settings,
        apiKeys: profile?.ai_settings?.apiKeys,
      })
    }
  }, [profile])

  const handleOptimizeTitle = async () => {
    if (!editedVideo || !profile || !checkAIConfig()) return
    if (isOptimizingTitle || isOptimizingDescription || isOptimizingTags || isGenerating) {
      toast.error('Please wait', { description: 'Another AI operation is in progress.' });
      return;
    }

    setIsOptimizingTitle(true)

    try {
      const response = await fetch('/api/ai/optimize-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedVideo.title,
          description: editedVideo.description,
          provider: profile.ai_provider
        })
      });

      if (response.status === 429) {
        toast.error('Rate limit reached', { description: 'Please wait a moment before trying again.' });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (data?.errorCode === 'billing_error' && profile?.ai_provider) {
          setBillingErrorProvider(profile.ai_provider);
          router.push('/settings');
        }
        throw new Error(data?.error || 'Failed to optimize title');
      }
      
      const newTitle = data.optimizedTitle;
      if (!newTitle) {
        throw new Error('No title received from AI');
      }
      
      setEditedVideo(prev => ({ ...prev!, title: newTitle }));
      toast.success('Success!', { description: 'AI has optimized your video title.' });
    } catch (error) {
      console.error('Error optimizing title:', error);
      toast.error('Title Optimization Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.'
      });
    } finally {
      setIsOptimizingTitle(false);
    }
  }

  const handleOptimizeDescription = async () => {
    if (!editedVideo || !profile || !checkAIConfig()) return
    if (isOptimizingTitle || isOptimizingDescription || isOptimizingTags || isGenerating) {
      toast.error('Please wait', { description: 'Another AI operation is in progress.' });
      return;
    }

    setIsOptimizingDescription(true)

    try {
      const response = await fetch('/api/ai/optimize-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedVideo.title,
          description: editedVideo.description
        })
      })

      if (response.status === 429) {
        toast.error('Rate limit reached', { description: 'Please wait a moment before trying again.' });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (data?.errorCode === 'billing_error' && profile?.ai_provider) {
          setBillingErrorProvider(profile.ai_provider);
          router.push('/settings');
        }
        throw new Error(data?.error || 'Failed to optimize description');
      }

      setEditedVideo(prev => ({ ...prev!, description: data.description }))
      toast.success('Success!', { description: 'AI has optimized your video description.' })
    } catch (error) {
      console.error('Error optimizing description:', error)
      toast.error('Description Optimization Failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred.'
      })
    } finally {
      setIsOptimizingDescription(false)
    }
  }

  const handleOptimizeTags = async () => {
    if (!editedVideo || !profile || !checkAIConfig()) return
    if (isOptimizingTags || isOptimizingTitle || isOptimizingDescription || isGenerating) {
      toast.error('Please wait', { description: 'Another AI operation is in progress.' });
      return;
    }

    setIsOptimizingTags(true)

    try {
      const response = await fetch('/api/ai/optimize-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedVideo.title,
          description: editedVideo.description,
          currentTags: editedVideo.tags,
          maxTags: 10 // Request only 10 tags
        })
      });

      if (response.status === 429) {
        toast.error('Rate limit reached', { description: 'Please wait a moment before trying again.' });
        return;
      }

      const data = await response.json();
      
      if (!response.ok) {
        if (data?.errorCode === 'billing_error' && profile?.ai_provider) {
          setBillingErrorProvider(profile.ai_provider);
          router.push('/settings');
        }
        throw new Error(data?.error || 'Failed to optimize tags');
      }
      
      // Clean up the tags - remove any JSON artifacts and format properly
      let tags = data.tags;
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          tags = tags.split(',');
        }
      }
      
      let newTags = Array.isArray(tags) ? tags : [];
      
      // Clean up any JSON formatting or special characters and remove metadata
      newTags = newTags
        .map((tag: string) => {
          // Remove JSON artifacts, brackets, quotes, and cleanup
          return tag
            .replace(/[\[\]"`{}\\]/g, '')
            .replace(/^(Remove\s+|json\s*|tag\s*)/i, '') // Remove 'Remove', 'json', 'tag' prefixes
            .replace(/(\s+tag|\s+json)$/i, '') // Remove 'tag' or 'json' suffixes
            .replace(/```[a-z]*$/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        })
        .filter((tag: string) => 
          tag && // Remove empty tags
          !/^(json|tag)$/i.test(tag) && // Remove standalone 'json' or 'tag'
          !tag.includes('Remove') && // Remove 'Remove' indicators
          !tag.includes('```') && // Remove code block indicators
          !tag.toLowerCase().includes('json') && // Remove any tags containing 'json'
          tag.length >= 2 // Ensure tag is at least 2 chars
        )
        // Remove duplicates and limit to 10 tags
        .filter((tag, index, self) => 
          self.findIndex(t => t.toLowerCase() === tag.toLowerCase()) === index
        )
        .slice(0, 10);
      
      setEditedVideo(prev => ({ ...prev!, tags: newTags }));
      toast.success('Success!', { description: 'AI has optimized your video tags.' });
    } catch (error) {
      console.error('Error optimizing tags:', error);
      toast.error('Tags Optimization Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.'
      });
    } finally {
      setIsOptimizingTags(false);
    }
  }

  const handleAIGenerate = async () => {
    if (!editedVideo || !profile || !checkAIConfig()) return
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
          setBillingErrorProvider(profile.ai_provider)
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

  const handleGetThumbnailIdeas = async () => {
    if (!editedVideo || !profile) return

    if (billingErrorProvider && billingErrorProvider === profile.ai_provider) {
      const proceed = confirm(`You have previously encountered a billing issue with ${profile.ai_provider}. Are you sure you want to proceed?`)
      if (!proceed) {
        return
      }
    }

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

    setIsGettingThumbnailIdeas(true)

    try {
      const response = await fetch('/api/ai/generate-thumbnail-ideas', {
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
          setBillingErrorProvider(profile.ai_provider)
          router.push('/settings')
        }
        const errorMessage = errorBody?.error || 'An unknown error occurred.'
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setThumbnailIdeas(data.thumbnail_ideas)

      toast.success('Success!', {
        description: 'AI has generated thumbnail ideas.',
      })
    } catch (error) {
      console.error('Error generating thumbnail ideas:', error)
      toast.error('Thumbnail Idea Generation Failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred. Please check the console for details.',
      })
    } finally {
      setIsGettingThumbnailIdeas(false)
    }
  }

  const handleGenerateImage = async (prompt: string) => {
    if (!profile) return
    setIsGeneratingImage(true)
    setGeneratedImage(null)

    try {
      const response = await fetch('/api/ai/generate-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        if (errorBody?.errorCode === 'billing_error') {
          setBillingErrorProvider(profile.ai_provider)
          router.push('/settings')
        }
        const errorMessage = errorBody?.error || 'An unknown error occurred.'
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setGeneratedImage(data.imageData)

      toast.success('Success!', {
        description: 'AI has generated a thumbnail image.',
      })
    } catch (error) {
      console.error('Error generating thumbnail image:', error)
      toast.error('Thumbnail Image Generation Failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred. Please check the console for details.',
      })
    } finally {
      setIsGeneratingImage(false)
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
    // Allow for commas to add multiple tags
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    }
    // Allow for ctrl/cmd+s to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      if (hasChanges && !isSaving) {
        handleSave()
      }
    }
  }

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges && !isSaving) {
          handleSave()
        }
      }
      // Alt + A to trigger AI generation
      if (e.altKey && e.key === 'a') {
        e.preventDefault()
        if (!isGenerating && isAiConfigured) {
          handleAIGenerate()
        }
      }
      // Alt + T to focus tag input
      if (e.altKey && e.key === 't') {
        e.preventDefault()
        const tagInput = document.getElementById('tag-input')
        if (tagInput) {
          tagInput.focus()
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [hasChanges, isSaving, isGenerating, isAiConfigured])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const handleOptimizedImage = (optimizedImage: any) => {
    // Convert the optimized image blob to base64 for display
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      const base64Data = base64.split(',')[1]
      setGeneratedImage(base64Data)
      toast.success('Optimized thumbnail applied')
    }
    reader.readAsDataURL(optimizedImage.blob)
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
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground d-none" style={{ display: 'none' }}>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                <span className="text-xs">⌘</span>S
              </kbd>
              <span>Save</span>
              <span className="mx-2">·</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                <span className="text-xs">⌥</span>A
              </kbd>
              <span>AI Generate</span>
              <span className="mx-2">·</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                <span className="text-xs">⌥</span>T
              </kbd>
              <span>Focus Tags</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !isAiConfigured}
                  >
                    {isGenerating ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    AI Generate All
                  </Button>
                </TooltipTrigger>
                {!isAiConfigured ? (
                  <TooltipContent>
                    <p>Please configure your AI provider in the settings</p>
                  </TooltipContent>
                ) : (
                  <TooltipContent>Generate title, description & tags with AI (⌥A)</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex">
                    <Button
                      variant="outline"
                      onClick={handleGetThumbnailIdeas}
                      disabled={isGettingThumbnailIdeas || !isAiConfigured || !canGenerateImages}
                    >
                      {isGettingThumbnailIdeas ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ImageIcon className="mr-2 h-4 w-4" />
                      )}
                      Thumbnail Ideas
                    </Button>
                  </div>
                </TooltipTrigger>
                {(!isAiConfigured || !canGenerateImages) ? (
                  <TooltipContent>
                    <p>
                      {!canGenerateImages
                        ? "Image generation is only available for OpenAI and Gemini providers"
                        : "Please configure your AI provider in the settings"}
                    </p>
                  </TooltipContent>
                ) : (
                  <TooltipContent>Generate thumbnail suggestions with AI</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="outline"
              onClick={() => window.open(`https://studio.youtube.com/video/${video.id}/edit`, '_blank')}
            >
              <Youtube className="mr-2 h-4 w-4" />
              Edit in Studio
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button 
                    variant={hasChanges ? "default" : "outline"}
                    onClick={handleSave} 
                    disabled={isSaving || !hasChanges}
                  >
                    {isSaving ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {hasChanges && (
                          <div className="mr-2 h-2 w-2 rounded-full bg-yellow-500" />
                        )}
                        Save Changes
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasChanges ? 'Press ⌘S to save' : 'No changes to save'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Title</label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center mr-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`${isOptimizingTitle ? 'opacity-50' : ''} flex items-center gap-1.5 h-7 px-2 text-sm`}
                          onClick={handleOptimizeTitle}
                          disabled={isOptimizingTitle || !isAiConfigured}
                        >
                          {isOptimizingTitle ? (
                            <Loader className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="h-3.5 w-3.5" />
                          )}
                          <span>Optimize</span>
                        </Button>
                        {!isAiConfigured && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="ml-2 text-yellow-500">
                                  <AlertCircle className="h-4 w-4" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Configure AI provider in settings
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {editedVideo?.title.length || 0}/100 characters
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopy(editedVideo?.title || '')}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>Copy</TooltipTrigger>
                              <TooltipContent>Copy title to clipboard</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Input
                    value={editedVideo?.title || ''}
                    onChange={(e) => setEditedVideo({ ...editedVideo!, title: e.target.value })}
                    placeholder="Enter video title"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Description</label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center mr-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`${isOptimizingDescription ? 'opacity-50' : ''} flex items-center gap-1.5 h-7 px-2 text-sm`}
                          onClick={handleOptimizeDescription}
                          disabled={isOptimizingDescription || !isAiConfigured}
                        >
                          {isOptimizingDescription ? (
                            <Loader className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="h-3.5 w-3.5" />
                          )}
                          <span>Optimize</span>
                        </Button>
                        {!isAiConfigured && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="ml-2 text-yellow-500">
                                  <AlertCircle className="h-4 w-4" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Configure AI provider in settings
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {editedVideo?.description.length || 0}/5000 characters
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopy(editedVideo?.description || '')}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>Copy</TooltipTrigger>
                              <TooltipContent>Copy description to clipboard</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Textarea
                    value={editedVideo?.description || ''}
                    onChange={(e) => setEditedVideo({ ...editedVideo!, description: e.target.value })}
                    placeholder="Enter video description"
                    rows={4}
                    maxLength={5000}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Tags</label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center mr-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`${isOptimizingTags ? 'opacity-50' : ''} flex items-center gap-1.5 h-7 px-2 text-sm`}
                          onClick={handleOptimizeTags}
                          disabled={isOptimizingTags || !isAiConfigured}
                        >
                          {isOptimizingTags ? (
                            <Loader className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="h-3.5 w-3.5" />
                          )}
                          <span>Generate</span>
                        </Button>
                        {!isAiConfigured && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="ml-2 text-yellow-500">
                                  <AlertCircle className="h-4 w-4" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Configure AI provider in settings
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Press Alt + T to focus | Enter or comma to add
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="tag-input"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add tags (up to 500 characters total)"
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
              <CardTitle>Thumbnail Ideas</CardTitle>
            </CardHeader>
            <CardContent>
              {isGettingThumbnailIdeas ? (
                <div className="flex justify-center items-center h-24">
                  <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : thumbnailIdeas.length > 0 ? (
                <ul className="space-y-2">
                  {thumbnailIdeas.map((idea, index) => (
                    <li key={index} className="text-sm cursor-pointer hover:underline" onClick={() => handleGenerateImage(idea)}>
                      {idea}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground">No thumbnail ideas generated yet.</p>
              )}
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        if (confirm('Are you sure you want to revert to this version? Any unsaved changes will be lost.')) {
                          handleRevert(item)
                        }
                      }}
                    >
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
          <ImageOptimization
            thumbnailUrl={video.thumbnail_url}
            videoTitle={video.title}
            onOptimizedImage={handleOptimizedImage}
            isAiConfigured={isAiConfigured}
            aiProvider={profile?.ai_provider || undefined}
          />

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
                                <div className="grid gap-6">
                  {/* Core Stats Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4 bg-card p-4 rounded-lg border">
                      {/* Views */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="rounded-md bg-blue-50 p-2 dark:bg-blue-900/20">
                            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">{video.view_count.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Views</p>
                          </div>
                        </div>
                        <Progress className="h-2" value={Math.min((video.view_count || 0) / 100, 100)} />
                      </div>

                      {/* Likes */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="rounded-md bg-green-50 p-2 dark:bg-green-900/20">
                            <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium">{video.like_count.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Likes</p>
                          </div>
                        </div>
                        <Progress className="h-2" value={Math.min((video.like_count || 0) / 10, 100)} />
                      </div>

                      {/* Watch Time */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="rounded-md bg-yellow-50 p-2 dark:bg-yellow-900/20">
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <p className="font-medium">{video.watch_time} minutes</p>
                            <p className="text-sm text-muted-foreground">Watch Time</p>
                          </div>
                        </div>
                        <Progress className="h-2" value={Math.min((video.watch_time || 0) / 10, 100)} />
                      </div>
                    </div>

                    <div className="space-y-4 bg-card p-4 rounded-lg border">
                      {/* Engagement Rate */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="rounded-md bg-purple-50 p-2 dark:bg-purple-900/20">
                            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium">{video.engagement_rate?.toFixed(1)}%</p>
                            <p className="text-sm text-muted-foreground">Engagement Rate</p>
                          </div>
                        </div>
                        <Progress className="h-2" value={video.engagement_rate || 0} />
                      </div>

                      {/* Subscribers Gained */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="rounded-md bg-pink-50 p-2 dark:bg-pink-900/20">
                            <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                          </div>
                          <div>
                            <p className="font-medium">+{video.subscriber_gained}</p>
                            <p className="text-sm text-muted-foreground">New Subscribers</p>
                          </div>
                        </div>
                        <Progress className="h-2" value={Math.min((video.subscriber_gained || 0) * 2, 100)} />
                      </div>

                      {/* Retention Rate */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="rounded-md bg-orange-50 p-2 dark:bg-orange-900/20">
                            <BarChart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="font-medium">{video.retention_rate?.toFixed(1)}%</p>
                            <p className="text-sm text-muted-foreground">Retention Rate</p>
                          </div>
                        </div>
                        <Progress className="h-2" value={video.retention_rate || 0} />
                      </div>
                    </div>
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