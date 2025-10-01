import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { optimizeTitlePrompt } from "@/lib/prompts";

type SupportedProviders = 'mistral';

const allowedModels: Record<SupportedProviders, string> = {
  mistral: "mistral-medium"
};

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { title, description, provider } = await request.json() as {
      title: string;
      description: string;
      provider: SupportedProviders;
    };

    if (!title || !description || !provider) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let optimizedTitle;

    // Get the profile with AI settings
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!profile || !profile.ai_settings?.apiKeys) {
      return NextResponse.json(
        { error: "AI provider not configured" },
        { status: 400 }
      );
    }

    const apiKey = profile.ai_settings.apiKeys[provider];
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not found for selected provider" },
        { status: 400 }
      );
    }

    try {
      const { Mistral } = await import("@mistralai/mistralai");
      const client = new Mistral({ apiKey });

      const response = await client.chat.complete({
        model: allowedModels[provider] || "mistral-medium",
        messages: [
          {
            role: "system",
            content: "You are a YouTube title optimization expert. Your task is to create engaging, click-worthy titles while maintaining accuracy and clarity. Return only the optimized title with no additional formatting."
          },
          {
            role: "user",
            content: optimizeTitlePrompt(title, description)
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      optimizedTitle = typeof content === 'string' ? content.trim() : '';

      if (!optimizedTitle) {
        throw new Error("Failed to generate optimized title");
      }

      // Clean up the response
      optimizedTitle = optimizedTitle
        .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes
        .replace(/\\n/g, '') // Remove newlines
        .replace(/\*+/g, '') // Remove asterisks
        .replace(/#+/g, '') // Remove hashtags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      return NextResponse.json({ optimizedTitle });
    } catch (error) {
      console.error("Error with AI provider:", error);
      return NextResponse.json(
        { error: "Failed to optimize title with AI provider" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in optimize title route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
