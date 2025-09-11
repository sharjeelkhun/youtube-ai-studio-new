import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleOpenAI, handleGemini, handleAnthropic, handleMistral } from '@/lib/ai-description-handlers'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description } = await req.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Get the user's profile to determine AI provider and settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to get profile settings' }, { status: 500 })
    }

    if (!profile.ai_provider || !profile.ai_settings?.apiKeys?.[profile.ai_provider]) {
      return NextResponse.json({ error: 'AI provider not configured' }, { status: 400 })
    }

    const apiKey = profile.ai_settings.apiKeys[profile.ai_provider]
    let optimizedContent

    try {
      switch (profile.ai_provider) {
        case 'openai':
          optimizedContent = await handleOpenAI(apiKey, title, description, profile.ai_settings)
          break
        case 'anthropic':
          optimizedContent = await handleAnthropic(apiKey, title, description, profile.ai_settings)
          break
        case 'mistral':
          optimizedContent = await handleMistral(apiKey, title, description, profile.ai_settings)
          break
        case 'gemini':
          optimizedContent = await handleGemini(apiKey, title, description, profile.ai_settings)
          break
        default:
          return NextResponse.json({ error: 'Unsupported AI provider' }, { status: 400 })
      }

      return NextResponse.json({ 
        title: optimizedContent.title || title,
        description: optimizedContent.description || description
      })
    } catch (error: any) {
      console.error('[AI_OPTIMIZE_DESCRIPTION_ERROR]', error)
      
      if (error.message?.toLowerCase().includes('billing')) {
        return NextResponse.json({
          error: 'A billing-related error occurred with the AI provider.',
          errorCode: 'billing_error'
        }, { status: 400 })
      }

      return NextResponse.json({ 
        error: error.message || 'Failed to optimize description'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[AI_OPTIMIZE_DESCRIPTION_ERROR]', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}