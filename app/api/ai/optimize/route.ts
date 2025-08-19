import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_provider, ai_settings')
      .eq('id', session.user.id)
      .single()

    if (!profile || !profile.ai_provider || !profile.ai_settings) {
      return NextResponse.json({ error: 'AI provider not configured. Please configure it in the settings.' }, { status: 400 })
    }

    const settings = profile.ai_settings as any
    const apiKey = settings.apiKeys?.[profile.ai_provider]

    if (!apiKey) {
      return NextResponse.json({ error: `API key for ${profile.ai_provider} not found. Please add it in the settings.` }, { status: 400 })
    }

    const body = await req.json()
    const { title, description } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    if (profile.ai_provider !== 'gemini') {
      return NextResponse.json({ error: 'Only Google Gemini is currently supported for this feature.' }, { status: 400 })
    }

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

    try {
      // Clean the response text to ensure it's valid JSON
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const optimizedData = JSON.parse(jsonString)
      return NextResponse.json(optimizedData)
    } catch (parseError) {
      console.error('[AI_OPTIMIZE_ERROR] Failed to parse JSON response from AI:', text)
      return NextResponse.json({ error: 'The AI returned a response in an invalid format. Please try again.' }, { status: 500 })
    }
  } catch (error) {
    console.error('[AI_OPTIMIZE_ERROR]', error)
    // Use a case-insensitive regex to broadly catch API key-related errors.
    if (error instanceof Error && /API key/i.test(error.message)) {
      return NextResponse.json({ error: 'Your Google Gemini API key seems to be invalid. Please check it in the settings.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred while communicating with the AI provider.' }, { status: 500 })
  }
}
