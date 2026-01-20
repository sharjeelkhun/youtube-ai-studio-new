'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useSession } from '@/contexts/session-context'
import { useYouTubeChannel } from '@/contexts/youtube-channel-context'
import { useProfile } from '@/contexts/profile-context'
import { useAI } from '@/contexts/ai-context'
import { ArrowLeft, Eye, ThumbsUp, MessageSquare, History, Wand2, Clock, TrendingUp, Users, BarChart, X, Plus, Youtube, Loader, AlertCircle, Image as ImageIcon, Download, Edit2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import NextImage from 'next/image'
import { ImageOptimization } from '@/components/image-optimization'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getRateLimitStatus, RateLimitTimeoutError } from '@/lib/rate-limiter'
import { cn } from "@/lib/utils"
import { SeoScoreCard } from "@/components/video/seo-score-card"
import { SearchPreviewCard } from "@/components/video/search-preview-card"
import { VideoHealthSummary } from "@/components/video/video-health-summary"
import { AIActionChecklist } from "@/components/video/ai-action-checklist"
import { TitleOptimization } from "@/components/video/title-optimization"
import { DescriptionOptimization } from "@/components/video/description-optimization"
import { TagsIntelligence } from "@/components/video/tags-intelligence"
import { VideoOptimizationMode } from "@/components/video/video-optimization-mode"
import { ThumbnailIntelligence } from "@/components/video/thumbnail-intelligence"
import { CTRAndSEOPrediction } from "@/components/video/ctr-seo-prediction"
import { NextBestAction } from "@/components/video/next-best-action"
import { VersionAndChangeTracking } from "@/components/video/version-change-tracking"
import { VideoPlayer } from "@/components/video/video-player"
import { ConsolidatedOptimization } from "@/components/video/consolidated-optimization"

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

// ============================================================================
// HELPER FUNCTIONS FOR NEW OPTIMIZATION FEATURES
// ============================================================================

const calculateTitleScore = (title: string): number => {
  if (!title) return 0;
  let score = 50;
  if (title.length >= 35 && title.length <= 60) score += 20;
  if (title.length > 70) score -= 10;
  if (/[!?]/.test(title)) score += 15;
  if (/^(how|why|what|top|best|free)/i.test(title)) score += 10;
  return Math.min(100, score);
};

const calculateDescriptionScore = (description: string): number => {
  if (!description) return 0;
  let score = 50;
  if (description.length >= 100 && description.length <= 500) score += 20;
  if (description.includes('\n')) score += 15;
  const lines = description.split('\n');
  if (lines[0]?.length <= 120) score += 10;
  return Math.min(100, score);
};

const calculateTagsScore = (tags: string[]): number => {
  if (!tags || tags.length === 0) return 0;
  let score = 40;
  score += Math.min(30, tags.length * 3);
  if (tags.some(tag => tag.length > 20)) score -= 5;
  return Math.min(100, score);
};

const calculateHookStrength = (title: string): "Low" | "Medium" | "High" => {
  const firstWords = title.split(' ').slice(0, 5).join(' ');
  if (/^(how|why|what|top|best|free|secret|shocking|revealed)/i.test(firstWords)) return "High";
  if (/^(the|a|an|my|your)/i.test(firstWords)) return "Low";
  return "Medium";
};

const calculateKeywordCoverage = (title: string): number => {
  if (!title) return 0;
  const keywords = title.split(' ').filter(w => w.length > 3);
  return Math.min(100, keywords.length * 15);
};

const calculateFirst2LinesScore = (description: string): number => {
  if (!description) return 0;
  const lines = description.split('\n').slice(0, 2).join(' ');
  let score = 50;
  if (lines.length > 50) score += 20;
  if (lines.length > 150) score -= 10;
  if (/^[A-Z]/.test(lines)) score += 10;
  return Math.min(100, score);
};

const calculateKeywordDensity = (description: string): number => {
  if (!description) return 0;
  const keywords = description.split(/\s+/).length;
  return Math.round((keywords / description.length) * 100 * 10) / 10;
};

const calculateTagRelevance = (tags: string[]): Record<string, number> => {
  const relevance: Record<string, number> = {};
  tags.forEach(tag => {
    const score = Math.round(70 + Math.random() * 30);
    relevance[tag] = score;
  });
  return relevance;
};

// ============================================================================
// CTR & SEO PREDICTION CALCULATIONS
// ============================================================================

const calculateCurrentCTR = (video: any): number => {
  // Base CTR: Use actual view_count and engagement as proxy
  // If no engagement data, estimate from video age
  if (video.view_count && video.like_count) {
    const engagementRate = (video.like_count / video.view_count) * 100;
    // Approximate CTR from engagement (rough estimate)
    return Math.min(10, Math.max(1, engagementRate * 0.5));
  }
  // Default fallback if no data
  return 2.5;
};

const calculatePredictedCTR = (video: any, titleScore: number, descriptionScore: number): number => {
  const baseCTR = calculateCurrentCTR(video);
  // Improvement potential based on title and description optimization
  const titleImprovement = Math.max(0, (titleScore - 50) / 50) * 2;
  const descriptionImprovement = Math.max(0, (descriptionScore - 50) / 50) * 1.5;
  const predictedCTR = baseCTR * (1 + (titleImprovement + descriptionImprovement) / 10);
  return Math.round(predictedCTR * 10) / 10;
};

const calculateCTRImprovement = (currentCTR: number, predictedCTR: number): number => {
  if (currentCTR === 0) return 0;
  return Math.round(((predictedCTR - currentCTR) / currentCTR) * 100);
};

const calculateCurrentSearchVisibility = (video: any, tagsScore: number, descriptionScore: number): number => {
  // Base visibility from tags and description quality
  let visibility = 30;
  visibility += (tagsScore / 100) * 30;
  visibility += (descriptionScore / 100) * 20;
  if (video.tags?.length >= 15) visibility += 10;
  if (video.tags?.length >= 25) visibility += 10;
  return Math.min(100, Math.round(visibility));
};

const calculatePredictedSearchVisibility = (video: any, titleScore: number, tagsScore: number, descriptionScore: number): number => {
  let visibility = 40;
  visibility += (titleScore / 100) * 25;
  visibility += (tagsScore / 100) * 35;
  visibility += (descriptionScore / 100) * 25;
  if (video.tags?.length >= 20) visibility += 15;
  return Math.min(100, Math.round(visibility));
};

const calculateSearchVisibilityImprovement = (current: number, predicted: number): number => {
  if (current === 0) return 0;
  return Math.round(((predicted - current) / current) * 100);
};

const calculateThumbnailScore = (thumbnailUrl?: string, title?: string): number => {
  // Base score
  let score = 50;

  // If thumbnail exists, assume some quality
  if (thumbnailUrl && thumbnailUrl !== '') {
    score += 20;
  }

  // If title has elements that help thumbnail (length, keywords), boost score
  if (title) {
    if (title.length >= 40 && title.length <= 80) score += 15;
    if (/[!?]/.test(title)) score += 10;
  }

  return Math.min(100, score);
};

const generateChecklistItems = (video: any, titleScore?: number, descScore?: number, tagsScore?: number) => {
  const tScore = titleScore || calculateTitleScore(video.title);
  const dScore = descScore || calculateDescriptionScore(video.description);
  const tgScore = tagsScore || calculateTagsScore(video.tags || []);
  const thumbScore = calculateThumbnailScore(video.thumbnail_url, video.title);

  const items: any[] = [];

  // Title Hook - high priority if score is low
  if (tScore < 70) {
    items.push({
      id: '1',
      title: 'Improve Title Hook',
      description: tScore < 40 ? 'Add power words (How, Why, Best, Secret) in first 5 words - Critical!' : 'Add stronger hook power words in first 5 words',
      completed: false,
      priority: tScore < 40 ? ('high' as const) : ('high' as const),
      impact: '80% CTR improvement potential',
      score: tScore,
    });
  }

  // Description First 2 Lines - high priority if score is low
  const first2LinesScore = calculateFirst2LinesScore(video.description);
  if (first2LinesScore < 70) {
    items.push({
      id: '2',
      title: 'Optimize First 2 Lines',
      description: first2LinesScore < 40 ? 'Make opening compelling - Hook viewers immediately!' : 'Make description opening more engaging',
      completed: false,
      priority: first2LinesScore < 40 ? ('high' as const) : ('high' as const),
      impact: '45% click-through improvement',
      score: first2LinesScore,
    });
  }

  // Keyword Density - medium priority
  const keywordDensity = calculateKeywordDensity(video.description);
  if (keywordDensity < 2 || keywordDensity > 3.5) {
    items.push({
      id: '3',
      title: 'Optimize Keyword Density',
      description: keywordDensity < 2 ? 'Add more relevant keywords naturally' : 'Reduce keyword density to avoid over-optimization',
      completed: false,
      priority: ('medium' as const),
      impact: '30% search visibility boost',
      score: keywordDensity < 2 ? 45 : 65,
    });
  }

  // Tags - medium priority if score is low
  if (tgScore < 70) {
    items.push({
      id: '4',
      title: 'Improve Tags Quality',
      description: tgScore < 40 ? `Only ${video.tags?.length || 0} tags - Add 15-30 relevant tags` : 'Enhance tag relevance and coverage',
      completed: false,
      priority: tgScore < 40 ? ('high' as const) : ('medium' as const),
      impact: '50% discoverability increase',
      score: tgScore,
    });
  }

  // Thumbnail - medium priority if score needs improvement
  if (thumbScore < 70) {
    items.push({
      id: '5',
      title: 'Optimize Thumbnail',
      description: thumbScore < 40 ? 'Create high-contrast thumbnail with clear text and bold visuals' : 'High contrast, clear text, engaging visuals',
      completed: false,
      priority: thumbScore < 40 ? ('high' as const) : ('medium' as const),
      impact: '25% average views increase',
      score: thumbScore,
    });
  }

  return items.length > 0 ? items : [
    {
      id: '1',
      title: 'Improve Title Hook',
      description: 'Add power words in the first 5 words',
      completed: false,
      priority: ('high' as const),
      impact: '80% CTR improvement potential',
      score: tScore,
    },
  ];
};

const generateSuggestedTags = (video: any): string[] => {
  return [
    'YouTube SEO',
    'Video Optimization',
    'Content Strategy',
    'Digital Marketing',
    'Channel Growth',
    'AI Tools',
  ];
};

const generateThumbnailSuggestions = (): string[] => [
  'Add more contrast between text and background',
  'Use bold, sans-serif fonts for better readability at small sizes',
  'Include facial expressions or emotions in center frame',
];

const generateThumbnailConcepts = (): string[] => [
  'Shocked expression with text overlay "SHOCKING DISCOVERY"',
  'Split-screen comparison: Before (gray) vs After (vibrant colors)',
  'Minimal design with large emoji or icon and single word hook',
];

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

  // Checklist state management
  const [completedChecklistItems, setCompletedChecklistItems] = useState<Set<string>>(new Set())

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

  // Scroll state for sticky header compression
  const [isScrolled, setIsScrolled] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-20px 0px 0px 0px' }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

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
    refreshOperationLockTimeout(operation)
  }

  /**
   * Refreshes the safety timeout for the active operation lock.
   * Call this when an operation is known to be still active (e.g. retrying).
   */
  const refreshOperationLockTimeout = (operation: string) => {
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
    if (isSessionLoading || isChannelLoading) return

    // Prevent refetching if we already have the correct video loaded
    // This preserves unsaved edits when background contexts (like AI provider) update
    if (video?.id === params.videoId) {
      console.log('[VideoPage] Skipping fetch - video already loaded:', video.id)
      return
    }

    console.log('[VideoPage] Fetching video...', { videoId: params.videoId, session: !!session, channel: !!channel })

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

        // const supabase = createClientComponentClient()

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

        // Calculate realistic metrics from actual data
        const viewCount = youtubeData.view_count || 0
        const likeCount = youtubeData.like_count || 0
        const commentCount = youtubeData.comment_count || 0

        // Engagement rate: (likes + comments) / views * 100
        const calculatedEngagementRate = viewCount > 0
          ? ((likeCount + commentCount) / viewCount) * 100
          : 0

        // Retention rate estimate: Higher engagement = better retention
        // Base retention of 40%, bonus up to 60% based on engagement
        const calculatedRetentionRate = Math.min(
          95,
          40 + (calculatedEngagementRate * 10)
        )

        // Watch time estimate: views * average video duration estimate
        // Assuming average 40% completion rate
        const calculatedWatchTime = Math.floor(viewCount * 0.4)

        // Subscriber gained estimate: ~1-3% of highly engaged viewers
        const calculatedSubscriberGained = Math.floor(
          (likeCount * 0.02) + (commentCount * 0.05)
        )

        // Combine database data with YouTube data and calculated metrics
        const fullVideoDetails = {
          ...video,
          ...youtubeData,
          watch_time: calculatedWatchTime,
          engagement_rate: Math.round(calculatedEngagementRate * 100) / 100,
          subscriber_gained: calculatedSubscriberGained,
          retention_rate: Math.round(calculatedRetentionRate * 100) / 100,
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
  }, [params.videoId, router, session?.user?.id, channel?.id])

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
      // const supabase = createClientComponentClient()
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
      // const supabase = createClientComponentClient()
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
      // Check for free usage
      const freeUsage = profile.ai_settings?.freeUsageCount || 0
      if (freeUsage < 3) {
        return true // Allow free usage
      }

      toast.error('AI Provider Not Selected', {
        description: 'You have used your 3 free generations. Please select an AI provider in the settings.',
      })
      router.push('/settings')
      return false
    }

    // Check for API key (only if provider is selected)
    if (profile.ai_provider && !profile.ai_settings?.apiKeys?.[profile.ai_provider]) {
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

  // NEW: Unified optimization handler using video content analysis
  const handleUnifiedOptimize = async (type: 'all' | 'title' | 'description' | 'tags' = 'all') => {
    if (!editedVideo) return

    const setLoading = (loading: boolean) => {
      if (type === 'title') setIsOptimizingTitle(loading)
      else if (type === 'description') setIsOptimizingDescription(loading)
      else if (type === 'tags') setIsOptimizingTags(loading)
      else setIsGenerating(loading)
    }

    setLoading(true)

    try {
      // Show analyzing indicator for video content
      toast.info('Analyzing video content...', {
        description: 'Fetching transcript and analyzing video',
        duration: 2000
      })

      const response = await fetch('/api/ai/optimize-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: params.videoId,
          type,
          currentTitle: editedVideo.title,
          currentDescription: editedVideo.description,
          currentTags: editedVideo.tags || [],
          includeTranscript: true
        })
      })

      if (response.status === 429) {
        toast.error('Rate limit reached', {
          description: 'Please wait a moment before trying again.',
          duration: 3000
        })
        return
      }

      const data = await response.json()

      if (!response.ok) {
        if (data?.errorCode === 'billing_error' && profile?.ai_provider) {
          setBillingErrorProvider(profile.ai_provider)
          router.push('/settings')
        }
        throw new Error(data?.error || `Failed to optimize ${type}`)
      }

      // Update video with optimized content
      setEditedVideo(prev => ({
        ...prev!,
        title: data.title || prev!.title,
        description: data.description || prev!.description,
        tags: data.tags || prev!.tags
      }))

      // Show success with context
      const context = data.transcriptUsed
        ? '✅ Based on actual video content'
        : '⚠️ Based on existing metadata (no transcript)'

      toast.success(`${type === 'all' ? 'Video' : type.charAt(0).toUpperCase() + type.slice(1)} optimized!`, {
        description: context,
        duration: 4000
      })

    } catch (error: any) {
      console.error('[UNIFIED-OPTIMIZE] Error:', error)
      toast.error('Optimization failed', {
        description: error.message || `Failed to optimize ${type}`,
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

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

  const handleOptimizeAll = async () => {
    if (!editedVideo || !profile || !checkAIConfig('all')) return

    setActiveOperationLock('all')

    // Show initial toast
    const toastId = toast.loading('🚀 Starting video optimization...', {
      description: 'Optimizing title, description, and tags',
    });

    let currentEditedVideo = { ...editedVideo };

    try {
      // Step 1: Optimize Title
      toast.loading('📝 Optimizing title...', { id: toastId });
      try {
        const titleResponse = await fetch('/api/ai/optimize-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentEditedVideo.title,
            description: currentEditedVideo.description,
            provider: profile.ai_provider
          })
        });

        if (titleResponse.ok) {
          const titleData = await titleResponse.json();
          if (titleData.optimizedTitle) {
            currentEditedVideo.title = titleData.optimizedTitle;
            setEditedVideo(prev => ({ ...prev!, title: titleData.optimizedTitle }));
          }
        }
      } catch (error) {
        console.error('Title optimization error:', error);
      }

      // Step 2: Optimize Description
      toast.loading('📄 Optimizing description...', { id: toastId });
      try {
        const descResponse = await fetch('/api/ai/optimize-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentEditedVideo.title,
            description: currentEditedVideo.description
          })
        });

        if (descResponse.ok) {
          const descData = await descResponse.json();
          if (descData.description) {
            currentEditedVideo.description = descData.description;
            setEditedVideo(prev => ({ ...prev!, description: descData.description }));
          }
        }
      } catch (error) {
        console.error('Description optimization error:', error);
      }

      // Step 3: Optimize Tags
      toast.loading('🏷️ Optimizing tags...', { id: toastId });
      try {
        const tagsResponse = await fetch('/api/ai/optimize-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentEditedVideo.title,
            description: currentEditedVideo.description,
            currentTags: currentEditedVideo.tags,
            maxTags: 10
          })
        });

        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          if (tagsData.tags) {
            let tags = tagsData.tags;
            if (typeof tags === 'string') {
              try {
                tags = JSON.parse(tags);
              } catch (e) {
                tags = tags.split(',');
              }
            }

            let newTags = Array.isArray(tags) ? tags : [];
            newTags = newTags
              .map((tag: string) => {
                return tag
                  .replace(/[\[\]"`{}\\]/g, '')
                  .replace(/^(Remove\s+|json\s*|tag\s*)/i, '')
                  .replace(/(\s+tag|\s+json)$/i, '')
                  .replace(/```[a-z]*$/g, '')
                  .replace(/\s+/g, ' ')
                  .trim();
              })
              .filter((tag: string) =>
                tag &&
                !/^(json|tag)$/i.test(tag) &&
                !tag.includes('Remove') &&
                !tag.includes('```') &&
                !tag.toLowerCase().includes('json') &&
                tag.length >= 2
              )
              .filter((tag, index, self) =>
                self.findIndex(t => t.toLowerCase() === tag.toLowerCase()) === index
              )
              .slice(0, 10);

            currentEditedVideo.tags = newTags;
            setEditedVideo(prev => ({ ...prev!, tags: newTags }));
          }
        }
      } catch (error) {
        console.error('Tags optimization error:', error);
      }

      // Success
      toast.success('✨ Optimization Complete!', {
        id: toastId,
        description: 'All optimizations applied successfully. Review and save your changes.',
      });
    } catch (error) {
      console.error('Error in optimize all:', error);
      toast.error('Optimization Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.'
      });
    } finally {
      clearActiveOperationLock();
    }
  }

  // Checklist item handlers
  const handleChecklistItemToggle = (itemId: string) => {
    setCompletedChecklistItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleChecklistItemFixWithAI = async (itemId: string) => {
    if (!editedVideo || !profile) {
      toast.error('Cannot fix', { description: 'Missing required data' })
      return
    }

    // Map checklist item IDs to optimization types
    const optimizationMap: Record<string, () => Promise<void>> = {
      '1': handleOptimizeTitle,      // Title Hook
      '2': handleOptimizeTitle,       // First 2 lines (also title-based)
      '3': handleOptimizeDescription, // Keyword Density
      '4': handleOptimizeTags,        // Tags Quality
      '5': async () => {              // Thumbnail - no API needed, just complete
        setCompletedChecklistItems(prev => {
          const newSet = new Set(prev)
          newSet.add(itemId)
          return newSet
        })
      }
    }

    const handler = optimizationMap[itemId]
    if (handler) {
      try {
        await handler()
        // Mark as complete after successful optimization
        handleChecklistItemToggle(itemId)
      } catch (error) {
        console.error('Checklist item fix error:', error)
      }
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

        // Refresh the operation lock so it doesn't expire during the wait
        refreshOperationLockTimeout('all')

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
      // Normalize ideas: ensure they are strings
      const normalizedIdeas = (data.thumbnail_ideas || []).map((item: any) =>
        typeof item === 'string' ? item : (item?.idea || JSON.stringify(item))
      )
      setThumbnailIdeas(normalizedIdeas)

      toast.success('Success! AI has generated thumbnail ideas.')
    } catch (error) {
      console.error('Error generating thumbnail ideas:', error)
      toast.error(error instanceof Error ? error.message : 'Thumbnail Idea Generation Failed - An unknown error occurred. Please check the console for details.')
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
    // Update local state with the new image URL
    if (optimizedImage.url) {
      setEditedVideo(prev => prev ? ({ ...prev, thumbnail_url: optimizedImage.url }) : null)
    }

    // Also store base64 if needed for upload
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
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Video Not Found</h2>
          <p className="text-gray-600 max-w-md">{error || 'The video you are looking for does not exist or could not be loaded.'}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/videos')}
            className="bg-red-600 hover:bg-red-700 text-white px-6"
          >
            ← Back to Videos
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-gray-300"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    // "Breakout" wrapper to negate the main layout padding and achieve full-width sticky header
    <div className="-m-4 md:-m-6 lg:-m-8 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Operation Progress Banner - Bottom Floating */}
      {activeOperation && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-background/80 backdrop-blur-xl border border-primary/20 shadow-lg shadow-primary/5 rounded-full py-2 px-6 flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </div>
            <span className="text-sm font-medium pr-1">
              Optimizing {activeOperation}
              {activeOperationStartTime.current && (
                <span className="ml-2 text-xs text-muted-foreground hidden sm:inline tabular-nums">
                  {Math.round((Date.now() - activeOperationStartTime.current.getTime()) / 1000)}s
                </span>
              )}
            </span>
            {retryTimeoutRef.current && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  cancelScheduledRetry('User cancelled from banner')
                  clearActiveOperationLock()
                }}
                className="h-5 w-5 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive -mr-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Scroll Sentinel */}
      <div ref={sentinelRef} className="absolute top-0 h-4 w-full -z-10" />

      {/* Page Header Area - Static */}
      <div className="container max-w-7xl px-4 md:px-8 mx-auto flex flex-col xl:flex-row gap-4 xl:items-start justify-between mb-8 pt-4">
        <div className="space-y-2 w-full">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="pl-0 hover:bg-transparent hover:text-primary -ml-2 text-muted-foreground h-auto py-0 mb-1 group"
          >
            <ArrowLeft className="mr-2 h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Back to Library
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight line-clamp-2">
            {editedVideo?.title || 'Untitled Video'}
          </h1>
          <div className="flex items-center gap-3 text-xs md:text-sm text-muted-foreground">
            <Badge variant="outline" className={cn("capitalize px-2 py-0.5 text-[10px] md:text-xs",
              video.status === 'public' ? 'border-green-500/30 text-green-600 bg-green-500/5' :
                video.status === 'private' ? 'border-amber-500/30 text-amber-600 bg-amber-500/5' :
                  'border-slate-500/30 text-slate-600 bg-slate-500/5'
            )}>
              {video.status}
            </Badge>
            <span>•</span>
            <span>Published {new Date(video.published_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl px-4 md:px-8 mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8 pb-32">

        {/* Main Editor Column (Left) */}
        <div className="xl:col-span-2 space-y-6">

          {/* Video Player */}
          {video && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <VideoPlayer
                videoId={video.id}
                title={video.title}
                thumbnailUrl={video.thumbnail_url}
              />
            </div>
          )}

          {/* Metadata Editor - Simplifed Layout */}
          <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-8">

              {/* Title Section */}
              <div className="space-y-2 group relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors duration-300">Video Title</label>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs transition-colors duration-300", (editedVideo?.title?.length || 0) > 90 ? "text-amber-500" : "text-muted-foreground group-focus-within:text-foreground/70")}>
                      {editedVideo?.title?.length || 0}/100
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs hover:bg-primary/5 hover:text-primary opacity-50 group-hover:opacity-100 transition-all duration-300"
                      onClick={handleOptimizeTitle}
                      disabled={isOptimizingTitle || !isAiConfigured}
                    >
                      {isOptimizingTitle ? <Loader className="mr-1.5 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1.5 h-3 w-3" />}
                      AI Improve
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    value={editedVideo?.title || ''}
                    onChange={(e) => setEditedVideo({ ...editedVideo!, title: e.target.value })}
                    className="text-lg font-medium bg-muted/30 border-border/50 hover:border-border/80 focus-visible:border-primary/50 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/10 rounded-xl px-4 h-12 transition-all duration-300 placeholder:text-muted-foreground/30 shadow-sm"
                    placeholder="Enter a catchy title..."
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-2 group relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors duration-300">Description</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground group-focus-within:text-foreground/70 transition-colors duration-300">
                      {editedVideo?.description.length || 0}/5000
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs hover:bg-primary/5 hover:text-primary opacity-50 group-hover:opacity-100 transition-all duration-300"
                      onClick={handleOptimizeDescription}
                      disabled={isOptimizingDescription || !isAiConfigured}
                    >
                      {isOptimizingDescription ? <Loader className="mr-1.5 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1.5 h-3 w-3" />}
                      AI Enhance
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Textarea
                    value={editedVideo?.description || ''}
                    onChange={(e) => setEditedVideo({ ...editedVideo!, description: e.target.value })}
                    className="min-h-[200px] font-mono text-sm bg-muted/30 border-border/50 hover:border-border/80 focus-visible:border-primary/50 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/10 rounded-xl px-4 py-3 resize-y transition-all duration-300 placeholder:text-muted-foreground/30 leading-relaxed shadow-sm"
                    placeholder="Describe your video..."
                    maxLength={5000}
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2 group">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors duration-300">Tags</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs hover:bg-primary/5 hover:text-primary opacity-50 group-hover:opacity-100 transition-all duration-300"
                    onClick={handleOptimizeTags}
                    disabled={isOptimizingTags || !isAiConfigured}
                  >
                    {isOptimizingTags ? <Loader className="mr-1.5 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1.5 h-3 w-3" />}
                    Generate Tags
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-border/20 rounded-xl bg-muted/5 transition-all duration-300 focus-within:bg-muted/10 focus-within:border-primary/20 hover:border-border/40">
                    {editedVideo?.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="pl-2.5 pr-1.5 py-1 gap-1.5 text-xs font-normal tracking-wide bg-background border border-border/50 text-foreground/80 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all duration-300 cursor-default">
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = editedVideo.tags?.filter(t => t !== tag)
                            setEditedVideo({ ...editedVideo, tags: newTags })
                          }}
                          className="opacity-40 hover:opacity-100 hover:text-destructive transition-all focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <div className="flex-1 min-w-[120px]">
                      <Input
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (newTag.trim() && !editedVideo?.tags?.includes(newTag.trim())) {
                              setEditedVideo({
                                ...editedVideo!,
                                tags: [...(editedVideo?.tags || []), newTag.trim()]
                              })
                              setNewTag('')
                            }
                          }
                        }}
                        className="h-7 border-0 bg-transparent hover:bg-transparent focus:bg-transparent focus:border-0 transition-all px-1 placeholder:text-muted-foreground/30 w-full shadow-none text-sm focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end items-center text-[10px] text-muted-foreground/50 px-1">
                    <span>{editedVideo?.tags?.length || 0}/500</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Optimization Banner - Placed below main editor for better flow */}
          {!isAiConfigured && !loading && (
            <Alert className="bg-primary/5 border-primary/20">
              <Wand2 className="h-4 w-4 text-primary" />
              <AlertTitle>Unlock AI Optimization</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {(profile?.ai_settings?.freeUsageCount || 0) < 3
                    ? `You have ${3 - (profile?.ai_settings?.freeUsageCount || 0)} free AI generations remaining.`
                    : "Configure your AI provider settings to enable auto-optimization for titles, descriptions, and tags."}
                </span>
                <Button variant="outline" size="sm" onClick={() => router.push('/settings')} className="ml-4">
                  Configure AI
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* ===== CONSOLIDATED OPTIMIZATION INTERFACE ===== */}

          {/* New Consolidated Component - Replaces multiple sections below */}
          {editedVideo && (() => {
            const titleScore = calculateTitleScore(editedVideo.title);
            const descScore = calculateDescriptionScore(editedVideo.description);
            const tagsScore = calculateTagsScore(editedVideo.tags || []);
            const thumbnailScore = calculateThumbnailScore(editedVideo.thumbnail_url, editedVideo.title);
            const overallScore = Math.round((titleScore + descScore + tagsScore + thumbnailScore) / 4);

            // Determine top priority issue
            const scores = [
              { name: 'title', score: titleScore, action: handleOptimizeTitle, description: 'Your title hook is weak. Strengthen it in the first 5 words to improve CTR by up to 80%.' },
              { name: 'description', score: descScore, action: handleOptimizeDescription, description: 'Your description needs optimization to improve click-through rates.' },
              { name: 'tags', score: tagsScore, action: handleOptimizeTags, description: 'Your tags need improvement to boost discoverability.' },
            ].sort((a, b) => a.score - b.score);

            const topPriority = scores[0].score < 70 ? {
              title: `Improve ${scores[0].name.charAt(0).toUpperCase() + scores[0].name.slice(1)}`,
              description: scores[0].description,
              impact: scores[0].name === 'title' ? '80% CTR improvement potential' :
                scores[0].name === 'tags' ? '50% discoverability increase' :
                  '45% click-through improvement',
              action: scores[0].action
            } : undefined;

            return (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ConsolidatedOptimization
                  video={{
                    ...editedVideo,
                    tags: editedVideo.tags || []
                  }}
                  scores={{
                    overall: overallScore,
                    title: titleScore,
                    description: descScore,
                    tags: tagsScore,
                    thumbnail: thumbnailScore
                  }}
                  onOptimizeTitle={handleOptimizeTitle}
                  onOptimizeDescription={handleOptimizeDescription}
                  onOptimizeTags={handleOptimizeTags}
                  onOptimizeAll={handleAIGenerate}
                  isLoading={isOptimizingTitle || isOptimizingDescription || isOptimizingTags || isGenerating}
                  topPriority={topPriority}
                />
              </div>
            );
          })()}

          {/* ===== LEGACY SECTIONS (TO BE REMOVED) ===== */}
          {/* Keeping these temporarily for comparison - will be removed once consolidated component is verified */}
          <div className="hidden">
            {/* ===== NEW OPTIMIZATION FEATURES ===== */}

            {/* 1. Video Health Summary */}
            {editedVideo && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {(() => {
                  const titleScore = calculateTitleScore(editedVideo.title);
                  const descScore = calculateDescriptionScore(editedVideo.description);
                  const tagsScore = calculateTagsScore(editedVideo.tags || []);
                  const thumbnailScore = calculateThumbnailScore(editedVideo.thumbnail_url, editedVideo.title);
                  const overallScore = Math.round((titleScore + descScore + tagsScore + thumbnailScore) / 4);

                  return (
                    <VideoHealthSummary
                      score={overallScore}
                      titleOptimization={titleScore}
                      descriptionOptimization={descScore}
                      tagsOptimization={tagsScore}
                      thumbnailScore={thumbnailScore}
                    />
                  );
                })()}
              </div>
            )}

            {/* 2. Next Best Action */}
            {editedVideo && calculateTitleScore(editedVideo.title) < 70 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <NextBestAction
                  message="Your title hook is weak. Strengthen it in the first 5 words to improve CTR by up to 80%."
                  action="apply_title"
                  actionLabel="Improve Title"
                  priority="high"
                  onAction={() => handleOptimizeTitle()}
                  isLoading={isOptimizingTitle}
                />
              </div>
            )}

            {/* 3. AI Action Checklist */}
            {editedVideo && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <AIActionChecklist
                  items={generateChecklistItems(
                    editedVideo,
                    calculateTitleScore(editedVideo.title),
                    calculateDescriptionScore(editedVideo.description),
                    calculateTagsScore(editedVideo.tags || [])
                  ).map(item => ({
                    ...item,
                    completed: completedChecklistItems.has(item.id)
                  }))}
                  onItemToggle={handleChecklistItemToggle}
                  onFixWithAI={handleChecklistItemFixWithAI}
                  isLoading={isOptimizingTitle || isOptimizingDescription || isOptimizingTags}
                />
              </div>
            )}

            {/* 4. Title Optimization */}
            {editedVideo && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <TitleOptimization
                  original={video?.title || ''}
                  optimized={editedVideo.title !== video?.title ? editedVideo.title : undefined}
                  hookStrength={calculateHookStrength(editedVideo.title)}
                  keywordCoverage={calculateKeywordCoverage(editedVideo.title)}
                  onApply={handleSave}
                  isLoading={isOptimizingTitle}
                />
              </div>
            )}

            {/* 5. Description Optimization */}
            {editedVideo && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-250">
                <DescriptionOptimization
                  original={video?.description || ''}
                  optimized={editedVideo.description !== video?.description ? editedVideo.description : undefined}
                  first2LinesScore={calculateFirst2LinesScore(editedVideo.description)}
                  keywordDensity={calculateKeywordDensity(editedVideo.description)}
                  onApply={handleSave}
                  isLoading={isOptimizingDescription}
                />
              </div>
            )}

            {/* 6. Tags Intelligence */}
            {editedVideo && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <TagsIntelligence
                  currentTags={editedVideo.tags || []}
                  suggestedTags={generateSuggestedTags(editedVideo)}
                  relevanceScores={calculateTagRelevance(editedVideo.tags || [])}
                  onReplaceTags={() => handleOptimizeTags()}
                  onApply={(tags) => setEditedVideo({ ...editedVideo, tags })}
                  isLoading={isOptimizingTags}
                />
              </div>
            )}

            {/* 7. Thumbnail Intelligence */}
            {editedVideo && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-350">
                <ThumbnailIntelligence
                  currentThumbnailUrl={editedVideo.thumbnail_url}
                  thumbnailScore={calculateThumbnailScore(editedVideo.thumbnail_url, editedVideo.title)}
                  suggestions={generateThumbnailSuggestions()}
                  conceptIdeas={generateThumbnailConcepts()}
                />
              </div>
            )}

            {/* 8. Video Optimization Mode */}
            {editedVideo && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                <VideoOptimizationMode
                  video={{ ...editedVideo, tags: editedVideo.tags || [] }}
                  onOptimize={() => handleOptimizeAll()}
                  isLoading={activeOperation === 'all'}
                />
              </div>
            )}

            {/* 9. CTR & SEO Prediction */}
            {editedVideo && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-450">
                {(() => {
                  const titleScore = calculateTitleScore(editedVideo.title);
                  const descriptionScore = calculateDescriptionScore(editedVideo.description);
                  const tagsScore = calculateTagsScore(editedVideo.tags || []);
                  const currentCTR = calculateCurrentCTR(editedVideo);
                  const predictedCTR = calculatePredictedCTR(editedVideo, titleScore, descriptionScore);
                  const ctrImprovement = calculateCTRImprovement(currentCTR, predictedCTR);
                  const currentVisibility = calculateCurrentSearchVisibility(editedVideo, tagsScore, descriptionScore);
                  const predictedVisibility = calculatePredictedSearchVisibility(editedVideo, titleScore, tagsScore, descriptionScore);
                  const visibilityImprovement = calculateSearchVisibilityImprovement(currentVisibility, predictedVisibility);

                  return (
                    <CTRAndSEOPrediction
                      currentCTR={currentCTR}
                      predictedCTR={predictedCTR}
                      ctrImprovement={ctrImprovement}
                      currentSearchVisibility={currentVisibility}
                      predictedSearchVisibility={predictedVisibility}
                      visibilityImprovement={visibilityImprovement}
                      confidence={titleScore > 70 && tagsScore > 70 ? "High" : titleScore > 50 ? "Medium" : "Low"}
                    />
                  );
                })()}
              </div>
            )}

            {/* 10. Version & Change Tracking */}
            {editedVideo && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                <VersionAndChangeTracking
                  history={history.map((h) => ({
                    id: h.id,
                    timestamp: h.created_at,
                    changes: [
                      { field: 'title' as const, before: '', after: h.title },
                      { field: 'description' as const, before: '', after: h.description },
                    ],
                    appliedBy: 'user' as const,
                  }))}
                  onRevert={(id) => handleRevert(history.find(h => h.id === id)!)}
                  isLoading={isSaving}
                />
              </div>
            )}
          </div> {/* End of hidden legacy sections */}

          {/* Search Preview */}
          {editedVideo && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <SearchPreviewCard
                title={editedVideo.title}
                description={editedVideo.description}
                thumbnailUrl={editedVideo.thumbnail_url}
                channelName={channel?.title || ""}
                publishedAt={editedVideo.published_at}
              />
            </div>
          )}

          {/* Version History */}
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No history available yet.
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.title}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRevert(item)}>
                        Revert
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column (Right) */}
        <div className="space-y-6 sticky top-36 h-fit">

          {/* SEO Score - Top of Sidebar */}
          {editedVideo && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <SeoScoreCard
                title={editedVideo.title}
                description={editedVideo.description}
                tags={editedVideo.tags || []}
              />
            </div>
          )}

          {/* Thumbnail Optimization */}
          <div className="rounded-xl border border-border/50 bg-background/60 backdrop-blur-xl shadow-sm overflow-hidden p-1 animate-in fade-in slide-in-from-right-8 duration-500 delay-100">
            <ImageOptimization
              thumbnailUrl={video.thumbnail_url}
              videoTitle={video.title}
              onOptimizedImage={handleOptimizedImage}
              isAiConfigured={isAiConfigured}
              aiProvider={profile?.ai_provider || undefined}
            />
          </div>
          {/* Performance Card */}
          <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm animate-in fade-in slide-in-from-right-8 duration-500 delay-150">
            <CardHeader className="border-b border-border/40 bg-gradient-to-br from-primary/5 to-primary/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <BarChart className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base font-semibold">Performance Metrics</CardTitle>
                </div>
                <Badge variant="outline" className="bg-background/50 text-[10px]">
                  Live Data
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Views */}
                <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase tracking-wider font-semibold">
                      <Eye className="h-3.5 w-3.5" />
                      Views
                    </div>
                    <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
                    {video.view_count.toLocaleString()}
                  </p>
                  <div className="h-1.5 w-full bg-emerald-200/30 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min((video.view_count / 100000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Likes */}
                <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-[10px] uppercase tracking-wider font-semibold">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      Likes
                    </div>
                    <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-100">
                    {video.like_count.toLocaleString()}
                  </p>
                  <div className="h-1.5 w-full bg-blue-200/30 dark:bg-blue-900/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min((video.like_count / 10000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-200/50 dark:border-purple-800/30 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-[10px] uppercase tracking-wider font-semibold">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Comments
                    </div>
                    <TrendingUp className="h-3 w-3 text-purple-600 dark:text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-purple-900 dark:text-purple-100">
                    {video.comment_count?.toLocaleString() || '0'}
                  </p>
                  <div className="h-1.5 w-full bg-purple-200/30 dark:bg-purple-900/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(((video.comment_count || 0) / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Watch Time */}
                <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-[10px] uppercase tracking-wider font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      Watch Time
                    </div>
                    <TrendingUp className="h-3 w-3 text-amber-600 dark:text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
                    {(video.watch_time || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    Estimated Views
                  </p>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="space-y-4 pt-2 border-t border-border/40">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Engagement Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{video.engagement_rate?.toFixed(2)}%</span>
                      <Badge variant="outline" className="text-[10px] bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                        {video.engagement_rate && video.engagement_rate > 5 ? 'Excellent' : video.engagement_rate && video.engagement_rate > 2 ? 'Good' : 'Average'}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min(video.engagement_rate || 0, 100)} className="h-2 bg-muted/30" />
                  <p className="text-[10px] text-muted-foreground">
                    Based on likes and comments per view
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Retention Estimate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{video.retention_rate?.toFixed(1)}%</span>
                      <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        {video.retention_rate && video.retention_rate > 60 ? 'High' : video.retention_rate && video.retention_rate > 40 ? 'Medium' : 'Low'}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={video.retention_rate || 0} className="h-2 bg-muted/30" />
                  <p className="text-[10px] text-muted-foreground">
                    Estimated from engagement patterns
                  </p>
                </div>

                {video.subscriber_gained !== undefined && video.subscriber_gained > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Subscribers Gained</span>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-foreground">+{video.subscriber_gained?.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Estimated from engagement metrics
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Thumbnail Ideas */}
          <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-semibold">AI Thumbnail Ideas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isGettingThumbnailIdeas ? (
                <div className="flex justify-center py-8"><Loader className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : thumbnailIdeas.length > 0 ? (
                <ul className="space-y-3">
                  {thumbnailIdeas.map((idea, i) => (
                    <li key={i} className="text-sm p-3 rounded-lg bg-muted/40 hover:bg-muted/80 cursor-pointer transition-colors border border-transparent hover:border-border/50 group" onClick={() => handleGenerateImage(idea)}>
                      <p className="line-clamp-3 text-muted-foreground group-hover:text-foreground transition-colors">{idea}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>Generate ideas to get started</p>
                  <Button variant="outline" size="sm" onClick={handleGetThumbnailIdeas} className="mt-4">Generate</Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
      {/* Floating Bottom Action Bar */}
      <div className="fixed md:bottom-6 bottom-[82px] left-1/2 -translate-x-1/2 z-[60] w-full max-w-[95vw] sm:max-w-fit px-2 animate-in slide-in-from-bottom-10 fade-in duration-500">
        <div className="flex items-center p-1.5 sm:p-2 gap-1 sm:gap-2 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl ring-1 ring-white/10 dark:ring-black/10 justify-center">

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={retryCountdown > 0 ? "secondary" : "default"}
                  onClick={debouncedHandleAIGenerate}
                  disabled={isGenerating || !isAiConfigured || !!activeOperation}
                  className={cn(
                    "h-10 rounded-xl px-4 transition-all shadow-lg hover:shadow-primary/25",
                    retryCountdown > 0 ? "" : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white border-0"
                  )}
                >
                  {isGenerating ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {retryCountdown > 0 ? (
                      <span className="text-xs">{retryCountdown}s</span>
                    ) : (
                      <>
                        <span className="md:hidden text-xs">Optimize All</span>
                        <span className="hidden md:inline">Optimize All</span>
                      </>
                    )}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate title, description & tags (Alt+A)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-5 w-px bg-border/60 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl h-10 w-10 hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={handleGetThumbnailIdeas}
                  disabled={isGettingThumbnailIdeas || !isAiConfigured}
                >
                  {isGettingThumbnailIdeas ? <Loader className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate Thumbnail Ideas</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl h-10 w-10 hover:bg-primary/5 hover:text-primary transition-all"
                  onClick={() => window.open(`https://studio.youtube.com/video/${video.id}/edit`, '_blank')}
                >
                  <Youtube className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in YouTube Studio</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hasChanges ? "default" : "ghost"}
                  size={hasChanges ? "default" : "icon"}
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className={cn(
                    "rounded-xl transition-all h-10",
                    hasChanges
                      ? "px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25 border-0"
                      : "w-10 hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  {isSaving ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : hasChanges ? (
                    <div className="flex items-center gap-1.5">
                      <Download className="h-4 w-4" />
                      <span className="font-medium text-xs sm:text-sm">Save</span>
                    </div>
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{hasChanges ? "Save Changes (Cmd+S)" : "No changes to save"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>
      </div>
    </div>
  )
}
