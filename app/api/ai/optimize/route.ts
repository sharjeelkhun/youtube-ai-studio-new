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
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_provider, ai_settings')
      .eq('id', session.user.id)
      .single()

    if (!profile || !profile.ai_provider || !profile.ai_settings) {
      return new NextResponse('AI provider not configured', { status: 400 })
    }

    const settings = profile.ai_settings as any
    const apiKey = settings.apiKeys?.[profile.ai_provider]

    if (!apiKey) {
      return new NextResponse('API key not found for the selected provider', { status: 400 })
    }

    const body = await req.json()
    const { title, description } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    if (profile.ai_provider !== 'gemini') {
      return new NextResponse('Only Google Gemini is currently supported for this feature.', { status: 400 })
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

    // Clean the response text to ensure it's valid JSON
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()

    const optimizedData = JSON.parse(jsonString)

    return NextResponse.json(optimizedData)
  } catch (error) {
    console.error('[AI_OPTIMIZE_ERROR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
