/**
 * Centralized Rate Limiter for AI Provider APIs
 * 
 * Implements a per-user token bucket algorithm to enforce rate limits across all API endpoints.
 * Prevents 429 errors by proactively managing request rates with queuing and timeout handling.
 * 
 * **Per-User Isolation**: Each user has independent rate limit quotas per provider.
 * Multiple users do not share or interfere with each other's rate limits.
 * 
 * **IMPORTANT**: All functions require a `userId` parameter. For authenticated routes,
 * pass `session.user.id`. For unauthenticated routes (if any), derive a stable key such as
 * `anonymous:${hashedIP}` to prevent sharing a single undefined bucket across all anonymous users.
 * 
 * **Configurable Limits**: Provider limits are defined in `PROVIDER_LIMITS` and can be adjusted
 * based on your account's actual quotas. Consider making these configurable via environment
 * variables for production deployments.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface RateLimitStatus {
  availableTokens: number
  queuedRequests: number
  estimatedWaitMs: number
  percentAvailable: number
  status: 'available' | 'limited' | 'exhausted'
}

export interface ProviderLimits {
  capacity: number
  refillRate: number
  /** Maximum queue wait time in milliseconds before timing out */
  timeout: number
}

export interface RateLimiterConfig {
  capacity: number
  refillRate: number
}

interface QueuedRequest {
  id: number
  resolve: () => void
  reject: (error: Error) => void
  timestamp: number
  timeoutId: ReturnType<typeof setTimeout>
}

// ============================================================================
// Custom Error Classes
// ============================================================================

export class RateLimitTimeoutError extends Error {
  constructor(provider: string, waitTimeMs: number, timeoutMs: number) {
    const waitTimeSec = Math.ceil(waitTimeMs / 1000)
    const timeoutSec = Math.ceil(timeoutMs / 1000)
    super(
      `Rate limit timeout for ${provider}. ` +
      `The request could not be processed within the ${timeoutSec}s timeout period. ` +
      `Estimated wait time: ${waitTimeSec} seconds. ` +
      `This typically occurs when the request queue is backed up due to free tier rate limits. ` +
      `Please try again in a moment or check the rate limiter status via the debug endpoint.`
    )
    this.name = 'RateLimitTimeoutError'
  }
}

// ============================================================================
// Provider Configuration
// ============================================================================

/**
 * Rate limit configuration for each AI provider.
 * 
 * These limits should match your actual provider account quotas:
 * - **Gemini Free Tier**: 60 requests/minute (documented limit), 15s timeout
 * - **Anthropic Free Tier**: 5 requests/minute (conservative estimate), 10s timeout
 * - **OpenAI**: 60 requests/minute (adjust based on your tier: free/paid/enterprise), 10s timeout
 * - **Mistral**: 60 requests/minute (adjust based on your tier), 10s timeout
 * 
 * **Timeout Configuration**: Provider-specific timeouts accommodate different rate limits.
 * Gemini's higher capacity (60 req/min) gets a longer timeout (15s) for queue processing,
 * while more restrictive tiers get shorter timeouts (10s) to fail faster.
 * 
 * **Configuration Recommendation**: Extract these to environment variables
 * (e.g., RATE_LIMIT_GEMINI_CAPACITY, RATE_LIMIT_GEMINI_REFILL_RATE, RATE_LIMIT_GEMINI_TIMEOUT) for
 * production deployments to avoid hard-coded mismatches with actual quotas.
 */
export const PROVIDER_LIMITS: Record<string, ProviderLimits> = {
  gemini: {
    capacity: 15,      // 15 requests per minute (Free Tier limit)
    refillRate: 15 / 60, // 0.25 tokens per second
    timeout: 20000,    // 20 seconds - longer timeout to accommodate slower queue processing
  },
  anthropic: {
    capacity: 5,       // 5 requests per minute (free tier)
    refillRate: 5 / 60,  // ~0.0833 tokens per second (5 per minute)
    timeout: 10000,    // 10 seconds - reasonable for restrictive free tier
  },
  openai: {
    capacity: 60,      // 60 requests/minute (adjust for your tier)
    refillRate: 1,     // 1 token per second
    timeout: 10000,    // 10 seconds - reasonable default
  },
  mistral: {
    capacity: 60,      // 60 requests/minute (adjust for your tier)
    refillRate: 1,     // 1 token per second
    timeout: 10000,    // 10 seconds - reasonable default
  },
}

// ============================================================================
// TokenBucket Class
// ============================================================================

class TokenBucket {
  private tokens: number
  private lastRefillTime: number
  private readonly capacity: number
  private readonly refillRate: number

  constructor(config: RateLimiterConfig) {
    this.capacity = config.capacity
    this.refillRate = config.refillRate
    this.tokens = config.capacity // Start with full capacity
    this.lastRefillTime = performance.now()
  }

  /**
   * Refills tokens based on elapsed time since last refill
   */
  refill(): void {
    const now = performance.now()
    const elapsedSeconds = (now - this.lastRefillTime) / 1000
    const tokensToAdd = elapsedSeconds * this.refillRate

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
      this.lastRefillTime = now
    }
  }

  /**
   * Attempts to consume a token
   * @returns true if token was consumed, false if no tokens available
   */
  tryConsume(): boolean {
    this.refill()

    if (this.tokens >= 1) {
      this.tokens -= 1
      return true
    }

    return false
  }

  /**
   * Calculates milliseconds until next token is available
   */
  getWaitTime(): number {
    this.refill()

    if (this.tokens >= 1) {
      return 0
    }

    const tokensNeeded = 1 - this.tokens
    const secondsToWait = tokensNeeded / this.refillRate
    return Math.ceil(secondsToWait * 1000)
  }

  /**
   * Gets current number of available tokens
   */
  getAvailableTokens(): number {
    this.refill()
    return this.tokens
  }
}

// ============================================================================
// RateLimiter Class
// ============================================================================

class RateLimiter {
  private buckets: Map<string, Map<string, TokenBucket>> = new Map()
  private queues: Map<string, Map<string, QueuedRequest[]>> = new Map()
  private queueProcessors: Map<string, Map<string, ReturnType<typeof setTimeout>>> = new Map()
  private requestIdCounter: number = 0

  /**
   * Gets or creates a token bucket for a provider and user
   */
  private getBucket(provider: string, userId: string): TokenBucket {
    // Get or create the user's bucket map
    if (!this.buckets.has(userId)) {
      this.buckets.set(userId, new Map())
    }
    const userBuckets = this.buckets.get(userId)!

    // Get or create the provider bucket
    if (!userBuckets.has(provider)) {
      const limits = PROVIDER_LIMITS[provider]
      if (!limits) {
        throw new Error(`No rate limit configuration found for provider: ${provider}`)
      }
      userBuckets.set(provider, new TokenBucket(limits))
    }
    return userBuckets.get(provider)!
  }

  /**
   * Gets or creates a queue for a provider and user
   */
  private getQueue(provider: string, userId: string): QueuedRequest[] {
    // Get or create the user's queue map
    if (!this.queues.has(userId)) {
      this.queues.set(userId, new Map())
    }
    const userQueues = this.queues.get(userId)!

    // Get or create the provider queue
    if (!userQueues.has(provider)) {
      userQueues.set(provider, [])
    }
    return userQueues.get(provider)!
  }

  /**
   * Processes queued requests for a provider and user
   */
  private processQueue(provider: string, userId: string): void {
    const bucket = this.getBucket(provider, userId)
    const queue = this.getQueue(provider, userId)

    while (queue.length > 0) {
      const canConsume = bucket.tryConsume()

      if (!canConsume) {
        // No tokens available, schedule next check
        const nextDelay = Math.max(50, bucket.getWaitTime())
        const timeoutId = setTimeout(() => {
          this.processQueue(provider, userId)
        }, nextDelay)

        // Get or create processor map for user
        if (!this.queueProcessors.has(userId)) {
          this.queueProcessors.set(userId, new Map())
        }
        this.queueProcessors.get(userId)!.set(provider, timeoutId)
        break
      }

      // Token consumed, process the next request
      const request = queue.shift()!
      clearTimeout(request.timeoutId)
      console.log(`[RATE-LIMITER] Processing queued request #${request.id} for ${provider} (waited ${Date.now() - request.timestamp}ms). Remaining queue: ${queue.length}`)
      request.resolve()
    }

    // Stop processing if queue is empty
    if (queue.length === 0) {
      const userProcessors = this.queueProcessors.get(userId)
      if (userProcessors) {
        const processorId = userProcessors.get(provider)
        if (processorId) {
          clearTimeout(processorId)
          userProcessors.delete(provider)
        }
      }
    }
  }

  /**
   * Starts the queue processor for a provider and user if not already running
   */
  private startQueueProcessor(provider: string, userId: string): void {
    const userProcessors = this.queueProcessors.get(userId)
    if (!userProcessors || !userProcessors.has(provider)) {
      const bucket = this.getBucket(provider, userId)
      const nextDelay = Math.max(50, bucket.getWaitTime())
      const timeoutId = setTimeout(() => {
        this.processQueue(provider, userId)
      }, nextDelay)

      // Get or create processor map for user
      if (!this.queueProcessors.has(userId)) {
        this.queueProcessors.set(userId, new Map())
      }
      this.queueProcessors.get(userId)!.set(provider, timeoutId)
    }
  }

  /**
   * Acquires rate limit permission for a provider and user
   * @param provider The AI provider name (e.g., 'gemini')
   * @param userId The user ID to scope the rate limit to
   * @param timeoutMs Maximum time to wait in queue (default: provider-specific timeout from PROVIDER_LIMITS)
   * @returns Promise that resolves when rate limit is acquired
   */
  async acquireRateLimit(provider: string, userId: string, timeoutMs?: number): Promise<void> {
    const bucket = this.getBucket(provider, userId)

    // Get provider-specific timeout configuration
    const defaultTimeout = PROVIDER_LIMITS[provider]?.timeout ?? 15000
    const effectiveTimeout = timeoutMs ?? defaultTimeout

    const availableTokens = bucket.getAvailableTokens()
    const queue = this.getQueue(provider, userId)
    console.log(`[RATE-LIMITER] ${provider} for user ${userId.substring(0, 8)}: ${availableTokens.toFixed(2)} tokens available, queue length: ${queue.length}`)

    // Try to consume a token immediately
    if (bucket.tryConsume()) {
      console.log(`[RATE-LIMITER] Token consumed immediately for ${provider}`)
      return Promise.resolve()
    }

    // No tokens available, add to queue
    return new Promise<void>((resolve, reject) => {
      const queue = this.getQueue(provider, userId)
      const timestamp = Date.now()
      const requestId = ++this.requestIdCounter

      // Compute estimated wait time considering queue length
      const limits = PROVIDER_LIMITS[provider]
      const availableTokens = bucket.getAvailableTokens()
      const jobsNeeded = Math.max(0, queue.length + 1 - availableTokens)
      const estimatedWaitMs = Math.ceil((jobsNeeded / limits.refillRate) * 1000)

      console.log(`[RATE-LIMITER] No tokens available for ${provider}, queueing request #${requestId}. Queue position: ${queue.length + 1}, Estimated wait: ${estimatedWaitMs}ms, Timeout: ${effectiveTimeout}ms`)

      // Set up timeout
      const timeoutId = setTimeout(() => {
        // Remove from queue by id
        const index = queue.findIndex(req => req.id === requestId)
        if (index !== -1) {
          queue.splice(index, 1)
        }

        // Compute updated wait time at rejection
        const currentAvailableTokens = bucket.getAvailableTokens()
        const currentQueue = this.getQueue(provider, userId)
        const currentJobsNeeded = Math.max(0, currentQueue.length - currentAvailableTokens)
        const currentWaitMs = Math.ceil((currentJobsNeeded / limits.refillRate) * 1000)

        console.error(`[RATE-LIMITER] Request #${requestId} timed out for ${provider} after ${effectiveTimeout}ms (waited ${Date.now() - timestamp}ms). Queue length: ${queue.length}, Available tokens: ${currentAvailableTokens.toFixed(2)}, Estimated wait: ${currentWaitMs}ms`)
        reject(new RateLimitTimeoutError(provider, currentWaitMs, effectiveTimeout))
      }, effectiveTimeout)

      // Add to queue
      const request: QueuedRequest = {
        id: requestId,
        resolve,
        reject,
        timestamp,
        timeoutId,
      }
      queue.push(request)
      console.log(`[RATE-LIMITER] Request #${requestId} added to queue for ${provider}. Total queued: ${queue.length}`)

      // Start queue processor if not already running
      this.startQueueProcessor(provider, userId)
    })
  }

  /**
   * Gets the current status of rate limiting for a provider and user
   * @param provider The AI provider name
   * @param userId The user ID
   */
  getStatus(provider: string, userId: string): RateLimitStatus {
    const bucket = this.getBucket(provider, userId)
    const queue = this.getQueue(provider, userId)
    const limits = PROVIDER_LIMITS[provider]

    // Compute estimated wait time considering queue length
    const availableTokens = bucket.getAvailableTokens()
    const jobsNeeded = Math.max(0, queue.length + (availableTokens >= 1 ? 0 : 1) - availableTokens)
    const estimatedWaitMs = Math.ceil((jobsNeeded / limits.refillRate) * 1000)

    // Calculate percentage available
    const percentAvailable = (availableTokens / limits.capacity) * 100

    // Determine status
    let status: 'available' | 'limited' | 'exhausted'
    if (availableTokens > limits.capacity * 0.5) {
      status = 'available'
    } else if (availableTokens > 0) {
      status = 'limited'
    } else {
      status = 'exhausted'
    }

    return {
      availableTokens: Math.floor(availableTokens),
      queuedRequests: queue.length,
      estimatedWaitMs,
      percentAvailable: Math.floor(percentAvailable),
      status,
    }
  }

  /**
   * Gets status for all providers for a given user
   * @param userId The user ID
   * @returns Map of provider name to status
   */
  getAllStatus(userId: string): Map<string, RateLimitStatus> {
    const statusMap = new Map<string, RateLimitStatus>()

    // Check all known providers
    for (const provider of Object.keys(PROVIDER_LIMITS)) {
      statusMap.set(provider, this.getStatus(provider, userId))
    }

    return statusMap
  }

  /**
   * Check if provider has tokens available for immediate use
   * @param provider The AI provider name
   * @param userId The user ID
   * @returns true if tokens available, false if exhausted
   */
  isAvailable(provider: string, userId: string): boolean {
    const bucket = this.getBucket(provider, userId)
    return bucket.getAvailableTokens() > 0
  }

  /**
   * Get time until next token is available
   * @param provider The AI provider name
   * @param userId The user ID
   * @returns Milliseconds until next token available (0 if already available)
   */
  getTimeUntilNextToken(provider: string, userId: string): number {
    const bucket = this.getBucket(provider, userId)
    const availableTokens = bucket.getAvailableTokens()

    if (availableTokens >= 1) {
      return 0
    }

    const limits = PROVIDER_LIMITS[provider]
    const tokensNeeded = 1 - availableTokens
    return Math.ceil((tokensNeeded / limits.refillRate) * 1000)
  }

  /**
   * Resets the rate limiter for a provider (useful for testing)
   */
  reset(provider?: string, userId?: string): void {
    if (userId && provider) {
      // Reset specific provider for specific user
      const userBuckets = this.buckets.get(userId)
      if (userBuckets) {
        userBuckets.delete(provider)
      }

      const userQueues = this.queues.get(userId)
      if (userQueues) {
        const queue = userQueues.get(provider)
        if (queue) {
          queue.forEach(req => clearTimeout(req.timeoutId))
          userQueues.delete(provider)
        }
      }

      const userProcessors = this.queueProcessors.get(userId)
      if (userProcessors) {
        const processorId = userProcessors.get(provider)
        if (processorId) {
          clearTimeout(processorId)
          userProcessors.delete(provider)
        }
      }
    } else if (userId) {
      // Reset all providers for specific user
      this.buckets.delete(userId)

      const userQueues = this.queues.get(userId)
      if (userQueues) {
        userQueues.forEach(queue => {
          queue.forEach(req => clearTimeout(req.timeoutId))
        })
        this.queues.delete(userId)
      }

      const userProcessors = this.queueProcessors.get(userId)
      if (userProcessors) {
        userProcessors.forEach(processorId => clearTimeout(processorId))
        this.queueProcessors.delete(userId)
      }
    } else if (provider) {
      // Reset specific provider for all users
      this.buckets.forEach(userBuckets => {
        userBuckets.delete(provider)
      })

      this.queues.forEach(userQueues => {
        const queue = userQueues.get(provider)
        if (queue) {
          queue.forEach(req => clearTimeout(req.timeoutId))
          userQueues.delete(provider)
        }
      })

      this.queueProcessors.forEach(userProcessors => {
        const processorId = userProcessors.get(provider)
        if (processorId) {
          clearTimeout(processorId)
          userProcessors.delete(provider)
        }
      })
    } else {
      // Reset all providers for all users
      this.buckets.clear()
      this.queues.forEach(userQueues => {
        userQueues.forEach(queue => {
          queue.forEach(req => clearTimeout(req.timeoutId))
        })
      })
      this.queues.clear()
      this.queueProcessors.forEach(userProcessors => {
        userProcessors.forEach(processorId => clearTimeout(processorId))
      })
      this.queueProcessors.clear()
      this.requestIdCounter = 0
    }
  }
}

// ============================================================================
// Singleton Instance and Exports
// ============================================================================

/**
 * Singleton instance of the rate limiter
 */
export const rateLimiter = new RateLimiter()

/**
 * Convenience function to acquire rate limit
 * @param provider The AI provider name (e.g., 'gemini')
 * @param userId The user ID to scope the rate limit to
 * @param timeoutMs Maximum time to wait in queue (default: provider-specific timeout from PROVIDER_LIMITS)
 */
export const acquireRateLimit = (provider: string, userId: string, timeoutMs?: number): Promise<void> => {
  return rateLimiter.acquireRateLimit(provider, userId, timeoutMs)
}

/**
 * Convenience function to get rate limit status
 * @param provider The AI provider name (e.g., 'gemini')
 * @param userId The user ID
 */
export const getRateLimitStatus = (provider: string, userId: string): RateLimitStatus => {
  return rateLimiter.getStatus(provider, userId)
}
