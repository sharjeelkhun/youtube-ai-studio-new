import { NextResponse } from "next/server";
import { generateVideoImprovements } from "@/lib/ai-suggestions";
import { getVideos, getVideoImprovements as getMockVideoImprovements } from "@/lib/api";
import { isVideoImprovementArray } from "@/lib/ai-schema";
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
    const videos = await getVideos();
    const improvements = await generateVideoImprovements(supabase, videos);

    if (typeof improvements === 'string') {
      return NextResponse.json([
        { videoId: 'ai-1', videoTitle: 'AI Response', suggestions: [improvements] },
      ])
    }

    if (isVideoImprovementArray(improvements)) {
      return NextResponse.json(improvements);
    }

    if (improvements && typeof improvements === 'object' && (Array.isArray((improvements as any).improvements) || typeof (improvements as any).improvements === 'string')) {
      const m = (improvements as any).improvements
      if (typeof m === 'string') {
        return NextResponse.json([{ videoId: 'ai-1', videoTitle: 'AI Response', suggestions: [m] }])
      }
      return NextResponse.json(m)
    }

    console.warn('AI returned invalid video improvements shape, falling back to mock')
    const mock = await getMockVideoImprovements()
    return NextResponse.json(mock)
  } catch (error) {
    console.error("Error generating video improvements:", error);
    try {
      const mock = await getMockVideoImprovements()
      return NextResponse.json(mock)
    } catch (e) {
      console.error('Failed to load mock video improvements:', e)
      return NextResponse.json(
        { error: "Failed to generate video improvements" },
        { status: 500 }
      );
    }
  }
}