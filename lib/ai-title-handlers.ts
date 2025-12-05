import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { acquireRateLimit } from '@/lib/rate-limiter'
import { trackUsage } from '@/lib/track-usage'
import { getFallbackModel, isValidModel } from '@/lib/ai-providers'
import { optimizeTitlePrompt } from '@/lib/prompts'

interface AISettings {
    model?: string
    temperature?: number
    maxTokens?: number
    apiKeys: {
        [key: string]: string
    }
}

export async function handleOpenAI(
    apiKey: string,
    title: string,
    description: string,
    settings: AISettings,
    userId: string
): Promise<string> {
    const openai = new OpenAI({ apiKey })

    // Dynamically get the best available model
    const { getBestOpenAIModel } = await import('@/lib/openai-models')
    const modelToUse = await getBestOpenAIModel(apiKey, settings.model)
    console.log('[OPENAI-TITLE] Using model:', modelToUse, '(requested:', settings.model, ')')

    const prompt = optimizeTitlePrompt(title, description)

    // Acquire rate limit token before making API call
    await acquireRateLimit('openai', userId)

    await trackUsage('openai', 'api_calls')

    const response = await openai.chat.completions.create({
        model: modelToUse,
        temperature: settings.temperature || 0.7,
        max_tokens: settings.maxTokens || 100,
        messages: [{ role: 'user', content: prompt }]
    })

    if (response.usage) {
        await trackUsage('openai', 'content_generation', {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens
        })
    } else {
        await trackUsage('openai', 'content_generation')
    }

    const optimizedTitle = response.choices[0]?.message?.content?.trim() || title
    return cleanTitle(optimizedTitle)
}

export async function handleAnthropic(
    apiKey: string,
    title: string,
    description: string,
    settings: AISettings,
    userId: string
): Promise<string> {
    const anthropic = new Anthropic({ apiKey })

    // Dynamically get the best available model
    const { getBestAnthropicModel } = await import('@/lib/anthropic-models')
    const modelToUse = await getBestAnthropicModel(apiKey, settings.model)
    console.log('[ANTHROPIC-TITLE] Using model:', modelToUse, '(requested:', settings.model, ')')

    const prompt = optimizeTitlePrompt(title, description)

    // Acquire rate limit token before making API call
    await acquireRateLimit('anthropic', userId)

    await trackUsage('anthropic', 'api_calls')

    const response = await anthropic.messages.create({
        model: modelToUse,
        max_tokens: settings.maxTokens || 100,
        temperature: settings.temperature || 0.7,
        messages: [{ role: 'user', content: prompt }]
    })

    if (response.usage) {
        await trackUsage('anthropic', 'content_generation', {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0)
        })
    } else {
        await trackUsage('anthropic', 'content_generation')
    }

    const optimizedTitle = response.content[0]?.type === 'text' ? response.content[0].text : title
    return cleanTitle(optimizedTitle)
}

export async function handleMistral(
    apiKey: string,
    title: string,
    description: string,
    settings: AISettings,
    userId: string
): Promise<string> {
    const mistral = new Mistral({ apiKey })

    // Dynamically get the best available model
    const { getBestMistralModel } = await import('@/lib/mistral-models')
    const modelToUse = await getBestMistralModel(apiKey, settings.model)
    console.log('[MISTRAL-TITLE] Using model:', modelToUse, '(requested:', settings.model, ')')

    const prompt = optimizeTitlePrompt(title, description)

    // Acquire rate limit token before making API call
    await acquireRateLimit('mistral', userId)

    await trackUsage('mistral', 'api_calls')

    const response = await mistral.chat.complete({
        model: modelToUse,
        messages: [{ role: 'user', content: prompt }]
    })

    const optimizedTitle = typeof response.choices[0]?.message?.content === 'string'
        ? response.choices[0].message.content
        : title

    if (response.usage) {
        await trackUsage('mistral', 'content_generation', {
            inputTokens: response.usage.promptTokens || (response.usage as any).prompt_tokens || 0,
            outputTokens: response.usage.completionTokens || (response.usage as any).completion_tokens || 0,
            totalTokens: response.usage.totalTokens || (response.usage as any).total_tokens ||
                (response.usage.promptTokens || (response.usage as any).prompt_tokens || 0) +
                (response.usage.completionTokens || (response.usage as any).completion_tokens || 0)
        })
    } else {
        const estimatedTokens = Math.ceil(optimizedTitle.length / 4)
        await trackUsage('mistral', 'content_generation', {
            totalTokens: estimatedTokens
        })
    }

    return cleanTitle(optimizedTitle)
}

export async function handleGemini(
    apiKey: string,
    title: string,
    description: string,
    settings: AISettings,
    userId: string
): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey)

    // Dynamically get the best available model for this API key
    const { getBestGeminiModel } = await import('@/lib/gemini-models')
    const modelToUse = await getBestGeminiModel(apiKey, settings.model)

    console.log('[GEMINI-TITLE] Using model:', modelToUse, '(requested:', settings.model, ')')

    const model = genAI.getGenerativeModel({ model: modelToUse })
    const prompt = optimizeTitlePrompt(title, description)

    // Acquire rate limit token before making API call
    await acquireRateLimit('gemini', userId)

    await trackUsage('gemini', 'api_calls')

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const optimizedTitle = text || title

    const estimatedTokens = Math.ceil(text.length / 4)
    await trackUsage('gemini', 'content_generation', {
        totalTokens: estimatedTokens
    })

    return cleanTitle(optimizedTitle)
}

function cleanTitle(title: string): string {
    return title
        .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes
        .replace(/\\n/g, '') // Remove newlines
        .replace(/\*+/g, '') // Remove asterisks
        .replace(/#+/g, '') // Remove hashtags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
}
