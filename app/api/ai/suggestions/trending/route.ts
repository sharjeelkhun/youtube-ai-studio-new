import { NextResponse } from "next/server";
import { generateTrendingTopics } from "@/lib/ai-suggestions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();

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