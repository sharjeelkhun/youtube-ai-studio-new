import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { RateLimitTimeoutError } from '@/lib/rate-limiter'
import { unifiedOptimizer } from '@/lib/unified-ai-optimizer'

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
// Migration Note: Request Deduplication moved to UnifiedAIOptimizer
// ============================================================================

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

    // Build video context (minimal for this route as it doesn't always have videoId)
    const context = {
      videoId: (body as any).videoId || 'legacy-request',
      currentTitle: title,
      currentDescription: description,
      currentTags: []
    }

    try {
      const result = await unifiedOptimizer.optimize(
        context,
        provider as any,
        apiKey,
        userSettings.features as any,
        userId
      )
      return NextResponse.json(result)
    } catch (error: any) {
      console.error(`[AI_OPTIMIZE_ERROR] Error in unified optimizer:`, error)

      // Handle rate limit timeout errors
      if (error instanceof RateLimitTimeoutError || error.name === 'RateLimitTimeoutError') {
        return NextResponse.json({
          error: error.message,
          errorCode: 'rate_limit_timeout'
        }, { status: 429 })
      }

      // Handle provider rate limit errors (429)
      if (error.status === 429 || /429|rate.?limit|too many requests|quota exceeded/i.test(error.message)) {
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
