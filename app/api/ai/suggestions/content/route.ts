import { NextResponse } from "next/server";
import { generateContentSuggestions } from "@/lib/ai-suggestions";
import { getContentSuggestions as getMockContentSuggestions } from "@/lib/api";
import { isContentSuggestionArray } from "@/lib/ai-schema";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Intentionally omitting 'export const dynamic' for diagnostic purposes.

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    const suggestions = await generateContentSuggestions(supabase);
    // If AI returned a string or object, convert to a single-item array so the UI can render it
    if (typeof suggestions === 'string') {
      return NextResponse.json([
        {
          id: 'ai-1',
          title: 'AI Response',
          type: 'AI',
          description: suggestions,
          metrics: { views: '', engagement: '' },
        },
      ])
    }

    if (isContentSuggestionArray(suggestions)) {
      return NextResponse.json(suggestions);
    }

    // If it's an object with .suggestions as string or array, normalize
    if (suggestions && typeof suggestions === 'object' && (Array.isArray((suggestions as any).suggestions) || typeof (suggestions as any).suggestions === 'string')) {
      const s = (suggestions as any).suggestions
      if (typeof s === 'string') {
        return NextResponse.json([
          {
            id: 'ai-1',
            title: 'AI Response',
            type: 'AI',
            description: s,
            metrics: { views: '', engagement: '' },
          },
        ])
      }
      return NextResponse.json(s)
    }

    console.warn('AI returned invalid content suggestions shape, falling back to mock')
    const mock = await getMockContentSuggestions()
    return NextResponse.json(mock)
  } catch (error) {
    console.error("Error generating content suggestions:", error);
    // Fallback to mock suggestions so UI remains usable when AI is not configured
    try {
      const mock = await getMockContentSuggestions()
      return NextResponse.json(mock)
    } catch (e) {
      console.error('Failed to load mock content suggestions:', e)
      return NextResponse.json(
        { error: "Failed to generate content suggestions" },
        { status: 500 }
      );
    }
  }
}