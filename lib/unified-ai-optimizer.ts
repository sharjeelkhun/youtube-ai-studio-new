/**
 * Unified AI Optimization Engine
 * 
 * Single source of truth for all AI-powered video optimization.
 * Provides consistent results across all AI providers (OpenAI, Anthropic, Gemini, Mistral).
 */

import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { acquireRateLimit, RateLimitTimeoutError } from '@/lib/rate-limiter'
import { trackUsage } from '@/lib/track-usage'
import { TranscriptAnalysis } from '@/lib/youtube-transcript'
import crypto from 'crypto'

export interface VideoContext {
    videoId: string
    currentTitle: string
    currentDescription: string
    currentTags: string[]
    transcript?: string | null
    transcriptAnalysis?: TranscriptAnalysis
    channelContext?: string
}

export interface OptimizationResult {
    title: string
    description: string
    tags: string[]
    reasoning?: string
}

export interface AiSettings {
    defaultModel: string
    temperature: 'precise' | 'balanced' | 'creative'
    maxTitleLength?: number
    maxDescriptionLength?: number
}

const temperatureMap = {
    precise: 0.2,
    balanced: 0.7,
    creative: 1.0,
}

interface InFlightRequestMetadata {
    promise: Promise<Partial<OptimizationResult>>
    startedAt: number
}

export class UnifiedAIOptimizer {
    private inFlightRequests = new Map<string, InFlightRequestMetadata>()
    private readonly DEDUP_CONFIG = {
        MAX_MAP_SIZE: 100,
        TTL_MS: 5 * 60 * 1000, // 5 minutes
        CLEANUP_INTERVAL_MS: 60 * 1000 // 1 minute
    }

    constructor() {
        // Start periodic cleanup in background if in server environment
        if (typeof window === 'undefined') {
            setInterval(() => this.cleanupStaleRequests(), this.DEDUP_CONFIG.CLEANUP_INTERVAL_MS)
        }
    }

    /**
     * Periodic cleanup of stale deduplication entries
     */
    private cleanupStaleRequests(): void {
        const now = Date.now()
        const ttlThreshold = now - this.DEDUP_CONFIG.TTL_MS

        for (const [key, metadata] of this.inFlightRequests.entries()) {
            if (metadata.startedAt < ttlThreshold) {
                this.inFlightRequests.delete(key)
            }
        }

        if (this.inFlightRequests.size > this.DEDUP_CONFIG.MAX_MAP_SIZE) {
            const sorted = Array.from(this.inFlightRequests.entries())
                .sort((a, b) => a[1].startedAt - b[1].startedAt)
            const toRemove = this.inFlightRequests.size - this.DEDUP_CONFIG.MAX_MAP_SIZE
            for (let i = 0; i < toRemove; i++) {
                this.inFlightRequests.delete(sorted[i][0])
            }
        }
    }

    /**
     * Helper function to wrap promises with timeout
     */
    private async withTimeout<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
        let timeoutId: NodeJS.Timeout

        const timeoutPromise = new Promise<T>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error(`AI API request timed out after ${timeoutMs}ms`))
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

    /**
     * Helper function to retry with exponential backoff
     */
    private async withRetry<T>(
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

                const delay = baseDelay * Math.pow(2, attempt)
                console.log(`[UNIFIED-OPTIMIZER-RETRY] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms:`, error.message)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }

        throw lastError || new Error('All retry attempts failed')
    }

    /**
     * Generate system prompt - SINGLE SOURCE OF TRUTH
     * This ensures all AI providers receive the same instructions
     */
    private generateSystemPrompt(): string {
        return `You are an expert YouTube SEO and content optimization specialist with deep knowledge of:
- YouTube's algorithm and ranking factors
- Viewer psychology and engagement patterns
- SEO best practices for video content
- Content strategy and discoverability

Your task is to optimize video metadata (title, description, tags) to maximize:
1. Search visibility and discoverability
2. Click-through rate (CTR)
3. Viewer engagement and retention
4. Algorithmic promotion

CRITICAL GUIDELINES:

**For Titles:**
- Length: 60-70 characters (optimal for search results)
- Front-load primary keywords in first 5 words
- Create curiosity without clickbait
- Use power words that drive clicks
- Include numbers when relevant (e.g., "10 Tips", "2024 Guide")
- Capitalize properly for readability

**For Descriptions:**
- First 2 lines (150 characters): Most critical for SEO and search snippets
- Include primary keyword in first sentence
- Structure: Hook → Value proposition → Details → Call-to-action
- Length: 150-300 words (sweet spot for engagement)
- Use natural language, avoid keyword stuffing
- Add relevant timestamps if applicable
- Include links strategically

**For Tags:**
- 10-15 tags total (optimal range)
- Mix of broad and specific tags
- Include: exact match, variations, related terms
- Order by relevance (most important first)
- Use multi-word phrases, not just single words
- Include misspellings of brand names if applicable

**MOST IMPORTANT:**
Base ALL optimizations on the actual VIDEO CONTENT when available.
Don't just rewrite existing metadata - understand what the video is about and optimize accordingly.`
    }

    /**
     * Generate user prompt with video context
     */
    private generateUserPrompt(context: VideoContext, optimizationType: 'all' | 'title' | 'description' | 'tags'): string {
        const { transcript, transcriptAnalysis, currentTitle, currentDescription, currentTags } = context

        let prompt = `Optimize this YouTube video's metadata based on its actual content:\n\n`

        // Add video content analysis if available
        if (transcriptAnalysis) {
            prompt += `📹 VIDEO CONTENT ANALYSIS:\n`
            prompt += `Main Topics: ${transcriptAnalysis.mainTopics.join(', ')}\n`
            prompt += `Key Keywords: ${transcriptAnalysis.keywords.slice(0, 10).join(', ')}\n`
            prompt += `Key Phrases: ${transcriptAnalysis.keyPhrases.slice(0, 5).join(', ')}\n`
            prompt += `Content Summary: ${transcriptAnalysis.summary}\n`
            prompt += `Estimated Duration: ${transcriptAnalysis.estimatedDuration} minutes\n\n`
        } else if (transcript) {
            // If we have transcript but no analysis, include first 500 characters
            prompt += `📹 VIDEO TRANSCRIPT (excerpt):\n${transcript.substring(0, 500)}...\n\n`
        } else {
            prompt += `⚠️ Note: Video transcript not available. Optimize based on existing metadata.\n\n`
        }

        // Add current metadata
        prompt += `📊 CURRENT METADATA:\n`
        prompt += `Title: "${currentTitle}"\n`
        prompt += `Description: "${currentDescription.substring(0, 300)}${currentDescription.length > 300 ? '...' : ''}"\n`
        prompt += `Tags: ${currentTags.join(', ')}\n\n`

        // Add optimization instructions based on type
        switch (optimizationType) {
            case 'title':
                prompt += `🎯 TASK: Generate an optimized title only.\n\n`
                prompt += `Respond with JSON:\n{\n  "title": "your optimized title here",\n  "reasoning": "brief explanation of changes"\n}`
                break

            case 'description':
                prompt += `🎯 TASK: Generate an optimized description only.\n\n`
                prompt += `Respond with JSON:\n{\n  "description": "your optimized description here",\n  "reasoning": "brief explanation of changes"\n}`
                break

            case 'tags':
                prompt += `🎯 TASK: Generate optimized tags only.\n\n`
                prompt += `Respond with JSON:\n{\n  "tags": ["tag1", "tag2", "tag3", ...],\n  "reasoning": "brief explanation of tag selection"\n}`
                break

            case 'all':
            default:
                prompt += `🎯 TASK: Generate complete optimized metadata (title, description, tags).\n\n`
                prompt += `Respond with JSON:\n{\n  "title": "optimized title",\n  "description": "optimized description",\n  "tags": ["tag1", "tag2", ...],\n  "reasoning": "brief explanation of optimization strategy"\n}`
                break
        }

        return prompt
    }

    /**
     * Parse and validate JSON response from AI
     */
    private parseResponse(text: string): Partial<OptimizationResult> {
        try {
            // Remove markdown code blocks if present
            const jsonString = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const parsed = JSON.parse(jsonString)

            // Validate structure
            if (parsed.title && typeof parsed.title !== 'string') {
                throw new Error('Invalid title format')
            }
            if (parsed.description && typeof parsed.description !== 'string') {
                throw new Error('Invalid description format')
            }
            if (parsed.tags && !Array.isArray(parsed.tags)) {
                throw new Error('Invalid tags format')
            }

            return parsed
        } catch (e) {
            console.error('[UNIFIED-OPTIMIZER] Failed to parse AI response:', text)
            throw new Error('AI returned invalid JSON format. Please try again.')
        }
    }

    /**
     * Call OpenAI with unified prompts
     */
    private async callOpenAI(
        apiKey: string,
        systemPrompt: string,
        userPrompt: string,
        settings: AiSettings,
        userId: string
    ): Promise<Partial<OptimizationResult>> {
        const openai = new OpenAI({ apiKey })

        await trackUsage('openai', 'api_calls')
        await acquireRateLimit('openai', userId)

        const { getBestOpenAIModel } = await import('@/lib/openai-models')
        const model = await getBestOpenAIModel(apiKey, settings.defaultModel)

        console.log('[UNIFIED-OPTIMIZER] OpenAI using model:', model)

        const completion = await this.withRetry(async () => {
            return await this.withTimeout(
                openai.chat.completions.create({
                    model,
                    temperature: temperatureMap[settings.temperature],
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: 'json_object' }
                })
            )
        })

        if (completion.usage) {
            await trackUsage('openai', 'content_generation', {
                inputTokens: completion.usage.prompt_tokens,
                outputTokens: completion.usage.completion_tokens,
                totalTokens: completion.usage.total_tokens
            })
        }

        const content = completion.choices[0]?.message?.content
        if (!content) throw new Error('OpenAI returned empty response')

        return this.parseResponse(content)
    }

    /**
     * Call Anthropic with unified prompts
     */
    private async callAnthropic(
        apiKey: string,
        systemPrompt: string,
        userPrompt: string,
        settings: AiSettings,
        userId: string
    ): Promise<Partial<OptimizationResult>> {
        const anthropic = new Anthropic({ apiKey })

        await trackUsage('anthropic', 'api_calls')
        await acquireRateLimit('anthropic', userId)

        const { getBestAnthropicModel } = await import('@/lib/anthropic-models')
        const model = await getBestAnthropicModel(apiKey, settings.defaultModel)

        console.log('[UNIFIED-OPTIMIZER] Anthropic using model:', model)

        const message = await this.withRetry(async () => {
            return await this.withTimeout(
                anthropic.messages.create({
                    model,
                    max_tokens: 2048,
                    temperature: temperatureMap[settings.temperature],
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userPrompt }]
                })
            )
        })

        if (message.usage) {
            await trackUsage('anthropic', 'content_generation', {
                inputTokens: message.usage.input_tokens,
                outputTokens: message.usage.output_tokens,
                totalTokens: message.usage.input_tokens + message.usage.output_tokens
            })
        }

        const content = message.content[0]
        if (!content || !('text' in content)) {
            throw new Error('Anthropic returned invalid response')
        }

        return this.parseResponse(content.text)
    }

    /**
     * Call Google Gemini with unified prompts
     */
    private async callGemini(
        apiKey: string,
        systemPrompt: string,
        userPrompt: string,
        settings: AiSettings,
        userId: string
    ): Promise<Partial<OptimizationResult>> {
        const genAI = new GoogleGenerativeAI(apiKey)

        await trackUsage('gemini', 'api_calls')
        await acquireRateLimit('gemini', userId)

        const { getBestGeminiModel } = await import('@/lib/gemini-models')
        const modelName = await getBestGeminiModel(apiKey, settings.defaultModel)

        console.log('[UNIFIED-OPTIMIZER] Gemini using model:', modelName)

        const model = genAI.getGenerativeModel({ model: modelName })
        const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`

        const result = await this.withRetry(async () => {
            return await this.withTimeout(
                model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: combinedPrompt }] }],
                    generationConfig: {
                        temperature: temperatureMap[settings.temperature],
                    }
                })
            )
        })

        const response = await result.response
        const text = response.text()

        if (!text) throw new Error('Gemini returned empty response')

        const estimatedTokens = Math.ceil(text.length / 4)
        await trackUsage('gemini', 'content_generation', { totalTokens: estimatedTokens })

        return this.parseResponse(text)
    }

    /**
     * Call Mistral with unified prompts
     */
    private async callMistral(
        apiKey: string,
        systemPrompt: string,
        userPrompt: string,
        settings: AiSettings,
        userId: string
    ): Promise<Partial<OptimizationResult>> {
        const mistral = new Mistral({ apiKey })

        await trackUsage('mistral', 'api_calls')
        await acquireRateLimit('mistral', userId)

        const { getBestMistralModel } = await import('@/lib/mistral-models')
        const model = await getBestMistralModel(apiKey, settings.defaultModel)

        console.log('[UNIFIED-OPTIMIZER] Mistral using model:', model)

        const response = await this.withRetry(async () => {
            return await this.withTimeout(
                mistral.chat.complete({
                    model,
                    temperature: temperatureMap[settings.temperature],
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    responseFormat: { type: 'json_object' }
                })
            )
        })

        if (response.usage) {
            await trackUsage('mistral', 'content_generation', {
                inputTokens: response.usage.promptTokens,
                outputTokens: response.usage.completionTokens,
                totalTokens: response.usage.totalTokens
            })
        }

        const content = response.choices[0]?.message?.content
        if (!content || typeof content !== 'string') {
            throw new Error('Mistral returned invalid response')
        }

        return this.parseResponse(content)
    }

    /**
     * Main optimization method - routes to appropriate provider with deduplication
     */
    async optimize(
        context: VideoContext,
        provider: 'openai' | 'anthropic' | 'gemini' | 'mistral',
        apiKey: string,
        settings: AiSettings,
        userId: string,
        optimizationType: 'all' | 'title' | 'description' | 'tags' = 'all'
    ): Promise<Partial<OptimizationResult>> {
        // Security check: Ensure API key is present and well-formed
        if (!apiKey || apiKey.length < 5) {
            throw new Error('Invalid or missing API key for ' + provider)
        }

        // Generate unique key for deduplication
        const requestData = JSON.stringify({
            userId,
            videoId: context.videoId,
            type: optimizationType,
            title: context.currentTitle,
            description: context.currentDescription,
            provider
        })
        const requestKey = crypto.createHash('sha256').update(requestData).digest('hex')

        // Check for in-flight request
        const existing = this.inFlightRequests.get(requestKey)
        if (existing) {
            console.log('[UNIFIED-OPTIMIZER-DEDUP] Returning existing promise for:', requestKey)
            return existing.promise
        }

        const systemPrompt = this.generateSystemPrompt()
        const userPrompt = this.generateUserPrompt(context, optimizationType)

        console.log('[UNIFIED-OPTIMIZER] Optimizing with provider:', provider, 'type:', optimizationType)

        const optimizationPromise = (async () => {
            try {
                switch (provider) {
                    case 'openai':
                        return await this.callOpenAI(apiKey, systemPrompt, userPrompt, settings, userId)
                    case 'anthropic':
                        return await this.callAnthropic(apiKey, systemPrompt, userPrompt, settings, userId)
                    case 'gemini':
                        return await this.callGemini(apiKey, systemPrompt, userPrompt, settings, userId)
                    case 'mistral':
                        return await this.callMistral(apiKey, systemPrompt, userPrompt, settings, userId)
                    default:
                        throw new Error(`Unsupported AI provider: ${provider}`)
                }
            } finally {
                // Remove from map after a short delay to allow next request
                setTimeout(() => this.inFlightRequests.delete(requestKey), 2000)
            }
        })()

        this.inFlightRequests.set(requestKey, {
            promise: optimizationPromise,
            startedAt: Date.now()
        })

        try {
            return await optimizationPromise
        } catch (error: any) {
            console.error('[UNIFIED-OPTIMIZER] Error:', error)

            if (error instanceof RateLimitTimeoutError) {
                throw error
            }

            throw new Error(`${provider} optimization failed: ${error.message}`)
        }
    }
}

// Export singleton instance
export const unifiedOptimizer = new UnifiedAIOptimizer()
