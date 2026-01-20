import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { handleOpenAI, handleGemini, handleAnthropic, handleMistral } from "@/lib/ai-title-handlers";
import { RateLimitTimeoutError } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    let provider = profile.ai_provider;
    let apiKey = provider ? profile.ai_settings?.apiKeys?.[provider] : null;

    // Free Plan Logic
    if (!provider || !apiKey) {
      const freeUsage = profile.ai_settings?.freeUsageCount || 0;
      if (freeUsage < 3) {
        console.log(`[FREE-PLAN] User ${session.user.id} using free generation (${freeUsage + 1}/3)`);

        // Use System Key (Fallback)
        // Ensure you have SYSTEM_GEMINI_API_KEY in your .env
        apiKey = process.env.SYSTEM_GEMINI_API_KEY || null;
        provider = 'gemini';

        if (!apiKey) {
          return NextResponse.json(
            { error: "Free tier system key not configured. Please contact support." },
            { status: 500 }
          );
        }

        // Increment usage count
        const newSettings = {
          ...profile.ai_settings,
          freeUsageCount: freeUsage + 1
        };

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ settings: newSettings }) // Assuming 'settings' column exists and maps to 'ai_settings'
          .eq('id', session.user.id);

        if (updateError) {
          console.error("[FREE-PLAN] Failed to update usage count:", updateError);
        }
      } else {
        return NextResponse.json(
          { error: "AI provider not configured and free generations exhausted." },
          { status: 400 }
        );
      }
    }

    // Extract userId for rate limiting
    const userId = session.user.id;
    let optimizedTitle;

    try {
      switch (provider) {
        case 'openai':
          optimizedTitle = await handleOpenAI(apiKey, title, description, profile.ai_settings, userId);
          break;
        case 'anthropic':
          optimizedTitle = await handleAnthropic(apiKey, title, description, profile.ai_settings, userId);
          break;
        case 'mistral':
          optimizedTitle = await handleMistral(apiKey, title, description, profile.ai_settings, userId);
          break;
        case 'gemini':
          optimizedTitle = await handleGemini(apiKey, title, description, profile.ai_settings, userId);
          break;
        default:
          return NextResponse.json({ error: 'Unsupported AI provider' }, { status: 400 });
      }

      return NextResponse.json({ optimizedTitle });
    } catch (error: any) {
      console.error("Error with AI provider:", error);

      // Handle rate limit timeout errors from centralized limiter
      if (error instanceof RateLimitTimeoutError) {
        return NextResponse.json({
          error: error.message,
          errorCode: 'rate_limit_timeout'
        }, { status: 429 });
      }

      const errorMessage = error?.message || String(error);

      // Handle rate limit errors (429)
      if (/429|rate.?limit|too many requests|quota exceeded/i.test(errorMessage)) {
        return NextResponse.json({
          error: `Your ${provider} provider is currently rate limited. Please wait a moment and try again.`,
          errorCode: 'rate_limit_error'
        }, { status: 429 });
      }

      // Handle billing/credit errors
      if (/credit|insufficient|balance|billing|plan/i.test(errorMessage)) {
        return NextResponse.json({
          error: `Your ${provider} account has a billing issue. Please check your credits or plan on the provider's website.`,
          errorCode: 'billing_error'
        }, { status: 400 });
      }

      return NextResponse.json(
        { error: error?.message || "Failed to optimize title with AI provider" },
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
