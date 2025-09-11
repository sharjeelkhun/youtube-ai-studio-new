import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { aiProviders } from '@/lib/ai-providers'

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
const handleGemini = async (apiKey: string, title: string, description: string, settings: AiSettings) => {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: settings.defaultModel })
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
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: temperatureMap[settings.temperature],
    },
  })
  const response = await result.response
  const text = response.text()
  return parseJsonResponse(text)
}

// Helper function for OpenAI
const handleOpenAI = async (apiKey: string, title: string, description: string, settings: AiSettings) => {
  const openai = new OpenAI({ apiKey })
  const completion = await openai.chat.completions.create({
    model: settings.defaultModel,
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
    response_format: { type: 'json_object' }
  })
  const text = completion.choices[0].message.content
  if (!text) {
    throw new Error('OpenAI returned an empty response.')
  }
  return parseJsonResponse(text)
}

// Helper function for Anthropic
const handleAnthropic = async (apiKey: string, title: string, description: string, settings: AiSettings) => {
  const anthropic = new Anthropic({ apiKey })
  const msg = await anthropic.messages.create({
    model: settings.defaultModel,
    temperature: temperatureMap[settings.temperature],
    max_tokens: 1024,
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
  })

  if (!msg.content || !msg.content[0] || !('text' in msg.content[0])) {
    throw new Error('Anthropic returned an empty or invalid response.')
  }

  return parseJsonResponse(msg.content[0].text)
}

// Helper function for Mistral
const handleMistral = async (apiKey: string, title: string, description: string, settings: AiSettings) => {
  const mistral = new Mistral({ apiKey })
  const response = await mistral.chat.complete({
    model: settings.defaultModel,
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
  })

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
    } as AiSettingsRpcResponse

    if (!profile.provider) {
      return NextResponse.json({ error: 'AI provider not selected. Please select a provider in settings.' }, { status: 400 })
    }

    if (!profile.settings?.apiKeys || Object.keys(profile.settings.apiKeys).length === 0) {
      return NextResponse.json({ error: 'No API keys configured. Please add your API key in settings.' }, { status: 400 })
    }

    const apiKey = profile.settings.apiKeys[profile.provider]
    if (!apiKey) {
      return NextResponse.json({ 
        error: `API key for ${profile.provider} not found. Please add your ${profile.provider} API key in settings.` 
      }, { status: 400 })
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

    let optimizedData
    if (profile.provider === 'gemini') {
      optimizedData = await handleGemini(apiKey, title, description, aiSettings)
    } else if (profile.provider === 'openai') {
      optimizedData = await handleOpenAI(apiKey, title, description, aiSettings)
    } else if (profile.provider === 'anthropic') {
      optimizedData = await handleAnthropic(apiKey, title, description, aiSettings)
    } else if (profile.provider === 'mistral') {
      optimizedData = await handleMistral(apiKey, title, description, aiSettings)
    } else {
      return NextResponse.json({ error: `Provider "${profile.provider}" is not supported.` }, { status: 400 })
    }

    return NextResponse.json(optimizedData)

  } catch (error) {
    console.error('[AI_OPTIMIZE_ERROR]', error)

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (/credit|quota|limit|billing/i.test(errorMessage)) {
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
