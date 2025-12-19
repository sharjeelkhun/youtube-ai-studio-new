import { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { Mistral } from "@mistralai/mistralai";
import { getFallbackModel } from "@/lib/ai-providers";

export async function getAIProvider(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // No logged-in user — fall back to server-level provider if available
    // This allows development/testing with a server API key set in env vars.
    // We'll handle absence of env vars in the caller.
    throw new Error("User not authenticated");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch user profile");
  }

  if (!profile) {
    // Return default settings if profile doesn't exist yet
    return {
      ai_provider: "openai",
      openai_api_key: null,
      google_api_key: null,
      anthropic_api_key: null,
      mistral_api_key: null,
    };
  }

  if (!profile || !profile.ai_provider) {
    throw new Error("AI provider not configured");
  }

  // Extract API keys from ai_settings JSONB
  const apiKeys = profile.ai_settings?.apiKeys || {};

  return {
    ai_provider: profile.ai_provider,
    openai_api_key: apiKeys.openai || null,
    google_api_key: apiKeys.gemini || apiKeys.google || null, // Support both 'gemini' and 'google'
    anthropic_api_key: apiKeys.anthropic || null,
    mistral_api_key: apiKeys.mistral || null,
  };
}

// Server-side helper to get provider information, preferring user settings.
// If user settings are unavailable, callers may catch and use server env keys.
export function getServerProviderFallback() {
  if (process.env.OPENAI_API_KEY) {
    return {
      ai_provider: "openai",
      openai_api_key: process.env.OPENAI_API_KEY,
      google_api_key: null,
      anthropic_api_key: null,
      mistral_api_key: null,
    }
  }
  if (process.env.GOOGLE_API_KEY) {
    return {
      ai_provider: "gemini",
      openai_api_key: null,
      google_api_key: process.env.GOOGLE_API_KEY,
      anthropic_api_key: null,
      mistral_api_key: null,
    }
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      ai_provider: "anthropic",
      openai_api_key: null,
      google_api_key: null,
      anthropic_api_key: process.env.ANTHROPIC_API_KEY,
      mistral_api_key: null,
    }
  }
  if (process.env.MISTRAL_API_KEY) {
    return {
      ai_provider: "mistral",
      openai_api_key: null,
      google_api_key: null,
      anthropic_api_key: null,
      mistral_api_key: process.env.MISTRAL_API_KEY,
    }
  }
  return null
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
    case "gemini":
    case "google": // Support legacy "google" for backward compatibility
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
      return new Mistral({ apiKey });
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export function getModel(provider: string): string {
  switch (provider) {
    case "openai":
      return "gpt-4-turbo";
    case "gemini":
    case "google": // Support legacy "google" for backward compatibility
      const geminiModel = getFallbackModel('gemini');
      if (!geminiModel) {
        throw new Error('No fallback model configured for Gemini');
      }
      return geminiModel;
    case "anthropic":
      return "claude-3-haiku-20240307";
    case "mistral":
      return "mistral-large-latest";
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}