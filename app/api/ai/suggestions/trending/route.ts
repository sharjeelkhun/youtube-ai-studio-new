import { NextResponse } from "next/server";
import { generateTrendingTopics } from "@/lib/ai-suggestions";
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
    return NextResponse.json(topics);
  } catch (error) {
    console.error("Error generating trending topics:", error);
    return NextResponse.json(
      { error: "Failed to generate trending topics" },
      { status: 500 }
    );
  }
}