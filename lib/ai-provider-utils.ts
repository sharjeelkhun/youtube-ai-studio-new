import { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
// CORRECTED IMPORT AND USAGE BASED ON OFFICIAL DOCUMENTATION
import { Mistral } from "@mistralai/mistralai";

export async function getAIProvider(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: settings, error } = await supabase
    .from("user_settings")
    .select("ai_provider, openai_api_key, google_api_key, anthropic_api_key, mistral_api_key")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user settings:", error);
    throw new Error("Failed to fetch user settings");
  }

  if (!settings) {
    throw new Error("AI provider not configured");
  }

  return settings;
}

export async function getAiClient(supabase: SupabaseClient) {
  const settings = await getAIProvider(supabase);
  const provider = settings.ai_provider;

  let apiKey;
  switch (provider) {
    case "openai":
      apiKey = settings.openai_api_key;
      if (!apiKey) throw new Error("OpenAI API key not configured");
      return new OpenAI({ apiKey });
    case "google":
      apiKey = settings.google_api_key;
      if (!apiKey) throw new Error("Google API key not configured");
      return new GoogleGenerativeAI(apiKey);
    case "anthropic":
      apiKey = settings.anthropic_api_key;
      if (!apiKey) throw new Error("Anthropic API key not configured");
      return new Anthropic({ apiKey });
    case "mistral":
      apiKey = settings.mistral_api_key;
      if (!apiKey) throw new Error("Mistral API key not configured");
      // CORRECTED INSTANTIATION
      return new Mistral({ apiKey });
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export function getModel(provider: string): string {
    switch (provider) {
      case "openai":
        return "gpt-4-turbo";
      case "google":
        return "gemini-1.5-flash";
      case "anthropic":
        return "claude-3-haiku-20240307";
      case "mistral":
        return "mistral-large-latest";
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
}