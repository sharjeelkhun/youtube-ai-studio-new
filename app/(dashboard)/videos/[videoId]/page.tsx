'use client'

import { useEffect, useState, useRef } from 'react'
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
import { getRateLimitStatus, RateLimitTimeoutError } from '@/lib/rate-limiter'

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

  // Retry state management for AI Generate All
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [retryScheduledFor, setRetryScheduledFor] = useState<Date | null>(null)
  const [activeToastId, setActiveToastId] = useState<string | number | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownUpdateCounterRef = useRef<number>(0)
  const retryNowInFlightRef = useRef<boolean>(false)

  // Debounce and concurrency control state
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [activeOperation, setActiveOperation] = useState<'title' | 'description' | 'tags' | 'all' | null>(null)
  const activeOperationStartTime = useRef<Date | null>(null)
  const operationLockTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================================================
  // CONSTANTS: Rate Limiter and Retry Configuration
  // ============================================================================

  /**
   * Maximum number of retry attempts before giving up.
   * Chosen to balance user patience with reasonable failure recovery.
   */
  const MAX_RETRY_ATTEMPTS = 5

  /**
   * Maximum acceptable queue depth before aborting retries.
   * Prevents cascading failures when the rate limiter is overwhelmed.
   * Set to 10 to allow some queuing but prevent excessive backup.
   */
  const MAX_QUEUE_DEPTH = 10

  /**
   * Minimum delay between retries (5 seconds).
   * Ensures we don't hammer the API too quickly.
   */
  const MIN_BACKOFF_DELAY_MS = 5000

  /**
   * Maximum delay between retries (60 seconds).
   * Caps exponential backoff to prevent excessively long waits.
   */
  const MAX_BACKOFF_DELAY_MS = 60000

  /**
   * Timeout for rate limiter status checks (5 seconds).
   * Pre-flight checks should be fast; if they time out, we proceed anyway.
   */
  const RATE_LIMITER_CHECK_TIMEOUT_MS = 5000

  const isAiConfigured =
    profile?.ai_provider &&
    profile.ai_settings &&
    profile.ai_settings.apiKeys &&
    profile.ai_settings.apiKeys[profile.ai_provider]

  const canGenerateImages = profile?.ai_provider === 'openai' || profile?.ai_provider === 'gemini'

  const isMountedRef = useRef(true)

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Debounce utility function to prevent rapid-fire button clicks.
   * @param func The function to debounce
   * @param delay Delay in milliseconds
   * @returns Debounced version of the function
   */
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    return (...args: Parameters<T>) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      debounceTimeoutRef.current = setTimeout(() => {
        func(...args)
      }, delay)
    }
  }

  /**
   * Sets the active operation lock with timeout safety.
   * @param operation The type of operation being started
   */
  const setActiveOperationLock = (operation: 'title' | 'description' | 'tags' | 'all') => {
    console.log(`[CONCURRENCY] Acquiring lock for operation: ${operation}`)
    setActiveOperation(operation)
    activeOperationStartTime.current = new Date()

    // Safety timeout: automatically clear lock after 5 minutes
    if (operationLockTimeoutRef.current) {
      clearTimeout(operationLockTimeoutRef.current)
    }
    operationLockTimeoutRef.current = setTimeout(() => {
      console.warn(`[CONCURRENCY] Operation lock for ${operation} exceeded 5 minutes, forcing release`)
      clearActiveOperationLock()
    }, 5 * 60 * 1000)
  }

  /**
   * Clears the active operation lock.
   */
  const clearActiveOperationLock = () => {
    if (activeOperation) {
      const elapsed = activeOperationStartTime.current
        ? Math.round((Date.now() - activeOperationStartTime.current.getTime()) / 1000)
        : 0
      console.log(`[CONCURRENCY] Releasing lock for operation: ${activeOperation} (elapsed: ${elapsed}s)`)
    }
    setActiveOperation(null)
    activeOperationStartTime.current = null
    if (operationLockTimeoutRef.current) {
      clearTimeout(operationLockTimeoutRef.current)
      operationLockTimeoutRef.current = null
    }
  }

  /**
   * Calculates exponential backoff delay with jitter and optional server-informed timing.
   * @param attempt The current retry attempt number (1-indexed)
   * @param serverResetIn Optional seconds until rate limiter reset from server
   * @returns Delay in milliseconds before next retry
   */
  const calculateBackoffDelay = (attempt: number, serverResetIn?: number): number => {
    let baseDelay: number

    if (serverResetIn && serverResetIn > 0) {
      // Use server-informed reset time as base delay
      baseDelay = serverResetIn * 1000
    } else {
      // Use exponential backoff: MIN * 2^(attempt-1), capped at MAX
      baseDelay = Math.min(MIN_BACKOFF_DELAY_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_DELAY_MS)
    }

    // Apply jitter: ±20% randomization to prevent thundering herd
    const jitter = baseDelay * (0.8 + Math.random() * 0.4)
    const finalDelay = Math.max(MIN_BACKOFF_DELAY_MS, Math.floor(jitter))

    console.log(`[BACKOFF] Attempt ${attempt}, base: ${baseDelay}ms, with jitter: ${finalDelay}ms`)

    return finalDelay
  }

  // Helper function: Detect rate limit errors
  const isRateLimitError = (error: any, response?: Response): boolean => {
    if (response?.status === 429) return true
    const errorMessage = error?.message || String(error)
    if (/(rate.?limit|429|too many requests|quota)/i.test(errorMessage)) return true
    if (error?.errorCode === 'rate_limit_timeout' || error?.errorCode === 'rate_limit_error') return true
    return false
  }

  // Helper function: Parse wait time from error message
  const parseWaitTimeFromError = (errorMessage: string): number | null => {
    const match = errorMessage.match(/wait\s+(\d+)\s+seconds?|try again in\s+(\d+)\s+seconds?/i)
    if (match) {
      return parseInt(match[1] || match[2], 10)
    }
    return null
  }

  /**
   * Checks the rate limiter status for a given provider.
   * This is a pre-flight check to determine queue depth and availability.
   * @param provider The AI provider name (e.g., 'gemini', 'openai')
   * @param userId The user ID for scoping the rate limit check
   * @returns Rate limiter status object or null on error
   */
  const checkRateLimiterStatus = async (
    provider: string,
    userId: string
  ): Promise<{
    available: number
    queueLength: number
    status: string
    resetIn: number
    percentAvailable: number
  } | null> => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Rate limiter check timeout')), RATE_LIMITER_CHECK_TIMEOUT_MS)
      )

      const fetchPromise = fetch(`/api/debug/rate-limiter-status?provider=${provider}`)

      const response = await Promise.race([fetchPromise, timeoutPromise])

      if (!response.ok) {
        console.error(`[RATE-LIMITER-CHECK] Failed to fetch status: ${response.status}`)
        return null
      }

      const result = await response.json()
      console.log(`[RATE-LIMITER-CHECK] Status for ${provider}:`, result)
      return result
    } catch (error) {
      console.error('[RATE-LIMITER-CHECK] Error checking rate limiter status:', error)
      return null
    }
  }

  /**
   * Determines whether retry should be aborted due to excessive queue depth.
   * @param queueLength Current number of requests in the queue
   * @returns true if queue is too deep and retry should abort
   */
  const shouldAbortDueToQueueDepth = (queueLength: number): boolean => {
    const shouldAbort = queueLength >= MAX_QUEUE_DEPTH
    console.log(
      `[RETRY-DECISION] Queue depth ${queueLength} ${shouldAbort ? 'exceeds' : 'within'} limit of ${MAX_QUEUE_DEPTH}`
    )
    return shouldAbort
  }

  /**
   * Cancels any scheduled retry and resets all retry-related state.
   * @param reason Human-readable reason for cancellation (for logging)
   */
  const cancelScheduledRetry = (reason: string) => {
    console.log(`[RETRY-CANCEL] ${reason}`)

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    setRetryAttempt(0)
    setRetryCountdown(0)
    setRetryScheduledFor(null)
    setIsGenerating(false)

    if (activeToastId) {
      toast.dismiss(activeToastId)
      setActiveToastId(null)
    }
  }

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

  // Countdown effect for AI Generate All retry with live toast updates
  useEffect(() => {
    if (retryScheduledFor && activeToastId) {
      // Reset counter when effect starts
      countdownUpdateCounterRef.current = 0
      let lastQueueStatus: { queueLength: number; percentAvailable: number } | null = null

      const interval = setInterval(async () => {
        const remaining = Math.max(0, Math.ceil((retryScheduledFor.getTime() - Date.now()) / 1000))
        setRetryCountdown(remaining)

        // Fetch rate limiter status every 5 seconds (not every second to avoid spam)
        if (countdownUpdateCounterRef.current % 5 === 0 && profile?.ai_provider && session?.user?.id) {
          try {
            const status = await checkRateLimiterStatus(profile.ai_provider, session.user.id)
            if (status) {
              lastQueueStatus = {
                queueLength: status.queueLength,
                percentAvailable: status.percentAvailable
              }
            }
          } catch (error) {
            console.error('[COUNTDOWN] Failed to fetch rate limiter status:', error)
          }
        }
        countdownUpdateCounterRef.current++

        // Update toast with new countdown - use retryAttempt as it's already incremented
        if (remaining > 0) {
          toast.dismiss(activeToastId)
          const countdownQueueInfo = lastQueueStatus
            ? `Queue: ${lastQueueStatus.queueLength} requests, ${lastQueueStatus.percentAvailable}% capacity available`
            : 'Gemini free tier: 60 requests/minute'

          const newToastId = toast.error('Rate Limit Reached', {
            description: `Attempt ${retryAttempt} of ${MAX_RETRY_ATTEMPTS}.\n\nRetrying in ${remaining} seconds...\n\n${countdownQueueInfo}\n\nClick X to cancel the retry.`,
            duration: Infinity,
            onDismiss: () => {
              cancelScheduledRetry('User dismissed retry toast')
            },
            action: {
              label: 'Retry Now',
              onClick: async () => {
                // Guard against double-clicks
                if (retryNowInFlightRef.current) return
                if (isGenerating) return

                retryNowInFlightRef.current = true

                try {
                  // Check rate limiter status before allowing manual retry
                  if (profile?.ai_provider && session?.user?.id) {
                    const status = await checkRateLimiterStatus(profile.ai_provider, session.user.id)
                    if (status && shouldAbortDueToQueueDepth(status.queueLength)) {
                      toast.error('Queue Still Full', {
                        description: 'The rate limiter queue is still full. Please wait a bit longer.',
                        duration: 3000
                      })
                      return
                    }
                  }

                  console.log('[MANUAL-RETRY] User triggered manual retry')

                  if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current)
                    retryTimeoutRef.current = null
                  }
                  setRetryCountdown(0)
                  setRetryScheduledFor(null)
                  setIsGenerating(false)
                  toast.dismiss(newToastId)
                  setActiveToastId(null)
                  handleAIGenerate()
                } finally {
                  retryNowInFlightRef.current = false
                }
              }
            }
          })
          setActiveToastId(newToastId)
        } else {
          clearInterval(interval)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [retryScheduledFor, activeToastId, retryAttempt, isGenerating, profile?.ai_provider, session?.user?.id])

  // Cleanup effect on component unmount
  useEffect(() => {
    return () => {
      console.log('[CLEANUP] Component unmounting, clearing retry state and locks')
      isMountedRef.current = false
      cancelScheduledRetry('Component unmounted')
      // Dismiss ALL toasts to ensure cleanup
      toast.dismiss()
      // Clear debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }
      // Clear operation lock timeout
      if (operationLockTimeoutRef.current) {
        clearTimeout(operationLockTimeoutRef.current)
        operationLockTimeoutRef.current = null
      }
    }
  }, [])

  // Cleanup effect on navigation (video ID change)
  useEffect(() => {
    // This effect runs when videoId changes, indicating navigation to a different video
    return () => {
      if (retryTimeoutRef.current || retryAttempt > 0) {
        cancelScheduledRetry('Navigation detected')
      }
    }
  }, [params.videoId])

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

  const checkAIConfig = (operationType?: 'title' | 'description' | 'tags' | 'all') => {
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

    // Check for active operations (concurrency control)
    if (activeOperation) {
      const elapsed = activeOperationStartTime.current
        ? Math.round((Date.now() - activeOperationStartTime.current.getTime()) / 1000)
        : 0
      console.log(`[CONCURRENCY] Rejecting ${operationType || 'operation'} - ${activeOperation} already active (${elapsed}s)`)
      toast.error('Operation In Progress', {
        description: `Please wait for the current ${activeOperation} optimization to complete (${elapsed}s elapsed).`,
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
    if (!editedVideo || !profile || !checkAIConfig('title')) return

    setIsOptimizingTitle(true)
    setActiveOperationLock('title')
    console.log('[CONCURRENCY] Starting title optimization')

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
      clearActiveOperationLock()
    }
  }

  const handleOptimizeDescription = async () => {
    if (!editedVideo || !profile || !checkAIConfig('description')) return

    setIsOptimizingDescription(true)
    setActiveOperationLock('description')
    console.log('[CONCURRENCY] Starting description optimization')

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
      clearActiveOperationLock()
    }
  }

  const handleOptimizeTags = async () => {
    if (!editedVideo || !profile || !checkAIConfig('tags')) return

    setIsOptimizingTags(true)
    setActiveOperationLock('tags')
    console.log('[CONCURRENCY] Starting tags optimization')

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
      clearActiveOperationLock()
    }
  }

  const handleAIGenerate = async () => {
    // isGenerating guard to prevent concurrent requests
    if (isGenerating) {
      console.log('[AI-GENERATE] Already generating, skipping')
      return
    }

    // Check if retry already scheduled
    if (retryTimeoutRef.current) {
      console.log('[AI-GENERATE] Retry already scheduled, skipping')
      return
    }

    // Pre-flight checks with operation type
    if (!editedVideo || !profile || !checkAIConfig('all')) return

    // Initialize retry attempt if first attempt
    if (retryAttempt === 0) {
      setRetryAttempt(1)
    }

    // Pre-flight rate limiter check (only on retries, not first attempt)
    if (retryAttempt > 0 && profile.ai_provider && session?.user?.id) {
      try {
        const status = await checkRateLimiterStatus(profile.ai_provider, session.user.id)

        if (status && shouldAbortDueToQueueDepth(status.queueLength)) {
          console.log(`[RETRY-ABORT] Queue depth ${status.queueLength} exceeds maximum ${MAX_QUEUE_DEPTH}`)

          toast.error('Rate Limiter Queue Full', {
            description: `The rate limiter queue is currently full (${status.queueLength} requests waiting). Please wait a few moments and try again manually. The queue should clear in approximately ${status.resetIn} seconds.`,
            duration: 10000
          })

          cancelScheduledRetry('Queue depth exceeded')
          return
        }
      } catch (error) {
        console.warn('[RETRY-WARNING] Could not check rate limiter status, proceeding with retry')
      }
    }

    setIsGenerating(true)
    setActiveOperationLock('all')
    console.log('[CONCURRENCY] Starting full AI optimization')

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

      // Success path
      if (response.ok) {
        const data = await response.json()

        console.log('[AI-GENERATE] Success! Resetting retry state')

        // Reset retry state
        setRetryAttempt(0)
        setRetryCountdown(0)
        setRetryScheduledFor(null)
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
          retryTimeoutRef.current = null
        }
        if (activeToastId) {
          toast.dismiss(activeToastId)
          setActiveToastId(null)
        }

        setEditedVideo((prev) => ({
          ...prev!,
          title: data.title,
          description: data.description,
          tags: data.tags,
        }))

        toast.success('Success!', {
          description: 'AI has optimized your video details.',
        })

        setIsGenerating(false)
        clearActiveOperationLock()
        return
      }

      // Error path - check for rate limit
      const errorBody = await response.json().catch(() => null)
      const errorMessage = errorBody?.error || 'An unknown error occurred.'

      // Check if it's a rate limit error
      if (isRateLimitError(errorBody, response)) {
        // Fetch rate limiter status for server-informed backoff
        let rateLimiterStatus: Awaited<ReturnType<typeof checkRateLimiterStatus>> = null
        let serverResetIn: number | undefined = undefined

        if (profile.ai_provider && session?.user?.id) {
          try {
            rateLimiterStatus = await checkRateLimiterStatus(profile.ai_provider, session.user.id)
            if (rateLimiterStatus && rateLimiterStatus.resetIn > 0) {
              serverResetIn = rateLimiterStatus.resetIn
              console.log(`[RETRY-BACKOFF] Server reset in ${serverResetIn}s, queue length: ${rateLimiterStatus.queueLength}`)
            }
          } catch (error) {
            console.warn('[RETRY-WARNING] Failed to fetch rate limiter status for backoff calculation')
          }
        }

        // Check for Retry-After header first (honors server's reset time)
        const retryAfterHeader = response.headers.get('retry-after')
        let waitSeconds: number

        if (retryAfterHeader) {
          // Retry-After can be in seconds or HTTP date
          const retryAfterNum = parseInt(retryAfterHeader, 10)
          if (!isNaN(retryAfterNum)) {
            waitSeconds = retryAfterNum
          } else {
            // Try parsing as HTTP date
            const retryAfterDate = new Date(retryAfterHeader)
            if (!isNaN(retryAfterDate.getTime())) {
              waitSeconds = Math.max(0, Math.ceil((retryAfterDate.getTime() - Date.now()) / 1000))
            } else {
              waitSeconds = parseWaitTimeFromError(errorMessage) || Math.ceil(calculateBackoffDelay(retryAttempt, serverResetIn) / 1000)
            }
          }
        } else {
          // Use server-informed backoff if available
          waitSeconds = Math.max(5, parseWaitTimeFromError(errorMessage) || Math.ceil(calculateBackoffDelay(retryAttempt, serverResetIn) / 1000))
        }

        const delayMs = waitSeconds * 1000

        // Check queue depth before scheduling retry
        if (rateLimiterStatus && shouldAbortDueToQueueDepth(rateLimiterStatus.queueLength)) {
          toast.error('Rate Limiter Queue Full', {
            description: `The rate limiter queue is currently full (${rateLimiterStatus.queueLength} requests waiting). Please wait a few moments and try again manually. The queue should clear in approximately ${rateLimiterStatus.resetIn} seconds.`,
            duration: 10000
          })

          cancelScheduledRetry('Queue depth exceeded before scheduling retry')
          setIsGenerating(false)
          clearActiveOperationLock()
          return
        }

        // Check max attempts
        if (retryAttempt >= MAX_RETRY_ATTEMPTS) {
          toast.error('Rate Limit Exceeded', {
            description: `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached. The rate limiter is currently overloaded. Please wait a few minutes and try again manually.`
          })
          setRetryAttempt(0)
          setRetryCountdown(0)
          setRetryScheduledFor(null)
          setIsGenerating(false)
          clearActiveOperationLock()
          return
        }

        // Compute next attempt locally before setState for immediate display
        const nextAttempt = retryAttempt + 1
        setRetryAttempt(nextAttempt)

        // Schedule retry
        const scheduledTime = new Date(Date.now() + delayMs)
        setRetryScheduledFor(scheduledTime)
        setRetryCountdown(waitSeconds)

        // Build queue info for toast description
        const toastQueueInfo = rateLimiterStatus
          ? `Queue: ${rateLimiterStatus.queueLength} requests, ${rateLimiterStatus.percentAvailable}% capacity available`
          : 'Gemini free tier: 60 requests/minute'

        // Show toast with countdown and retry button - use local nextAttempt
        const toastId = toast.error('Rate Limit Reached', {
          description: `Rate limit reached. Attempt ${nextAttempt} of ${MAX_RETRY_ATTEMPTS}.\n\nRetrying in ${waitSeconds} seconds...\n\n${toastQueueInfo}\n\nClick X to cancel the retry.`,
          duration: Infinity,
          onDismiss: () => {
            cancelScheduledRetry('User dismissed retry toast')
          },
          action: {
            label: 'Retry Now',
            onClick: async () => {
              // Guard against double-clicks
              if (retryNowInFlightRef.current) return
              if (isGenerating) return

              retryNowInFlightRef.current = true

              try {
                // Check rate limiter status before allowing manual retry
                if (profile.ai_provider && session?.user?.id) {
                  const status = await checkRateLimiterStatus(profile.ai_provider, session.user.id)
                  if (status && shouldAbortDueToQueueDepth(status.queueLength)) {
                    toast.error('Queue Still Full', {
                      description: 'The rate limiter queue is still full. Please wait a bit longer.',
                      duration: 3000
                    })
                    return
                  }
                }

                console.log('[MANUAL-RETRY] User triggered manual retry')

                // Clear scheduled retry and reset state
                if (retryTimeoutRef.current) {
                  clearTimeout(retryTimeoutRef.current)
                  retryTimeoutRef.current = null
                }
                setRetryCountdown(0)
                setRetryScheduledFor(null)
                toast.dismiss(toastId)
                setActiveToastId(null)
                setIsGenerating(false)
                clearActiveOperationLock()
                // Trigger immediate retry
                handleAIGenerate()
              } finally {
                retryNowInFlightRef.current = false
              }
            }
          }
        })
        setActiveToastId(toastId)

        // Set isGenerating to false before scheduling retry so retry can proceed
        // But keep operation lock active
        setIsGenerating(false)

        // Schedule automatic retry - capture toastId locally
        retryTimeoutRef.current = setTimeout(() => {
          // Check if component is still mounted
          if (!isMountedRef.current) {
            console.log('[RETRY-SKIP] Component unmounted, skipping retry')
            return
          }

          retryTimeoutRef.current = null
          setRetryCountdown(0)
          setRetryScheduledFor(null)
          toast.dismiss(toastId)
          setActiveToastId(null)
          handleAIGenerate()
        }, delayMs)

        return
      }

      // Handle other errors (billing, auth, etc.)
      if (errorBody?.errorCode === 'billing_error' && profile?.ai_provider) {
        setBillingErrorProvider(profile.ai_provider)
        router.push('/settings')
      }

      throw new Error(errorMessage)

    } catch (error) {
      console.error('Error generating AI content:', error)
      toast.error('AI Generation Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.'
      })

      // Reset retry state on non-rate-limit errors
      setRetryAttempt(0)
      setRetryCountdown(0)
      setRetryScheduledFor(null)
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }

      setIsGenerating(false)
      clearActiveOperationLock()
    }
  }

  // Create debounced wrapper for main AI Generate button (500ms debounce)
  const debouncedHandleAIGenerate = debounce(handleAIGenerate, 500)

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
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      {/* Operation Progress Indicator */}
      {activeOperation && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-blue-500/10 border-b border-blue-500/20 py-2">
          <div className="container mx-auto px-4 flex items-center justify-center gap-3">
            <Loader className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm font-medium">
              Optimizing {activeOperation}...
              {activeOperationStartTime.current && (
                <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
                  ({Math.round((Date.now() - activeOperationStartTime.current.getTime()) / 1000)}s elapsed)
                </span>
              )}
            </span>
            {/* Cancel button - only shown if a retry is scheduled */}
            {retryTimeoutRef.current && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  cancelScheduledRetry('User cancelled from banner')
                  clearActiveOperationLock()
                }}
                className="ml-2 sm:ml-4 h-7 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={retryCountdown > 0 ? "secondary" : "outline"}
                    onClick={debouncedHandleAIGenerate}
                    disabled={isGenerating || !isAiConfigured || !!activeOperation}
                    className={retryCountdown > 0 ? '' : 'bg-[#FF0000] hover:bg-[#CC0000] text-white border-[#FF0000]'}
                  >
                    {isGenerating ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{retryCountdown > 0 ? `Retry in ${retryCountdown}s` : 'AI Generate All'}</span>
                    <span className="sm:hidden">{retryCountdown > 0 ? `Retry ${retryCountdown}s` : 'AI Generate'}</span>
                  </Button>
                </TooltipTrigger>
                {!isAiConfigured ? (
                  <TooltipContent>
                    <p>Please configure your AI provider in the settings</p>
                  </TooltipContent>
                ) : activeOperation ? (
                  <TooltipContent>
                    <p>Please wait for the current {activeOperation} optimization to complete</p>
                  </TooltipContent>
                ) : (
                  <TooltipContent>Generate title, description & tags with AI (⌥A)</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <div className="hidden md:flex md:items-center md:gap-2">
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
                <span className="hidden lg:inline">Edit in Studio</span>
                <span className="lg:hidden">YT Studio</span>
              </Button>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={hasChanges ? "default" : "outline"}
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className={hasChanges ? 'bg-[#FF0000] hover:bg-[#CC0000] text-white' : ''}
                  >
                    {isSaving ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Saving...</span>
                        <span className="sm:hidden">Saving</span>
                      </>
                    ) : (
                      <>
                        {hasChanges && (
                          <div className="mr-2 h-2 w-2 rounded-full bg-yellow-500" />
                        )}
                        <span className="hidden sm:inline">Save Changes</span>
                        <span className="sm:hidden">Save</span>
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

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
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
                          className={`${isOptimizingTitle ? 'opacity-50' : 'bg-[#FF0000] hover:bg-[#CC0000] text-white border-[#FF0000]'} flex items-center gap-1.5 h-7 px-2 text-sm`}
                          onClick={handleOptimizeTitle}
                          disabled={isOptimizingTitle || !isAiConfigured || !!activeOperation}
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
                                {activeOperation
                                  ? `Wait for ${activeOperation} optimization to complete`
                                  : 'Configure AI provider in settings'}
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
                          className={`${isOptimizingDescription ? 'opacity-50' : 'bg-[#FF0000] hover:bg-[#CC0000] text-white border-[#FF0000]'} flex items-center gap-1.5 h-7 px-2 text-sm`}
                          onClick={handleOptimizeDescription}
                          disabled={isOptimizingDescription || !isAiConfigured || !!activeOperation}
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
                                {activeOperation
                                  ? `Wait for ${activeOperation} optimization to complete`
                                  : 'Configure AI provider in settings'}
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
                          className={`${isOptimizingTags ? 'opacity-50' : 'bg-[#FF0000] hover:bg-[#CC0000] text-white border-[#FF0000]'} flex items-center gap-1.5 h-7 px-2 text-sm`}
                          onClick={handleOptimizeTags}
                          disabled={isOptimizingTags || !isAiConfigured || !!activeOperation}
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
                                {activeOperation
                                  ? `Wait for ${activeOperation} optimization to complete`
                                  : 'Configure AI provider in settings'}
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
              <div className="grid gap-4 md:gap-6">
                <div className="grid gap-4 md:gap-6">
                  {/* Core Stats Grid - Single Column on Mobile, 2 Columns on Tablet+ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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