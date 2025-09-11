import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface AISettings {
  model?: string
  temperature?: number
  maxTokens?: number
  apiKeys: {
    [key: string]: string
  }
}

interface OptimizedContent {
  title?: string
  description?: string
}

const OPTIMIZE_PROMPT = `You are an expert YouTube content optimizer. You will receive a title and description, and your task is to provide an optimized version of the description that:
1. Is more engaging and uses natural, conversational language
2. Includes relevant keywords naturally for SEO
3. Follows YouTube best practices for descriptions
4. Maintains authenticity and avoids clickbait
5. Keeps any existing sections and hashtags

Current Title: "{title}"
Current Description: "{description}"

Important: Return ONLY the optimized description text. Do not include any explanations, notes, or formatting instructions. Do not prefix with labels like "Optimized Description:" or similar. Just return the raw optimized description text that would go directly into YouTube.`

export async function handleOpenAI(
  apiKey: string,
  title: string,
  description: string,
  settings: AISettings
): Promise<OptimizedContent> {
  const openai = new OpenAI({ apiKey })
  const prompt = OPTIMIZE_PROMPT
    .replace('{title}', title)
    .replace('{description}', description)

  const response = await openai.chat.completions.create({
    model: settings.model || 'gpt-4',
    temperature: settings.temperature || 0.7,
    max_tokens: settings.maxTokens || 1000,
    messages: [{ role: 'user', content: prompt }]
  })

  const optimizedDescription = response.choices[0]?.message?.content

  // Remove any potential formatting or explanation markers
  const cleanedDescription = optimizedDescription
    ?.replace(/^(Here's your |Optimized |Updated )(YouTube )?[Dd]escription:?(\s*—|-+|\*+)?/g, '')
    ?.replace(/^(\*\*|### |\[|\()?(Key )?Improvements:?(\*\*|\]|\))?[\s\S]*$/, '')
    ?.replace(/^---+\s*/, '')
    ?.trim() || description

  return {
    description: cleanedDescription
  }
}

export async function handleAnthropic(
  apiKey: string,
  title: string,
  description: string,
  settings: AISettings
): Promise<OptimizedContent> {
  const anthropic = new Anthropic({ apiKey })
  const prompt = OPTIMIZE_PROMPT
    .replace('{title}', title)
    .replace('{description}', description)

  const response = await anthropic.messages.create({
    model: settings.model || 'claude-3-opus-20240229',
    max_tokens: settings.maxTokens || 1000,
    temperature: settings.temperature || 0.7,
    messages: [{ role: 'user', content: prompt }]
  })

  const optimizedDescription = response.content[0]?.type === 'text' ? response.content[0].text : description

  // Remove any potential formatting or explanation markers
  const cleanedDescription = optimizedDescription
    ?.replace(/^(Here's your |Optimized |Updated )(YouTube )?[Dd]escription:?(\s*—|-+|\*+)?/g, '')
    ?.replace(/^(\*\*|### |\[|\()?(Key )?Improvements:?(\*\*|\]|\))?[\s\S]*$/, '')
    ?.replace(/^---+\s*/, '')
    ?.trim() || description

  return {
    description: cleanedDescription
  }
}

export async function handleMistral(
  apiKey: string,
  title: string,
  description: string,
  settings: AISettings
): Promise<OptimizedContent> {
  const mistral = new Mistral({ apiKey })
  const prompt = OPTIMIZE_PROMPT
    .replace('{title}', title)
    .replace('{description}', description)

  const response = await mistral.chat.complete({
    model: settings.model || 'mistral-large-latest',
    messages: [{ role: 'user', content: prompt }]
  })

  const optimizedDescription = typeof response.choices[0]?.message?.content === 'string'
    ? response.choices[0].message.content
    : description

  // Remove any potential formatting or explanation markers
  const cleanedDescription = optimizedDescription
    ?.replace(/^(Here's your |Optimized |Updated )(YouTube )?[Dd]escription:?(\s*—|-+|\*+)?/g, '')
    ?.replace(/^(\*\*|### |\[|\()?(Key )?Improvements:?(\*\*|\]|\))?[\s\S]*$/, '')
    ?.replace(/^---+\s*/, '')
    ?.trim() || description

  return {
    description: cleanedDescription
  }
}

export async function handleGemini(
  apiKey: string,
  title: string,
  description: string,
  settings: AISettings
): Promise<OptimizedContent> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: settings.model || 'gemini-pro' })
  const prompt = OPTIMIZE_PROMPT
    .replace('{title}', title)
    .replace('{description}', description)

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  const optimizedDescription = text || description

  // Remove any potential formatting or explanation markers
  const cleanedDescription = optimizedDescription
    ?.replace(/^(Here's your |Optimized |Updated )(YouTube )?[Dd]escription:?(\s*—|-+|\*+)?/g, '')
    ?.replace(/^(\*\*|### |\[|\()?(Key )?Improvements:?(\*\*|\]|\))?[\s\S]*$/, '')
    ?.replace(/^---+\s*/, '')
    ?.trim() || description

  return {
    description: cleanedDescription
  }
}