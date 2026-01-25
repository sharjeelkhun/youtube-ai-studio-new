import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { unifiedOptimizer } from '@/lib/unified-ai-optimizer'
import { RateLimitTimeoutError } from '@/lib/rate-limiter'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase.rpc('get_ai_settings')

    if (error) {
      console.error('Error fetching AI settings:', error)
      return NextResponse.json({ error: 'Failed to fetch AI settings' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'AI settings not found' }, { status: 404 })
    }

    const profile = {
      provider: data[0].provider,
      settings: data[0].settings
    }

    let provider = profile.provider
    let apiKey = provider && profile.settings?.apiKeys ? profile.settings.apiKeys[provider] : null

    // Free Plan Logic
    if (!provider || !apiKey) {
      const freeUsage = profile.settings?.freeUsageCount || 0
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
        return NextResponse.json({ error: 'AI provider not configured and free generations exhausted' }, { status: 400 })
      }
    }

    const body = await req.json()
    const { title, description } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Extract userId for rate limiting
    const userId = session.user.id

    // Build video context
    const context = {
      videoId: body.videoId || 'legacy-tags-request',
      currentTitle: title,
      currentDescription: description,
      currentTags: []
    }

    try {
      const result = await unifiedOptimizer.optimize(
        context,
        provider as any,
        apiKey,
        profile.settings?.features || {},
        userId,
        'tags'
      )

      return NextResponse.json({ tags: result.tags })
    } catch (error: any) {
      console.error('[AI_OPTIMIZE_TAGS_ERROR]', error)

      if (error instanceof RateLimitTimeoutError) {
        return NextResponse.json({
          error: error.message,
          errorCode: 'rate_limit_timeout'
        }, { status: 429 })
      }

      const errorMessage = error?.message || String(error)

      if (/429|rate.?limit|too many requests|quota exceeded/i.test(errorMessage)) {
        return NextResponse.json({
          error: `Your AI provider is currently rate limited. Please wait a moment and try again.`,
          errorCode: 'rate_limit_error'
        }, { status: 429 })
      }

      if (/credit|insufficient|balance|billing|plan/i.test(errorMessage)) {
        return NextResponse.json({
          error: `Your AI provider account has a billing issue. Please check your credits or plan on the provider's website.`,
          errorCode: 'billing_error'
        }, { status: 400 })
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error('[AI_OPTIMIZE_TAGS_ERROR]', error)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
