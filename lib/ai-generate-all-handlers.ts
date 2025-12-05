import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { acquireRateLimit, RateLimitTimeoutError } from '@/lib/rate-limiter'
import { trackUsage } from '@/lib/track-usage'
import { getFallbackModel, isValidModel } from '@/lib/ai-providers'

interface AiSettings {
    defaultModel: string
    temperature: 'precise' | 'balanced' | 'creative'
    maxTitleLength?: number
    maxDescriptionLength?: number
}

interface GeneratedContent {
    title: string
    description: string
    tags: string[]
}

const temperatureMap = {
    precise: 0.2,
    balanced: 0.7,
    creative: 1.0,
}

// Helper to parse JSON response
const parseJsonResponse = (text: string): GeneratedContent => {
    try {
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(jsonString)

        // Validate structure
        if (!parsed.title || !parsed.description || !Array.isArray(parsed.tags)) {
            throw new Error('Invalid response structure')
        }

        return parsed
    } catch (e) {
        console.error('Failed to parse AI response JSON:', text)
        throw new Error('The AI returned a response in an invalid format. Please try again.')
    }
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

export const handleGenerateAllOpenAI = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string): Promise<GeneratedContent> => {
    const openai = new OpenAI({ apiKey })

    // Track API call
    await trackUsage('openai', 'api_calls');

    // Acquire rate limit token before making API call
    await acquireRateLimit('openai', userId)

    // Dynamically get the best available model for this API key
    const { getBestOpenAIModel } = await import('@/lib/openai-models')
    const modelToUse = await getBestOpenAIModel(apiKey, settings.defaultModel)

    console.log('[OPENAI-GENERATE-ALL] Using model:', modelToUse, '(requested:', settings.defaultModel, ')')

    // Models that support JSON mode
    const jsonModeModels = ['gpt-4o', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-4-1106-preview', 'gpt-3.5-turbo-1106']
    const supportsJsonMode = jsonModeModels.some(m => modelToUse.includes(m))

    const completionParams: any = {
        model: modelToUse,
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

export const handleGenerateAllGemini = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string): Promise<GeneratedContent> => {
    // Validate API key format
    if (!apiKey || !apiKey.startsWith('AIza')) {
        throw new Error('Invalid Gemini API key format. The key should start with "AIza".')
    }

    if (apiKey.length < 30) {
        throw new Error('Invalid Gemini API key - key appears to be too short.')
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Dynamically get the best available model for this API key
    const { getBestGeminiModel } = await import('@/lib/gemini-models')
    const modelToUse = await getBestGeminiModel(apiKey, settings.defaultModel)

    console.log('[GEMINI-GENERATE-ALL] Using model:', modelToUse, '(requested:', settings.defaultModel, ')')

    const model = genAI.getGenerativeModel({ model: modelToUse })

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

    // Acquire rate limit token before making API call
    await acquireRateLimit('gemini', userId)

    // Make the content generation call with timeout and retry
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
        throw new Error('Gemini returned an empty response')
    }

    const response = await result.response
    const text = response.text()

    if (!text) {
        throw new Error('Gemini returned an empty text response')
    }

    // Get usage info if available
    const estimatedTokens = Math.ceil(text.length / 4) // rough estimate

    await trackUsage('gemini', 'content_generation', {
        totalTokens: estimatedTokens
    })

    return parseJsonResponse(text)
}

export const handleGenerateAllAnthropic = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string): Promise<GeneratedContent> => {
    const anthropic = new Anthropic({ apiKey })

    // Dynamically get the best available model for this API key
    const { getBestAnthropicModel } = await import('@/lib/anthropic-models')
    const modelToUse = await getBestAnthropicModel(apiKey, settings.defaultModel)

    console.log('[ANTHROPIC-GENERATE-ALL] Using model:', modelToUse, '(requested:', settings.defaultModel, ')')

    // Track API call
    await trackUsage('anthropic', 'api_calls')

    // Acquire rate limit token before making API call
    await acquireRateLimit('anthropic', userId)

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
}

export const handleGenerateAllMistral = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string): Promise<GeneratedContent> => {
    const mistral = new Mistral({ apiKey })

    // Dynamically get the best available model for this API key
    const { getBestMistralModel } = await import('@/lib/mistral-models')
    const modelToUse = await getBestMistralModel(apiKey, settings.defaultModel)

    console.log('[MISTRAL-GENERATE-ALL] Using model:', modelToUse, '(requested:', settings.defaultModel, ')')

    // Track API call
    await trackUsage('mistral', 'api_calls')

    // Acquire rate limit token before making API call
    await acquireRateLimit('mistral', userId)

    const response = await withRetry(async () => {
        return await withTimeout(
            mistral.chat.complete({
                model: modelToUse,
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
}
