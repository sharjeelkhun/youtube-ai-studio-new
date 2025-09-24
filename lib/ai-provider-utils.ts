import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { SupabaseClient } from "@supabase/supabase-js";
const MistralClient = require("@mistralai/mistralai");
import { aiProviders } from "./ai-providers";

async function getProfile(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('get_ai_settings');
  if (error) {
    throw new Error(`Failed to fetch AI settings: ${error.message}`);
  }
  return data && data.length > 0 ? { ai_provider: data[0].provider, ai_settings: data[0].settings } : null;
}

export async function getAiClient(supabase: SupabaseClient) {
  const profile = await getProfile(supabase);

  if (!profile || !profile.ai_provider || !profile.ai_settings) {
    throw new Error("AI settings not configured");
  }

  const { ai_provider, ai_settings } = profile;
  const apiKey = ai_settings.apiKeys[ai_provider];

  if (!apiKey) {
    throw new Error(`API key for ${ai_provider} not found`);
  }

  switch (ai_provider) {
    case "openai":
      return new OpenAI({ apiKey });
    case "gemini":
      return new GoogleGenerativeAI(apiKey);
    case "anthropic":
      return new Anthropic({ apiKey });
    case "mistral":
      return new MistralClient({ apiKey });
    default:
      throw new Error(`Unsupported AI provider: ${ai_provider}`);
  }
}

export async function getModel(supabase: SupabaseClient) {
    const profile = await getProfile(supabase);

    if (!profile || !profile.ai_settings) {
        throw new Error("AI settings not configured");
    }

    return profile.ai_settings.features.defaultModel || 'default-model';
}

export const getAIProvider = (providerId: string) => {
    return aiProviders.find(provider => provider.id === providerId)
}
