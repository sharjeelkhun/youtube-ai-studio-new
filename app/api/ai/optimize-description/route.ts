import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleOpenAI, handleGemini, handleAnthropic, handleMistral } from '@/lib/ai-description-handlers'
import { RateLimitTimeoutError } from '@/lib/rate-limiter'

export async function POST(req: Request) {
  const provider = 'unknown'

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description } = await req.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Get the user's profile to determine AI provider and settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to get profile settings' }, { status: 500 })
    }

    if (!profile.ai_provider || !profile.ai_settings?.apiKeys?.[profile.ai_provider]) {
      return NextResponse.json({ error: 'AI provider not configured' }, { status: 400 })
    }

    const apiKey = profile.ai_settings.apiKeys[profile.ai_provider]

    // Extract userId for rate limiting
    const userId = session.user.id

    let optimizedContent

    try {
      switch (profile.ai_provider) {
        case 'openai':
          optimizedContent = await handleOpenAI(apiKey, title, description, profile.ai_settings, userId)
          break
        case 'anthropic':
          optimizedContent = await handleAnthropic(apiKey, title, description, profile.ai_settings, userId)
          break
        case 'mistral':
          optimizedContent = await handleMistral(apiKey, title, description, profile.ai_settings, userId)
          break
        case 'gemini':
          optimizedContent = await handleGemini(apiKey, title, description, profile.ai_settings, userId)
          break
        default:
          return NextResponse.json({ error: 'Unsupported AI provider' }, { status: 400 })
      }

      return NextResponse.json({
        title: optimizedContent.title || title,
        description: optimizedContent.description || description
      })
    } catch (error: any) {
      console.error('[AI_OPTIMIZE_DESCRIPTION_ERROR]', error)

      // Handle rate limit timeout errors from centralized limiter
      if (error instanceof RateLimitTimeoutError) {
        return NextResponse.json({
          error: error.message,
          errorCode: 'rate_limit_timeout'
        }, { status: 429 })
      }

      const errorMessage = error?.message || String(error)

      // Handle rate limit errors (429)
      if (/429|rate.?limit|too many requests|quota exceeded/i.test(errorMessage)) {
        return NextResponse.json({
          error: `Your ${profile.ai_provider} provider is currently rate limited. Please wait a moment and try again.`,
          errorCode: 'rate_limit_error'
        }, { status: 429 })
      }

      // Handle billing/credit errors
      if (/credit|insufficient|balance|billing|plan|your.*balance.*too.*low/i.test(errorMessage)) {
        return NextResponse.json({
          error: `Your ${profile.ai_provider} account has a billing issue. Please check your credits or plan on the provider's website.`,
          errorCode: 'billing_error'
        }, { status: 400 })
      }

      return NextResponse.json({
        error: error.message || 'Failed to optimize description'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[AI_OPTIMIZE_DESCRIPTION_ERROR]', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}