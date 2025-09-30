import { NextResponse } from "next/server";
import { generateTrendingTopics } from "@/lib/ai-suggestions";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const dynamic = "force-dynamic";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerComponentClient({ cookies });

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