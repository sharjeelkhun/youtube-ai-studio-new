import { SupabaseClient } from "@supabase/supabase-js";
import { getAiClient, getAIProvider, getModel } from "./ai-provider-utils";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { Mistral } from "@mistralai/mistralai";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function generate(
  client: OpenAI | GoogleGenerativeAI | Anthropic | Mistral,
  model: string,
  prompt: string,
  provider: string
) {
  try {
    if (client instanceof OpenAI) {
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
      });
      return response.choices[0].message.content;
    } else if (client instanceof GoogleGenerativeAI) {
      const generativeModel = client.getGenerativeModel({ model });
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } else if (client instanceof Anthropic) {
      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      // @ts-ignore
      return response.content[0].text;
    } else if (client instanceof Mistral) {
        const response = await client.chat.complete({
            model,
            messages: [{ role: "user", content: prompt }],
        });
        return response.choices[0].message.content;
    }
    throw new Error("Unsupported AI client");
  } catch (error) {
    console.error(`Error generating text with ${provider}:`, error);
    throw new Error(`Failed to generate text with ${provider}`);
  }
}

export async function generateContentSuggestions(supabase: SupabaseClient) {
  const { ai_provider } = await getAIProvider(supabase);
  const client = await getAiClient(supabase);
  const model = getModel(ai_provider);
  const prompt =
    "Generate 5 ideas for YouTube videos on the topic of AI. For each idea, provide a catchy title, a brief description, and 3 relevant tags.";

  const suggestions = await generate(client, model, prompt, ai_provider);
  return { suggestions };
}

export async function generateVideoImprovements(
  supabase: SupabaseClient,
  videos: any[]
) {
  const { ai_provider } = await getAIProvider(supabase);
  const client = await getAiClient(supabase);
  const model = getModel(ai_provider);
  const prompt = `Analyze the following YouTube video data and provide specific suggestions for improvement for each video. Focus on titles, descriptions, and tags.

  Videos:
  ${JSON.stringify(videos, null, 2)}

  For each video, suggest a new title, an improved description, and a better set of tags.`;

  const improvements = await generate(client, model, prompt, ai_provider);
  return { improvements };
}

export async function generateTrendingTopics(supabase: SupabaseClient) {
  const { ai_provider } = await getAIProvider(supabase);
  const client = await getAiClient(supabase);
  const model = getModel(ai_provider);
  const prompt =
    "Identify 5 current trending topics on YouTube. For each topic, provide a brief explanation of why it's trending and suggest a video idea related to it.";

  const topics = await generate(client, model, prompt, ai_provider);
  return { topics };
}

export async function generateText(supabase: SupabaseClient, prompt: string) {
    const { ai_provider } = await getAIProvider(supabase);
    const client = await getAiClient(supabase);
    const model = getModel(ai_provider);

    const text = await generate(client, model, prompt, ai_provider);
    return text;
}