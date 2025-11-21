import { useState, useEffect, useCallback, useRef } from 'react'

interface ProviderUsage {
  provider: string
  configured: boolean
  usage?: {
    used?: number
    limit?: number
    remaining?: number
    percentageUsed?: number
  }
  billing?: {
    balance?: number
    costThisMonth?: number
    currency?: string
  }
  rateLimit?: {
    requestsPerMinute?: number
    tokensPerMinute?: number
    requestsRemaining?: number
    tokensRemaining?: number
    resetTime?: string
  }
  quota?: {
    totalTokens?: number
    usedTokens?: number
    remainingTokens?: number
    resetDate?: string
    daysUntilReset?: number
  }
  error?: string
  lastChecked?: string
  isStatic?: boolean // Indicates if this provider returns static data (no live usage tracking)
  trackingAvailable?: boolean // Whether usage tracking is available from the provider
}

interface UseProviderUsageReturn {
  usage: ProviderUsage | Record<string, ProviderUsage> | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastUpdated: Date | null
}

export function useProviderUsage(provider?: string): UseProviderUsageReturn {
  const [usage, setUsage] = useState<ProviderUsage | Record<string, ProviderUsage> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isFetchingRef = useRef(false)
  const hasLoadedOnceRef = useRef(false)
  const lastFetchTimeRef = useRef<number>(0)
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const [lastError, setLastError] = useState<'setup' | 'billing' | 'network' | null>(null)
  const [pollingInterval, setPollingInterval] = useState(30 * 1000) // Default 30 seconds

  const fetchUsage = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      console.log('[PROVIDER-USAGE] Skipping fetch - already in progress')
      return
    }
    
    // Client-side guard: skip refetch if last fetch was within TTL (30s)
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTimeRef.current
    const minFetchInterval = 30 * 1000 // 30 seconds to match server cache TTL
    
    if (hasLoadedOnceRef.current && timeSinceLastFetch < minFetchInterval) {
      console.log(`[PROVIDER-USAGE] Skipping fetch - last fetch was ${Math.round(timeSinceLastFetch / 1000)}s ago (min interval: ${minFetchInterval / 1000}s)`)
      return
    }

    try {
      isFetchingRef.current = true
      // Only show loading spinner on initial fetch, not on subsequent polls
      if (!hasLoadedOnceRef.current) {
        setLoading(true)
      }
      setError(null)

      const url = provider
        ? `/api/ai/provider-usage?provider=${provider}`
        : `/api/ai/provider-usage`

      console.log(`[PROVIDER-USAGE] Fetching from ${url} (cached response possible)`)
      const response = await fetch(url)

      const data = await response.json()
      console.log(`[PROVIDER-USAGE] Raw response (may be cached):`, JSON.stringify(data, null, 2))
      
      // The provider-usage endpoint returns 200 even for provider errors
      // The error is in the response body, not the HTTP status
      if (!response.ok && !data) {
        throw new Error(`Failed to fetch usage: ${response.statusText}`)
      }

      // Check for database/setup errors (case-insensitive)
      const errorLower = data?.error ? data.error.toLowerCase() : ''
      const hasSetupError = data?.error && (
        errorLower.includes('database') || 
        errorLower.includes('migration') || 
        errorLower.includes('table')
      )
      
      const hasBillingError = data?.error && (
        errorLower.includes('billing') ||
        errorLower.includes('credit') ||
        errorLower.includes('balance')
      )

      if (hasSetupError) {
        setLastError('setup')
        setConsecutiveErrors(prev => prev + 1)
        // For setup errors, slow down polling to reduce unnecessary API calls
        setPollingInterval(5 * 60 * 1000) // 5 minutes
        console.log('[PROVIDER-USAGE] Setup error detected - reducing polling interval to 5 minutes')
      } else if (hasBillingError) {
        setLastError('billing')
        setConsecutiveErrors(prev => prev + 1)
        console.log('[PROVIDER-USAGE] Billing error detected')
      } else if (data?.configured === false) {
        setLastError('network')
        setConsecutiveErrors(prev => prev + 1)
        console.log('[PROVIDER-USAGE] Network/configuration error detected')
      } else {
        // Success - reset error tracking
        setConsecutiveErrors(0)
        setLastError(null)
        
        // Check if provider returns static data and adjust polling accordingly
        const isStaticData = data?.isStatic || 
          (provider && ['gemini', 'mistral'].includes(provider)) ||
          (typeof data === 'object' && data !== null && !Array.isArray(data) && 
           Object.values(data as Record<string, any>).some((p: any) => p?.isStatic))
        
        if (isStaticData) {
          // For static providers (Gemini, Mistral), poll every 5 minutes
          setPollingInterval(5 * 60 * 1000) // 5 minutes
          console.log('[PROVIDER-USAGE] Static data provider detected - reducing polling interval to 5 minutes')
        } else {
          // For dynamic providers (OpenAI, Anthropic), poll every 30 seconds
          setPollingInterval(30 * 1000) // 30 seconds
        }
      }

      // Always set the usage data, even if it contains an error
      setUsage(data)
      setLastUpdated(new Date())
      lastFetchTimeRef.current = Date.now()
      hasLoadedOnceRef.current = true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      setLastError('network')
      setConsecutiveErrors(prev => prev + 1)
      console.error('[PROVIDER-USAGE] Fetch error:', message)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [provider])

  useEffect(() => {
    fetchUsage()
    // Use dynamic polling interval based on error state
    const interval = setInterval(fetchUsage, pollingInterval)
    console.log(`[PROVIDER-USAGE] Polling interval set to ${pollingInterval / 1000} seconds`)
    return () => clearInterval(interval)
  }, [fetchUsage, pollingInterval])

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage,
    lastUpdated
  }
}
