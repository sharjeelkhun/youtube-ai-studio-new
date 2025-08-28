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
const handleGemini = async (apiKey: string, title: string, description: string, settings: AiSettings) => {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: settings.defaultModel })
  const prompt = getPrompt(title, description)
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
        content: `You are an expert YouTube content strategist. Your response must be a valid JSON object with the following structure: { "thumbnail_ideas": ["string", ...] }`
      },
      {
        role: 'user',
        content: `Based on the following title and description, generate 3-5 creative and engaging thumbnail ideas.\nOriginal Title: "${title}"\nOriginal Description: "${description}"`
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
        content: getPrompt(title, description)
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
        content: `You are an expert YouTube content strategist. Your response must be a valid JSON object with the following structure: { "thumbnail_ideas": ["string", ...] }`
      },
      {
        role: 'user',
        content: `Based on the following title and description, generate 3-5 creative and engaging thumbnail ideas.\nOriginal Title: "${title}"\nOriginal Description: "${description}"`
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

    let thumbnailIdeas
    if (profile.provider === 'gemini') {
      thumbnailIdeas = await handleGemini(apiKey, title, description, aiSettings)
    } else if (profile.provider === 'openai') {
      thumbnailIdeas = await handleOpenAI(apiKey, title, description, aiSettings)
    } else if (profile.provider === 'anthropic') {
      thumbnailIdeas = await handleAnthropic(apiKey, title, description, aiSettings)
    } else if (profile.provider === 'mistral') {
      thumbnailIdeas = await handleMistral(apiKey, title, description, aiSettings)
    } else {
      return NextResponse.json({ error: `Provider "${profile.provider}" is not supported.` }, { status: 400 })
    }

    return NextResponse.json(thumbnailIdeas)

  } catch (error) {
    console.error('[AI_GENERATE_THUMBNAIL_IDEAS_ERROR]', error)

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
