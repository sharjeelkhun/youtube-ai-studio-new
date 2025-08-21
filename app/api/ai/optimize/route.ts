import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

interface AiSettingsRpcResponse {
  provider: string | null
  settings: any | null
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
const handleGemini = async (apiKey: string, title: string, description: string) => {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
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
  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()
  return parseJsonResponse(text)
}

// Helper function for OpenAI
const handleOpenAI = async (apiKey: string, title: string, description: string) => {
  const openai = new OpenAI({ apiKey })
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
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

    const apiKey = (profile.settings as any)?.apiKeys?.[profile.provider]
    if (!apiKey) {
      return NextResponse.json({ error: `API key for ${profile.provider} not found. Please add it in the settings.` }, { status: 400 })
    }

    const body = await req.json()
    const { title, description } = body
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    let optimizedData
    if (profile.provider === 'gemini') {
      optimizedData = await handleGemini(apiKey, title, description)
    } else if (profile.provider === 'openai') {
      optimizedData = await handleOpenAI(apiKey, title, description)
    } else {
      return NextResponse.json({ error: `Provider "${profile.provider}" is not supported.` }, { status: 400 })
    }

    return NextResponse.json(optimizedData)

  } catch (error) {
    console.error('[AI_OPTIMIZE_ERROR]', error)

    if (error instanceof Error) {
      // Broadly check for API key errors for any provider
      if (/API key/i.test(error.message) || /authentication/i.test(error.message)) {
        return NextResponse.json({ error: 'The provided API key is invalid or has been rejected by the provider.' }, { status: 400 })
      }
      // Handle other specific errors by passing their message
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
