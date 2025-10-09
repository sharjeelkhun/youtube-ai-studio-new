import { NextResponse } from "next/server"
import { generateContentSuggestions } from "@/lib/ai-suggestions"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    }
  )

  try {
    const body = await req.json()
    const prompt = body?.prompt

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    // Get suggestions from AI
    const suggestions = await generateContentSuggestions(supabase, prompt)
    
    // Validate that we got an array of suggestions
    if (!Array.isArray(suggestions)) {
      throw new Error("Invalid response format from AI")
    }

    return NextResponse.json({ 
      content: JSON.stringify(suggestions), 
      structured: suggestions 
    })
    
  } catch (error) {
    console.error("Error generating suggestions:", error)
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes("AI provider not configured")) {
        return NextResponse.json(
          { 
            error: "AI provider not configured. Please configure your AI provider in Settings > AI Providers.",
            code: "ai_provider_not_configured"
          },
          { status: 400 }
        )
      } else if (error.message.includes("User not authenticated")) {
        return NextResponse.json(
          { 
            error: "Authentication required. Please log in and try again.",
            code: "authentication_required"
          },
          { status: 401 }
        )
      } else if (error.message.includes("API key not configured")) {
        return NextResponse.json(
          { 
            error: "API key not configured for the selected provider. Please check your settings.",
            code: "api_key_not_configured"
          },
          { status: 400 }
        )
      } else if (error.message.includes("billing")) {
        return NextResponse.json(
          { 
            error: "Billing issue with AI provider. Please check your account.",
            code: "billing_error"
          },
          { status: 402 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to generate AI suggestions. Please try again or check your AI provider settings.",
        code: "generation_failed"
      },
      { status: 500 }
    )
  }
}
