import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { aiProviders } from '@/lib/ai-providers'

interface AiSettings {
  defaultModel: string
  temperature: 'precise' | 'balanced' | 'creative'
}

const temperatureMap = {
  precise: 0.2,
  balanced: 0.7,
  creative: 1.0,
}

// Helper function to parse and clean tags
const parseTags = (response: string): string[] => {
  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(response)
    if (Array.isArray(parsed)) {
      return parsed.map(tag => tag.trim()).filter(tag => tag.length > 0)
    }
  } catch {}

  // Try extracting array-like content
  const match = response.match(/\[(.*)\]/)
  if (match) {
    return match[1]
      .split(',')
      .map(tag => tag.trim().replace(/^["']|["']$/g, ''))
      .filter(tag => tag.length > 0)
  }

  // Fallback: split by commas or newlines
  return response
    .split(/[,\n]/)
    .map(tag => tag.trim().replace(/^["']|["']$/g, ''))
    .filter(tag => tag.length > 0)
}

const handleGemini = async (apiKey: string, title: string, description: string, settings: AiSettings) => {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: settings.defaultModel })
  const prompt = `You are a YouTube SEO expert. Generate optimized tags for this video to maximize discoverability.
  Video Title: "${title}"
  Video Description: "${description}"
  
  Generate a list of 10-15 highly relevant tags that:
  1. Include main keywords and variations
  2. Use relevant long-tail keywords
  3. Include common search terms
  4. Stay relevant to the content
  5. Total character count under 500
  
  Return only a JSON array of tags, like this format: ["tag1", "tag2", "tag3"]`
  
  const result = await model.generateContent(prompt)
  const response = await result.response
  const tags = parseTags(response.text())
  return { tags }
}

const handleOpenAI = async (apiKey: string, title: string, description: string, settings: AiSettings) => {
  const openai = new OpenAI({ apiKey })
  const completion = await openai.chat.completions.create({
    model: settings.defaultModel,
    temperature: temperatureMap[settings.temperature],
    messages: [
      {
        role: 'system',
        content: 'You are a YouTube SEO expert. Return only a JSON array of tags, no explanation or other text.'
      },
      {
        role: 'user',
        content: `Generate optimized tags for this video to maximize discoverability.
        Video Title: "${title}"
        Video Description: "${description}"
        
        Generate a list of 10-15 highly relevant tags that:
        1. Include main keywords and variations
        2. Use relevant long-tail keywords
        3. Include common search terms
        4. Stay relevant to the content
        5. Total character count under 500`
      }
    ],
    response_format: { type: 'json_object' }
  })

  const text = completion.choices[0].message.content
  if (!text) {
    throw new Error('OpenAI returned an empty response.')
  }
  try {
    const parsed = JSON.parse(text)
    return { tags: parsed.tags || [] }
  } catch {
    return { tags: parseTags(text) }
  }
}

const handleAnthropic = async (apiKey: string, title: string, description: string, settings: AiSettings) => {
  const anthropic = new Anthropic({ apiKey })
  const msg = await anthropic.messages.create({
    model: settings.defaultModel,
    temperature: temperatureMap[settings.temperature],
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `You are a YouTube SEO expert. Generate optimized tags for this video to maximize discoverability.
        Video Title: "${title}"
        Video Description: "${description}"
        
        Generate a list of 10-15 highly relevant tags that:
        1. Include main keywords and variations
        2. Use relevant long-tail keywords
        3. Include common search terms
        4. Stay relevant to the content
        5. Total character count under 500
        
        Return only a JSON array of tags, like this format: ["tag1", "tag2", "tag3"]`
      }
    ]
  })

  if (!msg.content || !msg.content[0] || !('text' in msg.content[0])) {
    throw new Error('Anthropic returned an empty response.')
  }

  return { tags: parseTags(msg.content[0].text) }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handleMistral = async (apiKey: string, title: string, description: string, settings: AiSettings) => {
  const mistral = new Mistral({ apiKey })
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await mistral.chat.complete({
        model: settings.defaultModel,
        temperature: temperatureMap[settings.temperature],
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube SEO expert. Return only a JSON array of tags, no explanation or other text.'
          },
          {
            role: 'user',
            content: `Generate optimized tags for this video to maximize discoverability.
            Video Title: "${title}"
            Video Description: "${description}"
            
            Generate a list of 10-15 highly relevant tags that:
            1. Include main keywords and variations
            2. Use relevant long-tail keywords
            3. Include common search terms
            4. Stay relevant to the content
            5. Total character count under 500`
          }
        ]
      })

      const text = response.choices[0].message.content
      if (typeof text !== 'string') {
        throw new Error('Mistral AI returned a response in an unexpected format.')
      }
      
      return { tags: parseTags(text) }
    } catch (error: any) {
      lastError = error;
      if (error.type === 'service_tier_capacity_exceeded' || 
          error.code === '3505' || 
          error.response?.status === 429 || 
          /rate.*limit|quota|capacity/i.test(error.message)) {
        // If this is the last attempt, throw the error
        if (attempt === maxRetries - 1) throw error;
        
        // Wait for 5 seconds before retrying
        await delay(5000 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

export async function POST(req: Request) {
  const supabase = createClient()

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
    }

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

  } catch (error: any) {
    console.error('[AI_OPTIMIZE_TAGS_ERROR]', error)

    // Handle Mistral-specific errors
    if (error.type === 'service_tier_capacity_exceeded' || error.code === '3505') {
      return NextResponse.json({
        error: 'Service capacity limit reached. Please try again in a few minutes.',
        errorCode: 'rate_limit'
      }, { status: 429 })
    }

    if (error.response?.status === 429 || /rate.*limit|quota|capacity/i.test(error.message)) {
      return NextResponse.json({
        error: 'Rate limit reached. Please try again in a few minutes.',
        errorCode: 'rate_limit'
      }, { status: 429 })
    }

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

      // Handle JSON parsing errors more gracefully
      if (/JSON/.test(errorMessage)) {
        return NextResponse.json({ 
          error: 'Failed to parse AI response. Please try again.' 
        }, { status: 500 })
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
