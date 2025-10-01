import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

// Helper function for OpenAI
const handleOpenAI = async (apiKey: string, prompt: string) => {
  const openai = new OpenAI({ apiKey })
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'b64_json',
  })
  if (!response.data || !response.data[0] || !response.data[0].b64_json) {
    throw new Error('OpenAI did not return an image.')
  }
  return response.data[0].b64_json
}

// Helper function for Gemini
const handleGemini = async (apiKey: string, prompt: string) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1 },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const errorMessage = errorBody?.error?.message || 'An unknown error occurred.'
    throw new Error(errorMessage)
  }

  const data = await response.json()
  if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
    return data.predictions[0].bytesBase64Encoded
  }

  throw new Error('Gemini did not return an image.')
}

export async function POST(req: Request) {
  const supabase = createClient()

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
    const { prompt } = body
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    let imageData
    if (profile.provider === 'openai') {
      imageData = await handleOpenAI(apiKey, prompt)
    } else if (profile.provider === 'gemini') {
      imageData = await handleGemini(apiKey, prompt)
    } else {
      return NextResponse.json({ error: `Provider "${profile.provider}" does not support image generation.` }, { status: 400 })
    }

    return NextResponse.json({ imageData })

  } catch (error) {
    console.error('[AI_GENERATE_THUMBNAIL_ERROR]', error)

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
