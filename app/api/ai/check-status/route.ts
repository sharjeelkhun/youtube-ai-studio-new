import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function checkOpenAI(apiKey: string) {
  try {
    const openai = new OpenAI({ apiKey })
    await openai.models.list()
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid OpenAI API key')
    }
    if (error.response?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded')
    }
    throw error
  }
}

async function checkAnthropic(apiKey: string) {
  try {
    const anthropic = new Anthropic({ apiKey })
    await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hello' }]
    })
  } catch (error: any) {
    if (error.status === 401) {
      throw new Error('Invalid Anthropic API key')
    }
    if (error.status === 429) {
      throw new Error('Anthropic API rate limit exceeded')
    }
    throw error
  }
}

async function checkMistral(apiKey: string) {
  try {
    const mistral = new Mistral({ apiKey })
    await mistral.models.list()
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Mistral API key')
    }
    if (error.response?.status === 429) {
      throw new Error('Mistral API rate limit exceeded')
    }
    throw error
  }
}

async function checkGemini(apiKey: string) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    // Use a simpler test that's less likely to fail
    const result = await model.generateContent('test')
    if (!result) {
      throw new Error('Failed to connect to Gemini API')
    }
  } catch (error: any) {
    if (error.status === 401 || error.message?.includes('API key')) {
      throw new Error('Invalid Google API key')
    }
    if (error.status === 429) {
      throw new Error('Google API rate limit exceeded')
    }
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const { provider, apiKey } = await req.json()

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API key are required' }, { status: 400 })
    }

    // Validate the API key format based on provider
    switch (provider) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          return NextResponse.json({ error: 'Invalid OpenAI API key format' }, { status: 400 })
        }
        break
      case 'anthropic':
        if (!apiKey.startsWith('sk-ant-')) {
          return NextResponse.json({ error: 'Invalid Anthropic API key format' }, { status: 400 })
        }
        break
      case 'gemini':
        if (!apiKey.startsWith('AIza')) {
          return NextResponse.json({ error: 'Invalid Google API key format' }, { status: 400 })
        }
        break
      case 'mistral':
        // Mistral keys are more flexible, just check length
        if (apiKey.length < 32) {
          return NextResponse.json({ error: 'Invalid Mistral API key format' }, { status: 400 })
        }
        break
      default:
        return NextResponse.json({ error: 'Unsupported AI provider' }, { status: 400 })
    }

    switch (provider) {
      case 'openai':
        await checkOpenAI(apiKey)
        break
      case 'anthropic':
        await checkAnthropic(apiKey)
        break
      case 'mistral':
        await checkMistral(apiKey)
        break
      case 'gemini':
        await checkGemini(apiKey)
        break
      default:
        return NextResponse.json({ error: `Provider "${provider}" is not supported.` }, { status: 400 })
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[AI_CHECK_STATUS_ERROR]', error)

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (/credit|quota|limit|billing/i.test(errorMessage)) {
        return NextResponse.json({
          error: 'A billing-related error occurred with the AI provider.',
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
