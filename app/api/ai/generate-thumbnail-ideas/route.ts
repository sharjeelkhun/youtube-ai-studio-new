import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { aiProviders } from '@/lib/ai-providers'
import { acquireRateLimit, RateLimitTimeoutError } from '@/lib/rate-limiter'
import { trackUsage } from '@/lib/track-usage'

interface AiSettings {
  defaultModel: string
  temperature: 'precise' | 'balanced' | 'creative'
}

interface AiSettingsRpcResponse {
  provider: string | null
  settings: {
    features: AiSettings
    apiKeys: { [key: string]: string }
  } | null
}

const temperatureMap = {
  precise: 0.2,
  balanced: 0.7,
  creative: 1.0,
}

const getPrompt = (title: string, description: string) => `
  You are an expert YouTube content strategist. Your task is to generate 3-5 creative and engaging thumbnail ideas for a video. The ideas should be descriptive and visually compelling.
  Original Title: "${title}"
  Original Description: "${description}"
  Your response must be a valid JSON object with the following structure:
  {
    "thumbnail_ideas": ["idea 1", "idea 2", "idea 3"]
  }
`

// Helper function to handle JSON parsing
const parseJsonResponse = (text: string) => {
  try {
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(jsonString)
  } catch (e) {
    console.error('Failed to parse AI response JSON:', text)
    throw new Error('The AI returned a response in an invalid format. Please try again.')
  }
}

// Helper function for Gemini
const handleGemini = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string) => {
  const genAI = new GoogleGenerativeAI(apiKey)

  // Dynamically get the best available model for this API key
  const { getBestGeminiModel } = await import('@/lib/gemini-models')
  const modelToUse = await getBestGeminiModel(apiKey, settings.defaultModel)

  console.log('[GEMINI-THUMBNAIL-IDEAS] Using model:', modelToUse, '(requested:', settings.defaultModel, ')')

  const model = genAI.getGenerativeModel({ model: modelToUse })
  const prompt = getPrompt(title, description)

  // Acquire rate limit token before making API call
  await acquireRateLimit('gemini', userId)

  await trackUsage('gemini', 'api_calls')

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: temperatureMap[settings.temperature],
    },
  })
  const response = await result.response
  const text = response.text()

  const estimatedTokens = Math.ceil(text.length / 4)
  await trackUsage('gemini', 'content_generation', {
    totalTokens: estimatedTokens
  })

  return parseJsonResponse(text)
}

// Helper function for OpenAI
const handleOpenAI = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string) => {
  const openai = new OpenAI({ apiKey })

  // Dynamically get the best available model
  const { getBestOpenAIModel } = await import('@/lib/openai-models')
  const modelToUse = await getBestOpenAIModel(apiKey, settings.defaultModel)
  console.log('[OPENAI-THUMBNAIL-IDEAS] Using model:', modelToUse, '(requested:', settings.defaultModel, ')')

  // Acquire rate limit token before making API call
  await acquireRateLimit('openai', userId)

  await trackUsage('openai', 'api_calls')

  const completion = await openai.chat.completions.create({
    model: modelToUse,
    temperature: temperatureMap[settings.temperature],
    messages: [
      {
        role: 'system',
        content: `You are an expert YouTube content strategist. Your response must be a valid JSON object with the following structure: { "thumbnail_ideas": ["string", ...] }`
      },
      {
        role: 'user',
        content: `Based on the following title and description, generate 3-5 creative and engaging thumbnail ideas.\nOriginal Title: "${title}"\nOriginal Description: "${description}"`
      }
    ],
    response_format: { type: 'json_object' }
  })

  if (completion.usage) {
    await trackUsage('openai', 'content_generation', {
      inputTokens: completion.usage.prompt_tokens,
      outputTokens: completion.usage.completion_tokens,
      totalTokens: completion.usage.total_tokens
    })
  } else {
    await trackUsage('openai', 'content_generation')
  }

  const text = completion.choices[0].message.content
  if (!text) {
    throw new Error('OpenAI returned an empty response.')
  }
  return parseJsonResponse(text)
}

// Helper function for Anthropic
const handleAnthropic = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string) => {
  const anthropic = new Anthropic({ apiKey })

  // Dynamically get the best available model
  const { getBestAnthropicModel } = await import('@/lib/anthropic-models')
  const modelToUse = await getBestAnthropicModel(apiKey, settings.defaultModel)
  console.log('[ANTHROPIC-THUMBNAIL-IDEAS] Using model:', modelToUse, '(requested:', settings.defaultModel, ')')

  // Acquire rate limit token before making API call
  await acquireRateLimit('anthropic', userId)

  await trackUsage('anthropic', 'api_calls')

  const msg = await anthropic.messages.create({
    model: modelToUse,
    temperature: temperatureMap[settings.temperature],
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: getPrompt(title, description)
      }
    ]
  })

  if (!msg.content || !msg.content[0] || !('text' in msg.content[0])) {
    throw new Error('Anthropic returned an empty or invalid response.')
  }

  if (msg.usage) {
    await trackUsage('anthropic', 'content_generation', {
      inputTokens: msg.usage.input_tokens,
      outputTokens: msg.usage.output_tokens,
      totalTokens: msg.usage.input_tokens + msg.usage.output_tokens
    })
  } else {
    const text = msg.content[0].text
    const estimatedTokens = Math.ceil(text.length / 4)
    await trackUsage('anthropic', 'content_generation', {
      totalTokens: estimatedTokens
    })
  }

  return parseJsonResponse(msg.content[0].text)
}

// Helper function for Mistral
const handleMistral = async (apiKey: string, title: string, description: string, settings: AiSettings, userId: string) => {
  const mistral = new Mistral({ apiKey })

  // Dynamically get the best available model
  const { getBestMistralModel } = await import('@/lib/mistral-models')
  const modelToUse = await getBestMistralModel(apiKey, settings.defaultModel)
  console.log('[MISTRAL-THUMBNAIL-IDEAS] Using model:', modelToUse, '(requested:', settings.defaultModel, ')')

  // Acquire rate limit token before making API call
  await acquireRateLimit('mistral', userId)

  await trackUsage('mistral', 'api_calls')

  const response = await mistral.chat.complete({
    model: modelToUse,
    temperature: temperatureMap[settings.temperature],
    messages: [
      {
        role: 'system',
        content: `You are an expert YouTube content strategist. Your response must be a valid JSON object with the following structure: { "thumbnail_ideas": ["string", ...] }`
      },
      {
        role: 'user',
        content: `Based on the following title and description, generate 3-5 creative and engaging thumbnail ideas.\nOriginal Title: "${title}"\nOriginal Description: "${description}"`
      }
    ],
    responseFormat: { type: 'json_object' }
  })

  if (response.usage) {
    await trackUsage('mistral', 'content_generation', {
      inputTokens: response.usage.promptTokens || (response.usage as any).prompt_tokens || 0,
      outputTokens: response.usage.completionTokens || (response.usage as any).completion_tokens || 0,
      totalTokens: response.usage.totalTokens || (response.usage as any).total_tokens ||
        (response.usage.promptTokens || (response.usage as any).prompt_tokens || 0) +
        (response.usage.completionTokens || (response.usage as any).completion_tokens || 0)
    })
  } else {
    const content = response.choices[0].message.content
    const estimatedTokens = typeof content === 'string' ? Math.ceil(content.length / 4) : 0
    await trackUsage('mistral', 'content_generation', {
      totalTokens: estimatedTokens
    })
  }

  const content = response.choices[0].message.content;

  if (typeof content === 'string') {
    return parseJsonResponse(content);
  } else {
    throw new Error('Mistral AI returned a response in an unexpected format.');
  }
}

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase.rpc('get_ai_settings').single()

    if (error || !data) {
      return NextResponse.json({ error: 'AI provider not configured. Please configure it in the settings.' }, { status: 400 })
    }

    const profile = data as AiSettingsRpcResponse

    if (!profile.provider || !profile.settings) {
      return NextResponse.json({ error: 'AI provider not configured. Please configure it in the settings.' }, { status: 400 })
    }

    const apiKey = profile.settings.apiKeys?.[profile.provider]
    if (!apiKey) {
      return NextResponse.json({ error: `API key for ${profile.provider} not found. Please add it in the settings.` }, { status: 400 })
    }

    const body = await req.json()
    const { title, description } = body
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const aiSettings = { ...profile.settings.features }

    const providerConfig = aiProviders.find(p => p.id === profile.provider)
    if (providerConfig) {
      const isValidModel = providerConfig.models.some(m => m.id === aiSettings.defaultModel)
      if (!isValidModel) {
        aiSettings.defaultModel = providerConfig.models[0].id
      }
    }

    // Extract userId for rate limiting
    const userId = session.user.id

    let thumbnailIdeas
    if (profile.provider === 'gemini') {
      thumbnailIdeas = await handleGemini(apiKey, title, description, aiSettings, userId)
    } else if (profile.provider === 'openai') {
      thumbnailIdeas = await handleOpenAI(apiKey, title, description, aiSettings, userId)
    } else if (profile.provider === 'anthropic') {
      thumbnailIdeas = await handleAnthropic(apiKey, title, description, aiSettings, userId)
    } else if (profile.provider === 'mistral') {
      thumbnailIdeas = await handleMistral(apiKey, title, description, aiSettings, userId)
    } else {
      return NextResponse.json({ error: `Provider "${profile.provider}" is not supported.` }, { status: 400 })
    }

    return NextResponse.json(thumbnailIdeas)

  } catch (error) {
    console.error('[AI_GENERATE_THUMBNAIL_IDEAS_ERROR]', error)

    // Handle rate limit timeout errors from centralized limiter
    if (error instanceof RateLimitTimeoutError) {
      return NextResponse.json({
        error: error.message,
        errorCode: 'rate_limit_timeout'
      }, { status: 429 })
    }

    if (error instanceof Error) {
      const errorMessage = error.message;

      // Handle rate limit errors (429) - check before billing errors
      if (/429|rate.?limit|too many requests|quota exceeded/i.test(errorMessage)) {
        return NextResponse.json({
          error: 'Your AI provider is currently rate limited. Please wait a moment and try again.',
          errorCode: 'rate_limit_error'
        }, { status: 429 })
      }

      // Handle billing/credit errors (400)
      if (/credit|balance|billing|plan/i.test(errorMessage)) {
        return NextResponse.json({
          error: 'A billing-related error occurred with the AI provider. Please check your plan and billing details with the provider.',
          errorCode: 'billing_error'
        }, { status: 400 });
      }

      if (/api key/i.test(errorMessage) || /authentication/i.test(errorMessage)) {
        return NextResponse.json({ error: 'The provided API key is invalid or has been rejected by the provider.' }, { status: 400 })
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
