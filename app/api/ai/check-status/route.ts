import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function checkOpenAI(apiKey: string) {
  const openai = new OpenAI({ apiKey })
  await openai.models.list()
}

async function checkAnthropic(apiKey: string) {
  const anthropic = new Anthropic({ apiKey })
  await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1,
    messages: [{ role: 'user', content: 'hello' }]
  })
}

async function checkMistral(apiKey: string) {
  const mistral = new Mistral({ apiKey })
  await mistral.models.list()
}

async function checkGemini(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  await model.countTokens("hello")
}

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, apiKey } = await req.json()

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API key are required' }, { status: 400 })
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
