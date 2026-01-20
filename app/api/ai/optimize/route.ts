import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { RateLimitTimeoutError } from '@/lib/rate-limiter'
import {
  handleGenerateAllOpenAI,
  handleGenerateAllGemini,
  handleGenerateAllAnthropic,
  handleGenerateAllMistral
} from '@/lib/ai-generate-all-handlers'

interface AiSettings {
  defaultModel: string
  temperature: 'precise' | 'balanced' | 'creative'
  maxTitleLength?: number
  maxDescriptionLength?: number
}

interface AiSettingsRpcResponse {
  provider: string | null
  settings: {
    features: AiSettings
    apiKeys: { [key: string]: string }
  } | null
}

// ============================================================================
// Request Deduplication Infrastructure
// ============================================================================

/**
 * Metadata for in-flight request tracking
 */
interface InFlightRequestMetadata {
  promise: Promise<{ title: string; description: string; tags: string[] }>
  startedAt: number // Unix timestamp in milliseconds
}

/**
 * In-memory Map to track in-flight AI optimization requests.
 * 
 * Strategy: When multiple identical requests arrive (same user, title, description),
 * we return the existing promise instead of making duplicate AI API calls.
 * This prevents rate limiter exhaustion and redundant API costs.
 * 
 * Stores promises that resolve to raw data payloads (not NextResponse objects)
 * to allow wrapping each duplicate request with a fresh NextResponse.
 * 
 * Cleanup: Entries are automatically removed after a brief cooldown period to allow
 * the same request to be made again if needed. Additionally, a periodic sweep removes
 * stale entries older than TTL.
 * 
 * Note: This is in-memory storage and will reset on server restart.
 */
const inFlightRequests = new Map<string, InFlightRequestMetadata>()

/**
 * Configuration for request deduplication
 */
const DEDUP_CONFIG = {
  MAX_MAP_SIZE: 200,           // Maximum entries before eviction
  TTL_MS: 5 * 60 * 1000,       // 5 minutes TTL for stale entries
  CLEANUP_INTERVAL_MS: 60 * 1000 // Run cleanup every 60 seconds
}

/**
 * Periodic cleanup to remove stale entries from the in-flight requests map.
 * Removes entries older than TTL and enforces max map size.
 */
function cleanupStaleRequests(): void {
  const now = Date.now()
  const ttlThreshold = now - DEDUP_CONFIG.TTL_MS
  let removedCount = 0

  // Remove stale entries older than TTL
  for (const [key, metadata] of inFlightRequests.entries()) {
    if (metadata.startedAt < ttlThreshold) {
      inFlightRequests.delete(key)
      removedCount++
      console.log('[DEDUP] Removed stale entry (age:', Math.round((now - metadata.startedAt) / 1000), 's):', key)
    }
  }

  // If map still exceeds max size, evict oldest entries
  if (inFlightRequests.size > DEDUP_CONFIG.MAX_MAP_SIZE) {
    const sortedEntries = Array.from(inFlightRequests.entries())
      .sort((a, b) => a[1].startedAt - b[1].startedAt)

    const toRemove = inFlightRequests.size - DEDUP_CONFIG.MAX_MAP_SIZE
    for (let i = 0; i < toRemove; i++) {
      const [key] = sortedEntries[i]
      inFlightRequests.delete(key)
      removedCount++
      console.log('[DEDUP] Evicted oldest entry to enforce max size:', key)
    }
  }

  if (removedCount > 0) {
    console.log(`[DEDUP] Cleanup complete: removed ${removedCount} entries, current size: ${inFlightRequests.size}`)
  }
}

// Start periodic cleanup interval
const cleanupInterval = setInterval(cleanupStaleRequests, DEDUP_CONFIG.CLEANUP_INTERVAL_MS)

// Ensure cleanup interval is cleared on server shutdown (Node.js)
if (typeof process !== 'undefined' && process.on) {
  process.on('SIGTERM', () => {
    clearInterval(cleanupInterval)
    console.log('[DEDUP] Cleanup interval cleared on SIGTERM')
  })
  process.on('SIGINT', () => {
    clearInterval(cleanupInterval)
    console.log('[DEDUP] Cleanup interval cleared on SIGINT')
  })
}

/**
 * Generates a unique key for request deduplication.
 * Uses SHA-256 hashing of the full userId, title, and description to create
 * a stable, compact identifier while preserving uniqueness.
 * 
 * @param userId - The user's unique identifier
 * @param title - Full video title
 * @param description - Full video description
 * @returns Unique hashed request key for deduplication
 */
function generateRequestKey(userId: string, title: string, description: string): string {
  // Create hash using Node.js crypto module
  const crypto = require('crypto')
  const hash = crypto.createHash('sha256')

  // Concatenate with separators to avoid collision edge cases
  const combined = `${userId}::${title}::${description}`
  hash.update(combined)

  return hash.digest('hex')
}

/**
 * Schedules cleanup of a completed request from the in-flight Map.
 * The delay ensures the same request can be made again after a cooldown period.
 * 
 * @param key - The request key to clean up (full hash)
 * @param delay - Milliseconds to wait before cleanup (default: 1000ms)
 */
function cleanupRequest(key: string, delay: number = 1000): void {
  setTimeout(() => {
    inFlightRequests.delete(key)
    console.log('[DEDUP] Cleaned up request key:', key)
  }, delay)
}

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  let profile: AiSettingsRpcResponse | null = null
  let provider = 'unknown'

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract user ID for per-user rate limiting
    const userId = session.user.id

    const { data, error } = await supabase.rpc('get_ai_settings')

    if (error) {
      console.error('Error fetching AI settings:', error)
      return NextResponse.json({ error: 'Failed to fetch AI settings' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'AI settings not found' }, { status: 404 })
    }

    profile = {
      provider: data[0].provider,
      settings: data[0].settings
    } as AiSettingsRpcResponse
    provider = profile.provider || 'unknown'
    let apiKey = provider && profile.settings?.apiKeys ? profile.settings.apiKeys[provider] : null

    // Free Plan Logic
    if (!profile.provider || !apiKey) {
      const settingsAny = profile.settings as any
      const freeUsage = settingsAny?.freeUsageCount || 0
      if (freeUsage < 3) {
        console.log(`[FREE-PLAN] User ${session.user.id} using free generation (${freeUsage + 1}/3)`)

        apiKey = process.env.SYSTEM_GEMINI_API_KEY || null
        provider = 'gemini'

        if (!apiKey) {
          return NextResponse.json(
            { error: 'Free tier system key not configured. Please contact support.' },
            { status: 500 }
          )
        }

        const newSettings = {
          ...profile.settings,
          freeUsageCount: freeUsage + 1
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ settings: newSettings })
          .eq('id', session.user.id)

        if (updateError) {
          console.error('[FREE-PLAN] Failed to update usage count:', updateError)
        }
      } else {
        return NextResponse.json(
          { error: 'AI provider not configured and free generations exhausted.' },
          { status: 400 }
        )
      }
    }

    const body = await req.json()
    const { title, description } = body
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Capture settings reference for use in async closure
    const userSettings = profile.settings || { features: {} }
    const selectedProvider = profile.provider

    // ========================================================================
    // Request Deduplication Check
    // ========================================================================

    const requestKey = generateRequestKey(userId, title, description)
    const existingMetadata = inFlightRequests.get(requestKey)

    if (existingMetadata) {
      console.log('[DEDUP] Duplicate request detected, returning fresh response with cached data')
      try {
        const cachedData = await existingMetadata.promise
        return NextResponse.json(cachedData)
      } catch (error) {
        // If cached promise failed, let it propagate
        throw error
      }
    }

    // Check map size to warn about potential issues
    if (inFlightRequests.size > DEDUP_CONFIG.MAX_MAP_SIZE) {
      console.warn(`[DEDUP] In-flight requests map size (${inFlightRequests.size}) exceeds max size (${DEDUP_CONFIG.MAX_MAP_SIZE})`)
    }

    const requestStartTime = Date.now()

    console.log('[DEDUP] New request registered:', {
      key: requestKey,
      mapSize: inFlightRequests.size,
      startedAt: new Date(requestStartTime).toISOString()
    })

    // Create new promise for this request
    const requestPromise = (async () => {
      try {
        let result;
        switch (selectedProvider) {
          case 'openai':
            result = await handleGenerateAllOpenAI(apiKey, title, description, userSettings.features as any, userId)
            break;
          case 'anthropic':
            result = await handleGenerateAllAnthropic(apiKey, title, description, userSettings.features as any, userId)
            break;
          case 'mistral':
            result = await handleGenerateAllMistral(apiKey, title, description, userSettings.features as any, userId)
            break;
          case 'gemini':
            result = await handleGenerateAllGemini(apiKey, title, description, userSettings.features as any, userId)
            break;
          default:
            throw new Error('Unsupported AI provider')
        }
        return result;
      } catch (error) {
        throw error;
      }
    })()

    // Store in map
    inFlightRequests.set(requestKey, {
      promise: requestPromise,
      startedAt: Date.now()
    })

    // Wait for result
    try {
      const result = await requestPromise

      // Schedule cleanup after success
      cleanupRequest(requestKey)

      return NextResponse.json(result)
    } catch (error: any) {
      // Schedule immediate cleanup on failure so user can retry
      cleanupRequest(requestKey, 0)

      console.error(`[AI_OPTIMIZE_ERROR] Error processing request for ${selectedProvider}:`, {
        message: error.message,
        name: error.name,
        stack: error.stack,
        status: error.status,
        response: error.response,
        fullError: error // Log the full error object for debugging
      })

      // Handle rate limit timeout errors from centralized limiter
      if (error instanceof RateLimitTimeoutError || error.name === 'RateLimitTimeoutError') {
        console.warn(`[AI_OPTIMIZE_ERROR] Internal Rate Limit Timeout for ${selectedProvider}`)
        return NextResponse.json({
          error: error.message,
          errorCode: 'rate_limit_timeout'
        }, { status: 429 })
      }

      // Handle provider rate limit errors (429)
      if (error.status === 429 || /429|rate.?limit|too many requests|quota exceeded/i.test(error.message)) {
        console.warn(`[AI_OPTIMIZE_ERROR] Provider Rate Limit Exceeded for ${selectedProvider}`)
        return NextResponse.json({
          error: `Your ${provider} provider is currently rate limited. Please wait a moment and try again.`,
          errorCode: 'rate_limit_error'
        }, { status: 429 });
      }

      throw error
    }


  } catch (error) {
    console.error('[AI_OPTIMIZE_ERROR]', error)

    // Handle rate limit timeout errors from centralized limiter
    if (error instanceof RateLimitTimeoutError) {
      return NextResponse.json({
        error: error.message,
        errorCode: 'rate_limit_timeout'
      }, { status: 429 })
    }

    if (error instanceof Error) {
      const errorMessage = error.message;

      // Handle rate limit errors (429)
      if (/429|rate.?limit|too many requests|quota exceeded/i.test(errorMessage)) {
        return NextResponse.json({
          error: `Your ${provider} provider is currently rate limited. Please wait a moment and try again.`,
          errorCode: 'rate_limit_error'
        }, { status: 429 });
      }

      // Handle billing/credit errors (improved regex to avoid false positives)
      if (/insufficient.*credit|credit.*balance.*low|billing.*required|payment.*required|quota.*exceeded/i.test(errorMessage)) {
        return NextResponse.json({
          error: `Your ${provider} account has a billing issue. Please check your credits or plan on the provider's website.`,
          errorCode: 'billing_error'
        }, { status: 400 });
      }

      if (/api key/i.test(errorMessage) || /authentication/i.test(errorMessage) || /unauthorized/i.test(errorMessage)) {
        return NextResponse.json({ error: 'The provided API key is invalid or has been rejected by the provider.' }, { status: 401 })
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
