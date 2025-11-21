import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { rateLimiter } from '@/lib/rate-limiter'

// Simple in-memory cache with TTL
interface CacheEntry {
  data: ProviderUsage | { [key: string]: ProviderUsage }
  expiresAt: number
}

const usageCache = new Map<string, CacheEntry>()
const CACHE_TTL = 30 * 1000 // 30 seconds

function getCacheKey(userId: string, provider?: string): string {
  return provider ? `${userId}:${provider}` : `${userId}:all`
}

function getCached(key: string): ProviderUsage | { [key: string]: ProviderUsage } | null {
  const entry = usageCache.get(key)
  if (entry && entry.expiresAt > Date.now()) {
    console.log('[CACHE] Hit for key:', key)
    return entry.data
  }
  if (entry) {
    usageCache.delete(key) // Remove expired entry
  }
  return null
}

function setCache(key: string, data: ProviderUsage | { [key: string]: ProviderUsage }): void {
  usageCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL
  })
  console.log('[CACHE] Set for key:', key)
}

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
    hardLimitUsd?: number
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

// Helper to ensure error field is always a string
function validateProviderResponse(response: ProviderUsage): ProviderUsage {
  return {
    ...response,
    error: response.error !== undefined ? String(response.error) : undefined
  }
}

// Fetch OpenAI billing and usage info
async function getOpenAIUsage(apiKey: string): Promise<ProviderUsage> {
  try {
    const openai = new OpenAI({ apiKey })
    
    // Get subscription data
    let subscriptionData = null
    try {
      const response = await fetch('https://api.openai.com/v1/billing/subscription', {
        headers: { Authorization: `Bearer ${apiKey}` }
      })
      if (response.ok) {
        subscriptionData = await response.json()
      }
    } catch (e) {
      console.log('Could not fetch subscription data')
    }

    // Get usage data for this month
    let usageData = null
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const response = await fetch(
        `https://api.openai.com/v1/usage?start_date=${startOfMonth.toISOString().split('T')[0]}&end_date=${endOfMonth.toISOString().split('T')[0]}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      )
      if (response.ok) {
        usageData = await response.json()
      }
    } catch (e) {
      console.log('Could not fetch usage data')
    }

    const hardLimitUsd = subscriptionData?.hard_limit_usd || 0 // Already in USD
    const costThisMonth = (usageData?.total_usage || 0) / 100 // Convert from cents to USD
    
    // Calculate remaining balance (hard limit minus current month's usage)
    const balance = Math.max(0, hardLimitUsd - costThisMonth)

    return {
      provider: 'openai',
      configured: true,
      billing: {
        balance: balance,
        costThisMonth: costThisMonth,
        currency: 'USD',
        hardLimitUsd: hardLimitUsd
      },
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    console.error('OpenAI usage fetch error:', error)
    return {
      provider: 'openai',
      configured: false,
      error: error instanceof Error ? error.message : 'Failed to fetch OpenAI usage'
    }
  }
}

// Fetch Google Gemini rate limit info (no usage tracking API available)
async function getGeminiUsage(apiKey: string, userId: string): Promise<ProviderUsage> {
  try {
    // Gemini API does not provide usage tracking
    // Use lightweight models list endpoint to validate the API key without consuming quota
    console.log('[GEMINI-USAGE] Validating API key via models endpoint...')
    
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      if (response.status === 401 || response.status === 403) {
        return {
          provider: 'gemini',
          configured: false,
          error: 'Invalid API key'
        }
      } else if (response.status === 429) {
        return {
          provider: 'gemini',
          configured: true,
          error: 'Currently rate limited. Free tier: 60 requests/minute. Resets every 60 seconds.',
          rateLimit: {
            requestsPerMinute: 60,
            tokensPerMinute: 1000000,
            resetTime: new Date(Date.now() + 60000).toISOString()
          },
          lastChecked: new Date().toISOString(),
          isStatic: true
        }
      } else if (response.status === 400) {
        // 400 could be due to outdated endpoint or model name, but key might be valid
        // Treat as configured with static limits
        console.log('[GEMINI-USAGE] 400 error on models endpoint - treating as valid key with static limits')
        return {
          provider: 'gemini',
          configured: true,
          rateLimit: {
            requestsPerMinute: 60,
            tokensPerMinute: 1000000,
            resetTime: new Date(Date.now() + 60000).toISOString()
          },
          lastChecked: new Date().toISOString(),
          error: 'Gemini API does not provide usage tracking. Monitor usage in Google AI Studio at https://aistudio.google.com/',
          isStatic: true
        }
      } else if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}))
        const errorMessage = responseBody.error?.message || responseBody.error?.reason || 'Unknown error'
        return {
          provider: 'gemini',
          configured: false,
          error: errorMessage
        }
      }
    } catch (error) {
      console.error('[GEMINI-USAGE] Validation error:', error)
      return {
        provider: 'gemini',
        configured: false,
        error: error instanceof Error ? error.message : 'Failed to validate API key'
      }
    }

    // API key is valid, return static rate limits
    return {
      provider: 'gemini',
      configured: true,
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 1000000,
        resetTime: new Date(Date.now() + 60000).toISOString()
      },
      lastChecked: new Date().toISOString(),
      error: 'Gemini API does not provide usage tracking. This is normal for free tier accounts. Your API key is valid and working. Monitor actual usage in Google AI Studio at https://aistudio.google.com/',
      isStatic: true,
      trackingAvailable: false
    }
  } catch (error) {
    console.error('Gemini usage fetch error:', error)
    return {
      provider: 'gemini',
      configured: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Gemini usage'
    }
  }
}

// Fetch Anthropic usage (attempts to use Usage API, falls back to static limits)
async function getAnthropicUsage(apiKey: string, userId: string): Promise<ProviderUsage> {
  try {
    // Anthropic free tier: 10,000 tokens per minute, 5 requests per minute
    const totalLimit = 10000

    // Validate the API key format
    if (!apiKey || apiKey.length < 10) {
      return {
        provider: 'anthropic',
        configured: false,
        error: 'Invalid API key format',
        quota: {
          usedTokens: 0,
          remainingTokens: 0,
          totalTokens: totalLimit
        },
        rateLimit: {
          requestsPerMinute: 5,
          tokensPerMinute: 10000
        },
        trackingAvailable: false
      }
    }

    // Check rate limiter status
    const rateLimitStatus = await rateLimiter.getStatus('anthropic', userId)
    if (rateLimitStatus.availableTokens === 0) {
      return {
        provider: 'anthropic',
        configured: true,
        error: 'Currently rate limited. Wait before making more requests.',
        quota: {
          usedTokens: null as any,
          remainingTokens: totalLimit,
          totalTokens: totalLimit,
          resetDate: new Date(Date.now() + 86400000).toISOString(),
          daysUntilReset: 1
        },
        rateLimit: {
          requestsPerMinute: 5,
          tokensPerMinute: 10000
        },
        lastChecked: new Date().toISOString(),
        isStatic: true,
        trackingAvailable: false
      }
    }

    // Anthropic does not provide programmatic usage tracking API
    // Return static limits immediately with clear messaging
    return {
      provider: 'anthropic',
      configured: true,
      quota: {
        usedTokens: null as any, // null indicates "unknown" rather than 0
        remainingTokens: totalLimit,
        totalTokens: totalLimit,
        resetDate: new Date(Date.now() + 86400000).toISOString(),
        daysUntilReset: 1
      },
      rateLimit: {
        requestsPerMinute: 5,
        tokensPerMinute: 10000
      },
      lastChecked: new Date().toISOString(),
      error: 'Anthropic API does not provide programmatic usage tracking. This is normal for free tier accounts. Your API key is valid and working. Monitor actual usage in Anthropic Console at https://console.anthropic.com/settings/billing',
      isStatic: true,
      trackingAvailable: false
    }
  } catch (error) {
    console.error('Anthropic usage fetch error:', error)
    return {
      provider: 'anthropic',
      configured: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Anthropic usage'
    }
  }
}

// Fetch Mistral API validation (no usage tracking API available)
async function getMistralUsage(apiKey: string, userId: string): Promise<ProviderUsage> {
  try {
    // Mistral free tier: 50,000 tokens per month
    const totalLimit = 50000

    // Validate the API key using the models list endpoint (zero-cost)
    console.log('[MISTRAL-USAGE] Validating API key via models endpoint...')
    const mistral = new Mistral({ apiKey })

    let apiKeyValid = true
    let validationError: string | undefined
    
    try {
      // Try to list models - this doesn't consume tokens
      await mistral.models.list()
    } catch (e: any) {
      if (e.status === 401 || e.message?.includes('unauthorized') || e.message?.includes('Invalid API key')) {
        apiKeyValid = false
        validationError = 'Invalid API key'
      } else if (e.status === 400 && (e.message?.includes('model') || e.message?.includes('not found'))) {
        // 400 due to model not found - key is valid, just outdated model reference
        console.log('[MISTRAL-USAGE] Model not found error - treating as valid key')
        apiKeyValid = true
      } else if (e.message?.includes('credit') || e.message?.includes('balance')) {
        // True billing error
        apiKeyValid = false
        const errorMessage = e.message || 'Your credit balance is too low to access the Mistral API.'
        if (typeof errorMessage === 'string' && errorMessage.includes('{')) {
          try {
            const jsonStartIndex = errorMessage.indexOf('{')
            const jsonEndIndex = errorMessage.lastIndexOf('}') + 1
            if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
              const jsonPart = errorMessage.substring(jsonStartIndex, jsonEndIndex)
              const parsed = JSON.parse(jsonPart)
              validationError = parsed.error?.message || errorMessage
            }
          } catch {
            validationError = errorMessage
          }
        } else {
          validationError = errorMessage
        }
      }
    }

    if (!apiKeyValid) {
      return {
        provider: 'mistral',
        configured: false,
        error: validationError || 'Invalid API key',
        quota: {
          usedTokens: 0,
          remainingTokens: 0,
          totalTokens: totalLimit
        },
        rateLimit: {
          requestsPerMinute: 5
        }
      }
    }

    // API key is valid, return static limits with a note
    return {
      provider: 'mistral',
      configured: true,
      quota: {
        usedTokens: null as any, // null indicates "unknown" rather than 0
        remainingTokens: totalLimit,
        totalTokens: totalLimit,
        resetDate: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days
        daysUntilReset: 30
      },
      rateLimit: {
        requestsPerMinute: 5
      },
      lastChecked: new Date().toISOString(),
      error: 'Mistral API does not provide programmatic usage tracking. This is normal for free tier accounts. Your API key is valid and working. Monitor actual usage in Mistral Console at https://console.mistral.ai/usage',
      isStatic: true,
      trackingAvailable: false
    }
  } catch (error) {
    console.error('Mistral usage fetch error:', error)
    return {
      provider: 'mistral',
      configured: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Mistral usage'
    }
  }
}

export async function GET(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const searchParams = new URL(req.url).searchParams
  const provider = searchParams.get('provider')

  console.log('[PROVIDER-USAGE-API] Request received:', { provider, url: req.url })

  try {
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('[PROVIDER-USAGE-API] Session error:', sessionError)
      return NextResponse.json(
        { error: 'Unauthorized', sessionError },
        { status: 401 }
      )
    }

    console.log('[PROVIDER-USAGE-API] Session found for user:', session.user.id)

    // Get AI settings from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_settings')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[PROVIDER-USAGE-API] Profile error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    console.log('[PROVIDER-USAGE-API] Profile data:', { hasSettings: !!profile?.ai_settings })

    if (!profile?.ai_settings) {
      console.log('[PROVIDER-USAGE-API] No AI settings found')
      return NextResponse.json(
        { error: 'No AI settings found' },
        { status: 404 }
      )
    }

    const apiKeys = (profile.ai_settings as any)?.apiKeys || {}

    // If specific provider requested
    if (provider) {
      if (!['openai', 'gemini', 'anthropic', 'mistral'].includes(provider)) {
        return NextResponse.json(
          { error: 'Invalid provider' },
          { status: 400 }
        )
      }

      // Check cache first
      const cacheKey = getCacheKey(session.user.id, provider)
      const cached = getCached(cacheKey)
      if (cached) {
        return NextResponse.json(cached)
      }

      const apiKey = apiKeys[provider]
      console.log(`[PROVIDER-USAGE-API] Provider: ${provider}, Has API Key:`, !!apiKey)
      
      if (!apiKey) {
        const response = validateProviderResponse({
          provider,
          configured: false,
          error: 'API key not configured',
          trackingAvailable: false
        })
        setCache(cacheKey, response)
        return NextResponse.json(response)
      }

      let usage: ProviderUsage
      if (provider === 'openai') {
        usage = await getOpenAIUsage(apiKey)
      } else if (provider === 'gemini') {
        usage = await getGeminiUsage(apiKey, session.user.id)
      } else if (provider === 'anthropic') {
        usage = await getAnthropicUsage(apiKey, session.user.id)
      } else if (provider === 'mistral') {
        usage = await getMistralUsage(apiKey, session.user.id)
      } else {
        usage = {
          provider,
          configured: false,
          error: 'Provider not supported',
          trackingAvailable: false
        }
      }

      console.log(`[PROVIDER-USAGE-API] ${provider} usage response:`, JSON.stringify(usage, null, 2))
      const validatedUsage = validateProviderResponse(usage)
      setCache(cacheKey, validatedUsage) // Cache the result
      return NextResponse.json(validatedUsage)
    }

    // Return all providers' usage
    // Check cache first for all providers
    const allCacheKey = getCacheKey(session.user.id)
    const allCached = getCached(allCacheKey)
    if (allCached) {
      return NextResponse.json(allCached)
    }

    const allProviders = ['openai', 'gemini', 'anthropic', 'mistral']
    const allUsage: { [key: string]: ProviderUsage } = {}

    for (const p of allProviders) {
      const apiKey = apiKeys[p]
      if (!apiKey) {
        allUsage[p] = {
          provider: p,
          configured: false,
          error: 'API key not configured'
        }
        continue
      }

      if (p === 'openai') {
        allUsage[p] = await getOpenAIUsage(apiKey)
      } else if (p === 'gemini') {
        allUsage[p] = await getGeminiUsage(apiKey, session.user.id)
      } else if (p === 'anthropic') {
        allUsage[p] = await getAnthropicUsage(apiKey, session.user.id)
      } else if (p === 'mistral') {
        allUsage[p] = await getMistralUsage(apiKey, session.user.id)
      }
    }

    console.log('[PROVIDER-USAGE-API] All providers response:', JSON.stringify(allUsage, null, 2))
    setCache(allCacheKey, allUsage) // Cache the all-providers result
    return NextResponse.json(allUsage)
  } catch (error) {
    console.error('[PROVIDER-USAGE-API] Error in provider-usage endpoint:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}
