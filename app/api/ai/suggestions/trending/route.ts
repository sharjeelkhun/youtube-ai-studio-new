import { NextResponse } from "next/server";
import { generateTrendingTopics } from "@/lib/ai-suggestions";
import { getTrendingTopics as getMockTrendingTopics } from "@/lib/api";
import { isTrendingTopicArray } from "@/lib/ai-schema";
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
    const topics = await generateTrendingTopics(supabase);
    if (typeof topics === 'string') {
      return NextResponse.json([
        { id: 'ai-1', title: 'AI Response', growth: '', description: topics },
      ])
    }

    if (isTrendingTopicArray(topics)) {
      return NextResponse.json(topics);
    }

    if (topics && typeof topics === 'object' && (Array.isArray((topics as any).topics) || typeof (topics as any).topics === 'string')) {
      const t = (topics as any).topics
      if (typeof t === 'string') {
        return NextResponse.json([{ id: 'ai-1', title: 'AI Response', growth: '', description: t }])
      }
      return NextResponse.json(t)
    }

    console.warn('AI returned invalid trending topics shape, falling back to mock')
    const mock = await getMockTrendingTopics()
    return NextResponse.json(mock)
  } catch (error) {
    console.error("Error generating trending topics:", error);
    try {
      const mock = await getMockTrendingTopics()
      return NextResponse.json(mock)
    } catch (e) {
      console.error('Failed to load mock trending topics:', e)
      return NextResponse.json(
        { error: "Failed to generate trending topics" },
        { status: 500 }
      );
    }
  }
}