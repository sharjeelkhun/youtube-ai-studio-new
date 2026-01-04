import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { unifiedOptimizer } from "@/lib/unified-ai-optimizer"
import { getCachedTranscript, analyzeTranscript } from "@/lib/youtube-transcript"
import { RateLimitTimeoutError } from '@/lib/rate-limiter'

/**
 * Unified Video Optimization Endpoint
 * 
 * This endpoint replaces the separate optimize-title, optimize-description, optimize-tags endpoints
 * with a single unified system that:
 * 1. Analyzes actual video content (transcripts)
 * 2. Uses consistent prompts across all AI providers
 * 3. Provides better, more relevant optimization
 */
export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            videoId,
            type = 'all', // 'title' | 'description' | 'tags' | 'all'
            currentTitle,
            currentDescription,
            currentTags = [],
            includeTranscript = true
        } = body

        // Validate required fields
        if (!videoId || !currentTitle || !currentDescription) {
            return NextResponse.json(
                { error: "Missing required fields: videoId, currentTitle, currentDescription" },
                { status: 400 }
            )
        }

        // Get user profile with AI settings
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()

        if (!profile || !profile.ai_settings?.apiKeys) {
            return NextResponse.json(
                { error: "AI provider not configured" },
                { status: 400 }
            )
        }

        const provider = profile.ai_provider
        if (!provider) {
            return NextResponse.json(
                { error: "No AI provider selected" },
                { status: 400 }
            )
        }

        const apiKey = profile.ai_settings.apiKeys[provider]
        if (!apiKey) {
            return NextResponse.json(
                { error: "API key not found for selected provider" },
                { status: 400 }
            )
        }

        // Fetch and analyze video transcript if requested
        let transcript: string | null = null
        let transcriptAnalysis = undefined

        if (includeTranscript) {
            try {
                console.log('[UNIFIED-API] Fetching transcript for video:', videoId)
                transcript = await getCachedTranscript(videoId)

                if (transcript) {
                    console.log('[UNIFIED-API] Analyzing transcript...')
                    transcriptAnalysis = analyzeTranscript(transcript)
                    console.log('[UNIFIED-API] Analysis complete:', {
                        topics: transcriptAnalysis.mainTopics.length,
                        keywords: transcriptAnalysis.keywords.length,
                        phrases: transcriptAnalysis.keyPhrases.length
                    })
                } else {
                    console.log('[UNIFIED-API] No transcript available for video')
                }
            } catch (error) {
                console.error('[UNIFIED-API] Error fetching/analyzing transcript:', error)
                // Continue without transcript - graceful degradation
            }
        }

        // Build video context
        const context = {
            videoId,
            currentTitle,
            currentDescription,
            currentTags,
            transcript,
            transcriptAnalysis
        }

        // Call unified optimizer
        try {
            console.log('[UNIFIED-API] Calling unified optimizer:', {
                provider,
                type,
                hasTranscript: !!transcript,
                hasAnalysis: !!transcriptAnalysis
            })

            const result = await unifiedOptimizer.optimize(
                context,
                provider,
                apiKey,
                profile.ai_settings,
                session.user.id,
                type
            )

            return NextResponse.json({
                ...result,
                transcriptUsed: !!transcript,
                provider,
                optimizationType: type
            })
        } catch (error: any) {
            console.error("[UNIFIED-API] Optimization error:", error)

            // Handle rate limit timeout errors
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
                    error: `Your ${provider} provider is currently rate limited. Please wait a moment and try again.`,
                    errorCode: 'rate_limit_error'
                }, { status: 429 })
            }

            // Handle billing/credit errors
            if (/credit|insufficient|balance|billing|plan/i.test(errorMessage)) {
                return NextResponse.json({
                    error: `Your ${provider} account has a billing issue. Please check your credits or plan on the provider's website.`,
                    errorCode: 'billing_error'
                }, { status: 400 })
            }

            return NextResponse.json(
                { error: error?.message || "Failed to optimize with AI provider" },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error("[UNIFIED-API] Route error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
