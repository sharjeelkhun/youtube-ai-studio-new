import { SupabaseClient } from "@supabase/supabase-js";
import { getAiClient, getAIProvider, getModel, getServerProviderFallback } from "./ai-provider-utils";
import { isContentSuggestionArray, isTrendingTopicArray, isVideoImprovementArray } from "./ai-schema";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { Mistral } from "@mistralai/mistralai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { acquireRateLimit } from "./rate-limiter";
import { trackUsage } from "./track-usage";

async function generate(
  client: OpenAI | GoogleGenerativeAI | Anthropic | Mistral,
  model: string,
  prompt: string,
  provider: string,
  userId: string
) {
  try {
    if (client instanceof OpenAI) {
      // Acquire rate limit token before making API call
      await acquireRateLimit('openai', userId)
      await trackUsage('openai', 'api_calls')
      
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
      });
      
      if (response.usage) {
        await trackUsage('openai', 'content_generation', {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        })
      } else {
        await trackUsage('openai', 'content_generation')
      }
      
      return response.choices[0].message.content;
    } else if (client instanceof GoogleGenerativeAI) {
      // Acquire rate limit token before making API call
      await acquireRateLimit('gemini', userId)
      await trackUsage('gemini', 'api_calls')
      
      const generativeModel = client.getGenerativeModel({ model });
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text()
      
      const estimatedTokens = Math.ceil((prompt.length + text.length) / 4)
      await trackUsage('gemini', 'content_generation', {
        totalTokens: estimatedTokens
      })
      
      return text;
    } else if (client instanceof Anthropic) {
      await trackUsage('anthropic', 'api_calls')
      
      // Acquire rate limit token before making API call
      await acquireRateLimit('anthropic', userId)
      
      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      
      await trackUsage('anthropic', 'content_generation', {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      })
      
      // @ts-ignore
      return response.content[0].text;
    } else if (client instanceof Mistral) {
        // Acquire rate limit token before making API call
        await acquireRateLimit('mistral', userId)
        await trackUsage('mistral', 'api_calls')
        
        const response = await client.chat.complete({
            model,
            messages: [{ role: "user", content: prompt }],
        });
        
        if (response.usage) {
          await trackUsage('mistral', 'content_generation', {
            inputTokens: response.usage.promptTokens || (response.usage as any).prompt_tokens || 0,
            outputTokens: response.usage.completionTokens || (response.usage as any).completion_tokens || 0,
            totalTokens: response.usage.totalTokens || (response.usage as any).total_tokens || 
              (response.usage.promptTokens || (response.usage as any).prompt_tokens || 0) + 
              (response.usage.completionTokens || (response.usage as any).completion_tokens || 0)
          })
        } else {
          const content = response.choices[0].message.content
          const estimatedTokens = typeof content === 'string' ? Math.ceil(content.length / 4) : 0
          await trackUsage('mistral', 'content_generation', {
            totalTokens: estimatedTokens
          })
        }
        
        return response.choices[0].message.content;
    }
    throw new Error("Unsupported AI client");
  } catch (error) {
    console.error(`Error generating text with ${provider}:`, error);
    throw new Error(`Failed to generate text with ${provider}`);
  }
}

export async function generateContentSuggestions(supabase: SupabaseClient, userPrompt?: string) {
  // Get userId for rate limiting
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Unauthorized - No active session')
  const userId = session.user.id
  
  let ai_provider: string
  let client: any
  try {
    const settings = await getAIProvider(supabase)
    ai_provider = settings.ai_provider
    client = await getAiClient(supabase)
  } catch (err) {
    // Try server-level fallback (env vars)
    const fb = getServerProviderFallback()
    if (!fb) throw err
    ai_provider = fb.ai_provider
    // Build a minimal client from env key for supported providers
    if (ai_provider === 'openai') {
      client = new (await import('openai')).default({ apiKey: String(fb.openai_api_key) })
    } else if (ai_provider === 'google') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      client = new GoogleGenerativeAI(String(fb.google_api_key))
    } else if (ai_provider === 'anthropic') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      client = new Anthropic({ apiKey: String(fb.anthropic_api_key) })
    } else if (ai_provider === 'mistral') {
      const { Mistral } = await import('@mistralai/mistralai')
      client = new Mistral({ apiKey: String(fb.mistral_api_key) })
    }
    
  }
  const model = getModel(ai_provider);
  const prompt = `Generate YouTube video ideas based on the following request. Make each idea specific, actionable, and valuable to viewers.

User Request: ${userPrompt || "Generate 5 video ideas about AI tools for content creators"}

IMPORTANT: Return ONLY valid JSON array with this EXACT structure for each idea:
[{
  "title": "Catchy, SEO-friendly title",
  "type": "video_idea",
  "description": "Detailed 2-3 sentence description focusing on the value and key points",
  "metrics": {
    "estimatedViews": "estimated view range based on topic popularity",
    "engagement": "High/Medium/Low based on topic engagement potential"
  },
  "metadata": {
    "tags": ["5-8 relevant hashtags for the video"]
  }
}]

Requirements:
1. Focus on practical, actionable content
2. Include current trends and best practices
3. Target problems your audience is trying to solve
4. Make titles catchy but honest
5. Keep descriptions informative and engaging`;

  const suggestionsRaw = await generate(client, model, prompt, ai_provider, userId);

  // Try to parse and validate as ContentSuggestion[]
  let parsed: any = suggestionsRaw
  if (typeof suggestionsRaw === 'string') {
    try {
      parsed = JSON.parse(suggestionsRaw)
    } catch (e) {
      // attempt to extract JSON array from text
      const start = suggestionsRaw.indexOf('[')
      const end = suggestionsRaw.lastIndexOf(']')
      if (start !== -1 && end !== -1 && end > start) {
        const substr = suggestionsRaw.substring(start, end + 1)
        try {
          parsed = JSON.parse(substr)
        } catch (e2) {
          // leave parsed as original string
        }
      }
    }
  }

  // If parsed is an object with a `suggestions` key, accept that as the array
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray((parsed as any).suggestions)) {
    parsed = (parsed as any).suggestions
  }

  if (isContentSuggestionArray(parsed)) {
    return parsed
  }

  throw new Error('AI returned invalid content suggestions')
}

export async function generateVideoImprovements(
  supabase: SupabaseClient,
  videos: any[]
) {
  // Get userId for rate limiting
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Unauthorized - No active session')
  const userId = session.user.id
  
  let ai_provider: string
  let client: any
  try {
    const settings = await getAIProvider(supabase)
    ai_provider = settings.ai_provider
    client = await getAiClient(supabase)
  } catch (err) {
    const fb = getServerProviderFallback()
    if (!fb) throw err
    ai_provider = fb.ai_provider
    if (ai_provider === 'openai') {
      client = new (await import('openai')).default({ apiKey: String(fb.openai_api_key) })
    } else if (ai_provider === 'google') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      client = new GoogleGenerativeAI(String(fb.google_api_key))
    } else if (ai_provider === 'anthropic') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      client = new Anthropic({ apiKey: String(fb.anthropic_api_key) })
    } else if (ai_provider === 'mistral') {
      const { Mistral } = await import('@mistralai/mistralai')
      client = new Mistral({ apiKey: String(fb.mistral_api_key) })
    }
  }
  const model = getModel(ai_provider);
  const prompt = `Analyze the following YouTube video data and provide specific suggestions for improvement for each video. Focus on titles, descriptions, and tags.

  Videos:
  ${JSON.stringify(videos, null, 2)}

  For each video, suggest a new title, an improved description, and a better set of tags.

IMPORTANT: Return ONLY valid JSON: an array of objects where each object has videoId (string), videoTitle (string), suggestions (array of strings). You may also return { "improvements": [ ... ] }. Example:\n[ { "videoId": "1", "videoTitle": "...", "suggestions": ["...", "..."] } ]`;

  const improvementsRaw = await generate(client, model, prompt, ai_provider, userId);

  // parse/validate
  let parsed: any = improvementsRaw
  if (typeof improvementsRaw === 'string') {
    try {
      parsed = JSON.parse(improvementsRaw)
    } catch (e) {
      const start = improvementsRaw.indexOf('[')
      const end = improvementsRaw.lastIndexOf(']')
      if (start !== -1 && end !== -1 && end > start) {
        const substr = improvementsRaw.substring(start, end + 1)
        try {
          parsed = JSON.parse(substr)
        } catch (e2) {}
      }
    }
  }

  if (isVideoImprovementArray(parsed)) {
    return parsed
  }

  throw new Error('AI returned invalid video improvements')
}

export async function generateTrendingTopics(supabase: SupabaseClient) {
  // Get userId for rate limiting
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Unauthorized - No active session')
  const userId = session.user.id
  
  let ai_provider: string
  let client: any
  try {
    const settings = await getAIProvider(supabase)
    ai_provider = settings.ai_provider
    client = await getAiClient(supabase)
  } catch (err) {
    const fb = getServerProviderFallback()
    if (!fb) throw err
    ai_provider = fb.ai_provider
    if (ai_provider === 'openai') {
      client = new (await import('openai')).default({ apiKey: String(fb.openai_api_key) })
    } else if (ai_provider === 'google') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      client = new GoogleGenerativeAI(String(fb.google_api_key))
    } else if (ai_provider === 'anthropic') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      client = new Anthropic({ apiKey: String(fb.anthropic_api_key) })
    } else if (ai_provider === 'mistral') {
      const { Mistral } = await import('@mistralai/mistralai')
      client = new Mistral({ apiKey: String(fb.mistral_api_key) })
    }
  }
  const model = getModel(ai_provider);
  const prompt =
    "Identify 5 current trending topics on YouTube. For each topic, provide a brief explanation of why it's trending and suggest a video idea related to it.\n\nIMPORTANT: Return ONLY valid JSON: an array of objects with id (string), title (string), growth (string), description (string). You may also return { \"topics\": [ ... ] }. Example:\n[ { \"id\": \"1\", \"title\": \"...\", \"growth\": \"+123%\", \"description\": \"...\" } ]";

  const topicsRaw = await generate(client, model, prompt, ai_provider, userId);

  let parsed: any = topicsRaw
  if (typeof topicsRaw === 'string') {
    try {
      parsed = JSON.parse(topicsRaw)
    } catch (e) {
      const start = topicsRaw.indexOf('[')
      const end = topicsRaw.lastIndexOf(']')
      if (start !== -1 && end !== -1 && end > start) {
        const substr = topicsRaw.substring(start, end + 1)
        try {
          parsed = JSON.parse(substr)
        } catch (e2) {}
      }
    }
  }

  if (isTrendingTopicArray(parsed)) {
    return parsed
  }

  throw new Error('AI returned invalid trending topics')
}

export async function generateText(supabase: SupabaseClient, prompt: string) {
    // Get userId for rate limiting
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Unauthorized - No active session')
    const userId = session.user.id
    
    let ai_provider: string
    let client: any
    try {
      const settings = await getAIProvider(supabase)
      ai_provider = settings.ai_provider
      client = await getAiClient(supabase)
    } catch (err) {
      const fb = getServerProviderFallback()
      if (!fb) throw err
      ai_provider = fb.ai_provider
      if (ai_provider === 'openai') {
        client = new (await import('openai')).default({ apiKey: String(fb.openai_api_key) })
      } else if (ai_provider === 'google') {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        client = new GoogleGenerativeAI(String(fb.google_api_key))
      } else if (ai_provider === 'anthropic') {
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        client = new Anthropic({ apiKey: String(fb.anthropic_api_key) })
      } else if (ai_provider === 'mistral') {
        const { Mistral } = await import('@mistralai/mistralai')
        client = new Mistral({ apiKey: String(fb.mistral_api_key) })
      }
    }
    const model = getModel(ai_provider);

    // Enhance prompt to request structured output
    const enhancedPrompt = `Generate creative and engaging content for the following request. Return the response in a structured JSON format with relevant fields like title, description, and type where appropriate.
    
Request: ${prompt}

IMPORTANT: If generating multiple items (like video ideas or tips), return an array of objects with consistent structure.
Example format for video ideas: [{"title": "...", "description": "...", "type": "video idea"}]
Example format for a single content piece: {"title": "...", "content": "...", "type": "content"}

Your response:`;
    
    const text = await generate(client, model, enhancedPrompt, ai_provider, userId);
    return text;
}