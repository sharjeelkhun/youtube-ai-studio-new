import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { acquireRateLimit, RateLimitTimeoutError } from '@/lib/rate-limiter'
import { trackUsage } from '@/lib/track-usage'
import { getFallbackModel, isValidModel } from '@/lib/ai-providers'

interface AISettings {
  model?: string
  temperature?: number
  maxTokens?: number
  apiKeys: {
    [key: string]: string
  }
}

interface OptimizedContent {
  title?: string
  description?: string
}

const OPTIMIZE_PROMPT = `You are an expert YouTube content optimizer. You will receive a title and description, and your task is to provide an optimized version of the description that:
1. Is more engaging and uses natural, conversational language
2. Includes relevant keywords naturally for SEO
3. Follows YouTube best practices for descriptions
4. Maintains authenticity and avoids clickbait
5. Keeps any existing sections and hashtags

Current Title: "{title}"
Current Description: "{description}"

Important: Return ONLY the optimized description text. Do not include any explanations, notes, or formatting instructions. Do not prefix with labels like "Optimized Description:" or similar. Just return the raw optimized description text that would go directly into YouTube.`

export async function handleOpenAI(
  apiKey: string,
  title: string,
  description: string,
  settings: AISettings,
  userId: string
): Promise<OptimizedContent> {
  const openai = new OpenAI({ apiKey })

  // Dynamically get the best available model
  const { getBestOpenAIModel } = await import('@/lib/openai-models')
  const modelToUse = await getBestOpenAIModel(apiKey, settings.model)
  console.log('[OPENAI-DESCRIPTION] Using model:', modelToUse, '(requested:', settings.model, ')')

  const prompt = OPTIMIZE_PROMPT
    .replace('{title}', title)
    .replace('{description}', description)

  // Acquire rate limit token before making API call
  await acquireRateLimit('openai', userId)

  await trackUsage('openai', 'api_calls')

  const response = await openai.chat.completions.create({
    model: modelToUse,
    temperature: settings.temperature || 0.7,
    max_tokens: settings.maxTokens || 1000,
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

  const optimizedDescription = response.choices[0]?.message?.content

  // Remove any potential formatting or explanation markers
  const cleanedDescription = optimizedDescription
    ?.replace(/^(Here's your |Optimized |Updated )(YouTube )?[Dd]escription:?(\s*—|-+|\*+)?/g, '')
    ?.replace(/^(\*\*|### |\[|\()?(Key )?Improvements:?(\*\*|\]|\))?[\s\S]*$/, '')
    ?.replace(/^---+\s*/, '')
    ?.trim() || description

  return {
    description: cleanedDescription
  }
}

export async function handleAnthropic(
  apiKey: string,
  title: string,
  description: string,
  settings: AISettings,
  userId: string
): Promise<OptimizedContent> {
  const anthropic = new Anthropic({ apiKey })

  // Dynamically get the best available model
  const { getBestAnthropicModel } = await import('@/lib/anthropic-models')
  const modelToUse = await getBestAnthropicModel(apiKey, settings.model)
  console.log('[ANTHROPIC-DESCRIPTION] Using model:', modelToUse, '(requested:', settings.model, ')')

  const prompt = OPTIMIZE_PROMPT
    .replace('{title}', title)
    .replace('{description}', description)

  // Acquire rate limit token before making API call
  await acquireRateLimit('anthropic', userId)

  await trackUsage('anthropic', 'api_calls')

  const response = await anthropic.messages.create({
    model: modelToUse,
    max_tokens: settings.maxTokens || 1000,
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

  const optimizedDescription = response.content[0]?.type === 'text' ? response.content[0].text : description

  // Remove any potential formatting or explanation markers
  const cleanedDescription = optimizedDescription
    ?.replace(/^(Here's your |Optimized |Updated )(YouTube )?[Dd]escription:?(\s*—|-+|\*+)?/g, '')
    ?.replace(/^(\*\*|### |\[|\()?(Key )?Improvements:?(\*\*|\]|\))?[\s\S]*$/, '')
    ?.replace(/^---+\s*/, '')
    ?.trim() || description

  return {
    description: cleanedDescription
  }
}

export async function handleMistral(
  apiKey: string,
  title: string,
  description: string,
  settings: AISettings,
  userId: string
): Promise<OptimizedContent> {
  const mistral = new Mistral({ apiKey })
  const prompt = OPTIMIZE_PROMPT
    .replace('{title}', title)
    .replace('{description}', description)

  // Acquire rate limit token before making API call
  await acquireRateLimit('mistral', userId)

  await trackUsage('mistral', 'api_calls')

  const response = await mistral.chat.complete({
    model: settings.model || 'mistral-large-latest',
    messages: [{ role: 'user', content: prompt }]
  })

  const optimizedDescription = typeof response.choices[0]?.message?.content === 'string'
    ? response.choices[0].message.content
    : description

  if (response.usage) {
    await trackUsage('mistral', 'content_generation', {
      inputTokens: response.usage.promptTokens || (response.usage as any).prompt_tokens || 0,
      outputTokens: response.usage.completionTokens || (response.usage as any).completion_tokens || 0,
      totalTokens: response.usage.totalTokens || (response.usage as any).total_tokens ||
        (response.usage.promptTokens || (response.usage as any).prompt_tokens || 0) +
        (response.usage.completionTokens || (response.usage as any).completion_tokens || 0)
    })
  } else {
    const estimatedTokens = Math.ceil(optimizedDescription.length / 4)
    await trackUsage('mistral', 'content_generation', {
      totalTokens: estimatedTokens
    })
  }

  // Remove any potential formatting or explanation markers
  const cleanedDescription = optimizedDescription
    ?.replace(/^(Here's your |Optimized |Updated )(YouTube )?[Dd]escription:?(\s*—|-+|\*+)?/g, '')
    ?.replace(/^(\*\*|### |\[|\()?(Key )?Improvements:?(\*\*|\]|\))?[\s\S]*$/, '')
    ?.replace(/^---+\s*/, '')
    ?.trim() || description

  return {
    description: cleanedDescription
  }
}

export async function handleGemini(
  apiKey: string,
  title: string,
  description: string,
  settings: AISettings,
  userId: string
): Promise<OptimizedContent> {
  const genAI = new GoogleGenerativeAI(apiKey)

  // Dynamically get the best available model for this API key
  const { getBestGeminiModel } = await import('@/lib/gemini-models')
  const modelToUse = await getBestGeminiModel(apiKey, settings.model)

  console.log('[GEMINI-DESCRIPTION] Using model:', modelToUse, '(requested:', settings.model, ')')

  const model = genAI.getGenerativeModel({ model: modelToUse })
  const prompt = OPTIMIZE_PROMPT
    .replace('{title}', title)
    .replace('{description}', description)

  // Acquire rate limit token before making API call
  await acquireRateLimit('gemini', userId)

  await trackUsage('gemini', 'api_calls')

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  const optimizedDescription = text || description

  const estimatedTokens = Math.ceil(text.length / 4)
  await trackUsage('gemini', 'content_generation', {
    totalTokens: estimatedTokens
  })

  // Remove any potential formatting or explanation markers
  const cleanedDescription = optimizedDescription
    ?.replace(/^(Here's your |Optimized |Updated )(YouTube )?[Dd]escription:?(\s*—|-+|\*+)?/g, '')
    ?.replace(/^(\*\*|### |\[|\()?(Key )?Improvements:?(\*\*|\]|\))?[\s\S]*$/, '')
    ?.replace(/^---+\s*/, '')
    ?.trim() || description

  return {
    description: cleanedDescription
  }
}