import { rateLimiter } from '@/lib/rate-limiter'
import { NextResponse } from 'next/server'

/**
 * Debug endpoint to reset the rate limiter
 * Only available in development mode
 */
export async function POST(req: Request) {
  // Security: Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  try {
    // Parse optional query parameters for selective reset
    const { searchParams } = new URL(req.url)
    const provider = searchParams.get('provider')
    const userId = searchParams.get('userId')

    // Reset rate limiter
    rateLimiter.reset(provider || undefined, userId || undefined)

    // Build response message
    let message = 'Rate limiter reset successfully'
    if (provider && userId) {
      message = `Rate limiter reset for provider '${provider}' and user '${userId}'`
    } else if (provider) {
      message = `Rate limiter reset for provider '${provider}' (all users)`
    } else if (userId) {
      message = `Rate limiter reset for user '${userId}' (all providers)`
    }

    return NextResponse.json({
      message,
      timestamp: new Date().toISOString(),
      resetScope: {
        provider: provider || 'all',
        userId: userId || 'all'
      }
    })
  } catch (error) {
    console.error('[DEBUG] Error resetting rate limiter:', error)
    return NextResponse.json(
      { error: 'Failed to reset rate limiter' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check current rate limiter status
 */
export async function GET(req: Request) {
  // Security: Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const provider = searchParams.get('provider')
    const userId = searchParams.get('userId')

    if (!provider || !userId) {
      return NextResponse.json({
        message: 'Rate limiter status check requires both provider and userId query parameters',
        example: '/api/debug/reset-rate-limiter?provider=gemini&userId=abc123'
      })
    }

    const status = rateLimiter.getStatus(provider, userId)

    return NextResponse.json({
      provider,
      userId: userId.substring(0, 8) + '...',
      status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[DEBUG] Error getting rate limiter status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get rate limiter status',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
