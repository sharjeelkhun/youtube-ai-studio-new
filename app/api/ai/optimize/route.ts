import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { aiProviders, getFallbackModel, isValidModel } from '@/lib/ai-providers'
import { trackUsage } from '@/lib/track-usage'
import { acquireRateLimit, RateLimitTimeoutError } from '@/lib/rate-limiter'

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

const temperatureMap = {
  precise: 0.2,
  balanced: 0.7,
  creative: 1.0,
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

// Helper function to wrap promises with timeout
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutId: NodeJS.Timeout
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${errorMessage} (timeout after ${timeoutMs}ms)`))
    }, timeoutMs)
  })
  
  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    clearTimeout(timeoutId!)
    throw error
  }
}

// Helper function to retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on RateLimitTimeoutError
      if (error instanceof RateLimitTimeoutError) {
        throw error
      }
      
      // Don't retry on authentication/authorization errors
      if (error.status === 401 || error.status === 403 || 
          error.message?.toLowerCase().includes('authentication') ||
          error.message?.toLowerCase().includes('unauthorized') ||
          error.message?.toLowerCase().includes('invalid api key')) {
        throw error
      }
      
      // Retry on transient errors (network, 5xx, 429)
      const isTransient = 
        error.status === 429 ||
        (error.status >= 500 && error.status < 600) ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('timeout')
      
      if (!isTransient || attempt === maxRetries - 1) {
        throw error
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`[RETRY] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms:`, error.message)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error('All retry attempts failed')
}

// Helper function to handle JSON parsing
const parseJsonResponse = (text: string) => {
  try {
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(jsonString)
  } catch (e) {
    console.error('Failed to parse AI response JSON:', text)
    throw new Error('The AI returned a response in an invalid format. Please try again.')
  }
}

// Helper function for Gemini
const handleGemini = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string) => {
  // Validate API key format (should start with AIza and be non-empty)
  if (!apiKey || !apiKey.startsWith('AIza')) {
    throw new Error('Invalid Gemini API key format. The key should start with "AIza".')
  }

  // Validate API key length (Gemini keys are typically >= 30 chars)
  if (apiKey.length < 30) {
    throw new Error('Invalid Gemini API key - key appears to be too short. Please check your API key.')
  }

  console.log('[GEMINI] Initializing with model:', settings.defaultModel)
  const genAI = new GoogleGenerativeAI(apiKey)
  
  let modelToUse = settings.defaultModel
  
  // Validate and fallback using centralized config
  if (!isValidModel('gemini', modelToUse)) {
    const fallback = getFallbackModel('gemini')
    if (!fallback) {
      throw new Error('No Gemini fallback model configured')
    }
    console.warn(`[GEMINI] Invalid model '${modelToUse}', falling back to '${fallback}'`)
    modelToUse = fallback
  }
  
  const model = genAI.getGenerativeModel({ model: modelToUse })

  try {
    // Track API call
    await trackUsage('gemini', 'api_calls')

    const prompt = `
      You are an expert YouTube content strategist. Your task is to optimize the metadata for a video.
      Based on the following title and description, generate a new, more engaging title, a more detailed and SEO-friendly description, and a list of 10-15 relevant tags.
      Original Title: "${title}"
      Original Description: "${description}"
      Your response must be a valid JSON object with the following structure:
      {
        "title": "A new, catchy, and optimized title",
        "description": "A new, well-structured, and SEO-optimized description that is at least 3 paragraphs long. Use markdown for formatting like bolding and bullet points.",
        "tags": ["tag1", "tag2", "tag3", ...]
      }
    `

    console.log('[GEMINI] Sending request with temperature:', temperatureMap[settings.temperature])
    
    // Acquire rate limit token before making API call
    console.log('[GEMINI] Acquiring rate limit for user:', userId.substring(0, 8))
    try {
      await acquireRateLimit('gemini', userId)
      console.log('[GEMINI] Rate limit acquired, proceeding with API call')
    } catch (e) {
      if (e instanceof RateLimitTimeoutError) {
        console.error('[GEMINI] Rate limiter timeout:', e.message)
        // Rethrow original error to preserve specificity
        throw e
      }
      throw e
    }
    
    // Make the content generation call with timeout and retry
    console.log('[GEMINI] Generating content...')
    const result = await withRetry(async () => {
      return await withTimeout(
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: temperatureMap[settings.temperature],
          },
        }),
        30000,
        'Gemini API request timed out'
      )
    })

    if (!result.response) {
      console.error('[GEMINI] Empty response received')
      throw new Error('Gemini returned an empty response')
    }

    console.log('[GEMINI] Response received, extracting text...')
    const response = await result.response
    const text = response.text()

    if (!text) {
      console.error('[GEMINI] Empty text in response')
      throw new Error('Gemini returned an empty text response')
    }

    console.log('[GEMINI] Raw response text:', text.substring(0, 100) + '...')

    // Get usage info if available
    // Note: Gemini doesn't provide exact token counts in the API response
    const estimatedTokens = Math.ceil(text.length / 4) // rough estimate
    console.log('[GEMINI] Estimated tokens used:', estimatedTokens)
    
    await trackUsage('gemini', 'content_generation', {
      totalTokens: estimatedTokens
    })

    try {
      const parsedResponse = parseJsonResponse(text)
      console.log('[GEMINI] Successfully parsed JSON response:', {
        title: parsedResponse.title?.substring(0, 50) + '...',
        descriptionLength: parsedResponse.description?.length,
        tagsCount: parsedResponse.tags?.length
      })
      return parsedResponse
    } catch (parseError) {
      console.error('[GEMINI] Failed to parse response as JSON:', text)
      throw new Error('Failed to parse Gemini response as JSON. The response may not be in the correct format.')
    }
  } catch (e: any) {
    console.error('[GEMINI] Error:', e)

    // Handle rate limit timeout errors from centralized limiter
    if (e instanceof RateLimitTimeoutError) {
      throw e
    }

    // Extract error details
    const errorMessage = e.message || 'Unknown error occurred'
    const normalizedError = errorMessage.toLowerCase()

    // Handle RESOURCE_EXHAUSTED errors (rate limit from Gemini API)
    if (e.status === 429 || 
        normalizedError.includes('resource_exhausted') ||
        normalizedError.includes('429') || 
        normalizedError.includes('rate limit') || 
        normalizedError.includes('quota') ||
        normalizedError.includes('too many requests')) {
      console.error('[GEMINI] Rate limit hit')
      const resetTime = new Date(Date.now() + 60000)
      const resetTimeStr = resetTime.toLocaleTimeString()
      const secondsUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / 1000)
      
      throw new Error(
        `Gemini rate limit reached (60 requests/minute for free tier). ` +
        `Please wait ${secondsUntilReset} seconds. ` +
        `You can try again at ${resetTimeStr}. ` +
        `\n\nTip: To avoid rate limits, try to space out your requests or upgrade to a paid tier.`
      )
    }

    // Handle authentication errors
    if (normalizedError.includes('api key') || 
        normalizedError.includes('api_key_invalid') ||
        normalizedError.includes('authentication') || 
        normalizedError.includes('unauthorized') ||
        normalizedError.includes('invalid') ||
        e.status === 401 ||
        e.status === 403) {
      console.error('[GEMINI] Authentication error')
      throw new Error('Invalid or unauthorized Gemini API key. Please check your API key at https://aistudio.google.com/app/apikey')
    }

    // Handle other errors
    console.error('[GEMINI] Unexpected error:', errorMessage)
    throw new Error(`Gemini API error: ${errorMessage}`)
  }
}

// Helper function for OpenAI
const handleOpenAI = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string) => {
  const openai = new OpenAI({ apiKey })
  
  // Track API call
  await trackUsage('openai', 'api_calls');
  
  // Acquire rate limit token before making API call
  console.log('[OPENAI] Acquiring rate limit for user:', userId.substring(0, 8))
  try {
    await acquireRateLimit('openai', userId)
    console.log('[OPENAI] Rate limit acquired, proceeding with API call')
  } catch (e) {
    if (e instanceof RateLimitTimeoutError) {
      console.error('[OPENAI] Rate limiter timeout:', e.message)
      // Rethrow original error to preserve specificity
      throw e
    }
    throw e
  }
  
  // Models that support JSON mode
  const jsonModeModels = ['gpt-4o', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-4-1106-preview', 'gpt-3.5-turbo-1106']
  const model = settings.defaultModel || "gpt-4-1106-preview"
  const supportsJsonMode = jsonModeModels.some(m => model.includes(m))
  
  const completionParams: any = {
    model: model,
    messages: [
      {
        role: "system",
        content: `You are an expert video content optimization assistant. Your task is to optimize video titles and descriptions for better visibility and engagement while maintaining authenticity and avoiding clickbait.

For Titles:
- Keep titles under ${settings.maxTitleLength || 100} characters
- Include main keyword naturally
- Make it compelling but honest
- Use proven patterns that work on YouTube

For Descriptions:
- Keep descriptions under ${settings.maxDescriptionLength || 5000} characters
- Write in a natural, engaging style
- Include relevant keywords naturally
- Add appropriate context and value
- Use proper formatting and spacing

You must respond with a valid JSON object with this exact structure:
{
  "title": "optimized title here",
  "description": "optimized description here",
  "tags": ["tag1", "tag2", "tag3", ...]
}`
      },
      {
        role: "user",
        content: `Please optimize this YouTube video title and description while maintaining its core message:

Original Title: ${title}
Original Description: ${description}

Generate 10-15 relevant tags based on the content.
Respond with a JSON object containing title, description, and tags array.`
      }
    ]
  }
  
  // Only set response_format for models that support it
  if (supportsJsonMode) {
    completionParams.response_format = { type: 'json_object' }
  }
  
  const completion = await withRetry(async () => {
    return await withTimeout(
      openai.chat.completions.create(completionParams),
      30000,
      'OpenAI API request timed out'
    )
  })

  // Track token usage
  if (completion.usage) {
    await trackUsage('openai', 'content_generation', {
      inputTokens: completion.usage.prompt_tokens,
      outputTokens: completion.usage.completion_tokens,
      totalTokens: completion.usage.total_tokens
    });
  } else {
    await trackUsage('openai', 'content_generation');
  }
  
  if (!completion.choices[0]?.message?.content) {
    throw new Error('OpenAI returned an empty response.');
  }

  return parseJsonResponse(completion.choices[0].message.content);
};

// Helper function for Anthropic
const handleAnthropic = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string) => {
  const anthropic = new Anthropic({ apiKey })
  
  // Valid Anthropic models
  const validModels = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ]
  
  let modelToUse = settings.defaultModel
  
  // Validate and fallback using centralized config
  if (!validModels.includes(modelToUse)) {
    const fallback = getFallbackModel('anthropic')
    console.warn(`[ANTHROPIC] Invalid model '${modelToUse}', falling back to '${fallback}'`)
    modelToUse = fallback || 'claude-3-haiku-20240307'
  }

  try {
    // Track API call
    await trackUsage('anthropic', 'api_calls')
    
    // Acquire rate limit token before making API call
    console.log('[ANTHROPIC] Acquiring rate limit for user:', userId.substring(0, 8))
    try {
      await acquireRateLimit('anthropic', userId)
      console.log('[ANTHROPIC] Rate limit acquired, proceeding with API call')
    } catch (e) {
      if (e instanceof RateLimitTimeoutError) {
        console.error('[ANTHROPIC] Rate limiter timeout:', e.message)
        // Rethrow original error to preserve specificity
        throw e
      }
      throw e
    }

    const msg = await withRetry(async () => {
      return await withTimeout(
        anthropic.messages.create({
          model: modelToUse,
          temperature: temperatureMap[settings.temperature],
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: `You are an expert YouTube content strategist. Your task is to optimize the metadata for a video.
          Based on the following title and description, generate a new, more engaging title, a more detailed and SEO-friendly description, and a list of 10-15 relevant tags.
          Original Title: "${title}"
          Original Description: "${description}"
          Your response must be a valid JSON object with the following structure:
          {
            "title": "A new, catchy, and optimized title",
            "description": "A new, well-structured, and SEO-optimized description that is at least 3 paragraphs long. Use markdown for formatting like bolding and bullet points.",
            "tags": ["tag1", "tag2", "tag3", ...]
          }`
            }
          ]
        }),
        30000,
        'Anthropic API request timed out'
      )
    })

    if (!msg.content || !msg.content[0] || !('text' in msg.content[0])) {
      throw new Error('Anthropic returned an empty or invalid response.')
    }

    // Track content generation with token usage
    if (msg.usage) {
      await trackUsage('anthropic', 'content_generation', {
        inputTokens: msg.usage.input_tokens,
        outputTokens: msg.usage.output_tokens,
        totalTokens: msg.usage.input_tokens + msg.usage.output_tokens
      });
    } else {
      await trackUsage('anthropic', 'content_generation');
    }

    return parseJsonResponse(msg.content[0].text)
    
  } catch (e: any) {
    console.error('[ANTHROPIC] Error details:', JSON.stringify({
      status: e.status,
      type: e.error?.type,
      message: e.error?.message || e.message,
      error: e.error,
      modelUsed: modelToUse
    }, null, 2))

    // Check for model-not-found errors BEFORE billing checks
    if (e.status === 404 || e.error?.type === 'not_found_error' || 
        (e.error?.message || e.message || '').toLowerCase().includes('model')) {
      throw new Error(
        `Anthropic model error: Model '${modelToUse}' not found or not accessible. ` +
        `Please check your model configuration and ensure your API key has access to this model. ` +
        `Visit https://console.anthropic.com/ for available models.`
      )
    }

    // Check for specific billing errors (insufficient quota)
    if (e.status === 402 || e.error?.type === 'insufficient_quota') {
      throw new Error(
        `Anthropic billing error: Insufficient credits. ` +
        `Please add credits at https://console.anthropic.com/settings/billing`
      )
    }

    // Use simplified error extraction
    const errorMessage = e.error?.message || e.message || 'Unknown error occurred'
    
    // Check for authentication errors
    if (e.status === 401 || e.status === 403 || errorMessage.toLowerCase().includes('authentication')) {
      throw new Error(`Anthropic authentication error: ${errorMessage}. Check your API key at https://console.anthropic.com/settings/keys`)
    }
    
    // Re-throw with clean error message
    throw new Error(`Anthropic API error: ${errorMessage}`)
  }
}

// Helper function for Mistral
const handleMistral = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string) => {
  const mistral = new Mistral({ apiKey })

  try {
    // Track API call
    await trackUsage('mistral', 'api_calls')
    
    // Acquire rate limit token before making API call
    console.log('[MISTRAL] Acquiring rate limit for user:', userId.substring(0, 8))
    try {
      await acquireRateLimit('mistral', userId)
      console.log('[MISTRAL] Rate limit acquired, proceeding with API call')
    } catch (e) {
      if (e instanceof RateLimitTimeoutError) {
        console.error('[MISTRAL] Rate limiter timeout:', e.message)
        // Rethrow original error to preserve specificity
        throw e
      }
      throw e
    }

    const response = await withRetry(async () => {
      return await withTimeout(
        mistral.chat.complete({
          model: settings.defaultModel,
          temperature: temperatureMap[settings.temperature],
          messages: [
            {
              role: 'system',
              content: `You are an expert YouTube content strategist. Your task is to optimize the metadata for a video. Your response must be a valid JSON object with the following structure: { "title": "string", "description": "string", "tags": ["string", ...] }`
            },
            {
              role: 'user',
              content: `Based on the following title and description, generate a new, more engaging title, a more detailed and SEO-friendly description, and a list of 10-15 relevant tags.\nOriginal Title: "${title}"\nOriginal Description: "${description}"`
            }
          ],
          responseFormat: { type: 'json_object' }
        }),
        30000,
        'Mistral API request timed out'
      )
    })

    const content = response.choices[0].message.content;

    // Track content generation with token usage
    if (response.usage) {
      await trackUsage('mistral', 'content_generation', {
        inputTokens: response.usage.promptTokens,
        outputTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens
      });
    } else {
      // Estimate tokens if not provided
      const estimatedTokens = Math.ceil((title.length + description.length + (content?.length || 0)) / 4);
      await trackUsage('mistral', 'content_generation', {
        totalTokens: estimatedTokens
      });
    }

    if (typeof content === 'string') {
      return parseJsonResponse(content);
    } else {
      throw new Error('Mistral AI returned a response in an unexpected format.');
    }
  } catch (e: any) {
    // Extract error message from JSON response if available
    if (e.message?.includes('{')) {
      try {
        const jsonStartIndex = e.message.indexOf('{')
        const jsonEndIndex = e.message.lastIndexOf('}') + 1
        if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
          const jsonPart = e.message.substring(jsonStartIndex, jsonEndIndex)
          const parsed = JSON.parse(jsonPart)
          if (parsed.error?.message) {
            throw new Error(parsed.error.message)
          }
        }
      } catch (parseErr) {
        console.error('[MISTRAL-OPTIMIZE] Error parsing JSON error:', parseErr)
      }
    }
    
    // Check for billing/credit errors
    if (e.message?.includes('credit') || e.message?.includes('balance') || e.message?.includes('billing')) {
      throw new Error(`Mistral AI billing error: ${e.message || 'Your credit balance is too low to access the Mistral API.'}`)
    }
    
    // Re-throw the original error
    throw e
  }
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

    if (!profile.provider) {
      return NextResponse.json({ error: 'AI provider not selected. Please select a provider in settings.' }, { status: 400 })
    }

    if (!profile.settings?.apiKeys || Object.keys(profile.settings.apiKeys).length === 0) {
      return NextResponse.json({ error: 'No API keys configured. Please add your API key in settings.' }, { status: 400 })
    }

    // Ensure profile.settings is not null before proceeding
    if (!profile.settings) {
      return NextResponse.json({ error: 'Profile settings not found' }, { status: 404 })
    }

    const apiKey = profile.settings.apiKeys[profile.provider]
    if (!apiKey) {
      return NextResponse.json({ 
        error: `API key for ${profile.provider} not found. Please add your ${profile.provider} API key in settings.` 
      }, { status: 400 })
    }

    const body = await req.json()
    const { title, description } = body
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Capture settings reference for use in async closure
    const userSettings = profile.settings
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
    
    // Create a promise wrapper that resolves to raw data (not NextResponse)
    const requestPromise = (async () => {
      try {
        const aiSettings = { ...userSettings.features }

        const providerConfig = aiProviders.find(p => p.id === selectedProvider)
        if (providerConfig) {
          const isValidModel = providerConfig.models.some(m => m.id === aiSettings.defaultModel)
          if (!isValidModel) {
            aiSettings.defaultModel = getFallbackModel(providerConfig.id) || providerConfig.models[0].id
          }
        }

        // Make the AI call
        let optimizedData
        if (selectedProvider === 'gemini') {
          optimizedData = await handleGemini(apiKey, title, description, aiSettings, userId)
        } else if (selectedProvider === 'openai') {
          optimizedData = await handleOpenAI(apiKey, title, description, aiSettings, userId)
        } else if (selectedProvider === 'anthropic') {
          optimizedData = await handleAnthropic(apiKey, title, description, aiSettings, userId)
        } else if (selectedProvider === 'mistral') {
          optimizedData = await handleMistral(apiKey, title, description, aiSettings, userId)
        } else {
          throw new Error(`Provider "${selectedProvider}" is not supported.`)
        }

        // Validate response structure and provide defaults if needed
        const validatedData = {
          title: optimizedData.title || title,
          description: optimizedData.description || description,
          tags: Array.isArray(optimizedData.tags) ? optimizedData.tags : []
        }
        
        // Schedule cleanup with delay for successful requests
        cleanupRequest(requestKey, 2000)
        
        // Return raw data payload, not NextResponse
        return validatedData
      } catch (error) {
        // Immediate cleanup on error
        inFlightRequests.delete(requestKey)
        console.log('[DEDUP] Request failed, immediate cleanup:', requestKey)
        throw error
      }
    })()
    
    // Store the promise with metadata in the map
    inFlightRequests.set(requestKey, {
      promise: requestPromise,
      startedAt: requestStartTime
    })
    
    // Await the promise and wrap with fresh NextResponse
    const resultData = await requestPromise
    return NextResponse.json(resultData)

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
