import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { rateLimiter, PROVIDER_LIMITS } from '@/lib/rate-limiter'

export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to expose real-time rate limiter status
 * Shows available tokens, capacity, and reset time for all providers
 */
export async function GET(req: Request) {
  try {
    // Get user session
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const providerParam = searchParams.get('provider')

    // If specific provider requested, return just that one
    if (providerParam) {
      if (!PROVIDER_LIMITS[providerParam]) {
        return NextResponse.json({
          error: `Unknown provider: ${providerParam}`,
          availableProviders: Object.keys(PROVIDER_LIMITS)
        }, { status: 400 })
      }

      const status = rateLimiter.getStatus(providerParam, userId)
      const limits = PROVIDER_LIMITS[providerParam]
      const resetIn = rateLimiter.getTimeUntilNextToken(providerParam, userId)

      return NextResponse.json({
        provider: providerParam,
        available: status.availableTokens,
        capacity: limits.capacity,
        percentAvailable: status.percentAvailable,
        queueLength: status.queuedRequests,
        resetIn: Math.ceil(resetIn / 1000),
        status: status.status,
        timestamp: new Date().toISOString()
      })
    }

    // Return status for all providers
    const allStatus = rateLimiter.getAllStatus(userId)
    const providers: Record<string, any> = {}

    allStatus.forEach((status, provider) => {
      const limits = PROVIDER_LIMITS[provider]
      const resetIn = rateLimiter.getTimeUntilNextToken(provider, userId)

      providers[provider] = {
        available: status.availableTokens,
        capacity: limits.capacity,
        percentAvailable: status.percentAvailable,
        queueLength: status.queuedRequests,
        resetIn: Math.ceil(resetIn / 1000),
        status: status.status
      }
    })

    return NextResponse.json({
      providers,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[RATE-LIMITER-STATUS] Error:', error)
    return NextResponse.json({
      error: 'Failed to get rate limiter status'
    }, { status: 500 })
  }
}
