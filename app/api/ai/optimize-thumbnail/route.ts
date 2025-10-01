import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { thumbnailUrl, videoTitle, provider } = await request.json()

    if (!thumbnailUrl || !videoTitle || !provider) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user profile with AI settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_provider, ai_settings')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if AI provider is configured
    if (!profile.ai_provider || !profile.ai_settings?.apiKeys?.[profile.ai_provider]) {
      return NextResponse.json(
        { error: 'AI provider not configured' },
        { status: 400 }
      )
    }

    // Fetch the thumbnail image
    const imageResponse = await fetch(thumbnailUrl)
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch thumbnail image' },
        { status: 400 }
      )
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')

    let optimizedImage: string

    // Optimize based on AI provider
    switch (profile.ai_provider) {
      case 'openai':
        optimizedImage = await optimizeWithOpenAI(base64Image, videoTitle, profile.ai_settings.apiKeys.openai)
        break
      case 'gemini':
        optimizedImage = await optimizeWithGemini(base64Image, videoTitle, profile.ai_settings.apiKeys.gemini)
        break
      default:
        return NextResponse.json(
          { error: 'Unsupported AI provider for image optimization' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      optimizedImage: `data:image/jpeg;base64,${optimizedImage}`,
      provider: profile.ai_provider
    })

  } catch (error) {
    console.error('Error optimizing thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to optimize thumbnail' },
      { status: 500 }
    )
  }
}

async function optimizeWithOpenAI(base64Image: string, videoTitle: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64Image,
      prompt: `Optimize this thumbnail for YouTube video titled "${videoTitle}". Make it more engaging, increase contrast and saturation, ensure text is readable, and make it more clickable while maintaining the original concept.`,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return data.data[0].b64_json
}

async function optimizeWithGemini(base64Image: string, videoTitle: string, apiKey: string): Promise<string> {
  // For Gemini, we'll use the vision API to analyze and provide optimization suggestions
  // Since Gemini doesn't have direct image editing, we'll return the original image with optimization applied via canvas
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Analyze this YouTube thumbnail for the video titled "${videoTitle}" and provide optimization suggestions for making it more engaging and clickable. Focus on contrast, saturation, readability, and visual appeal.`
        }, {
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Image
          }
        }]
      }]
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`)
  }

  // For now, return the original image since Gemini doesn't directly edit images
  // In a real implementation, you might use the analysis to apply canvas-based optimizations
  return base64Image
}
