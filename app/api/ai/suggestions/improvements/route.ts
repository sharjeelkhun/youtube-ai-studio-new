import { NextResponse } from "next/server";
import { generateVideoImprovements } from "@/lib/ai-suggestions";
import { getVideos } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();

  try {
    const videos = await getVideos();
    const improvements = await generateVideoImprovements(supabase, videos);
    return NextResponse.json(improvements);
  } catch (error) {
    console.error("Error generating video improvements:", error);
    return NextResponse.json(
      { error: "Failed to generate video improvements" },
      { status: 500 }
    );
  }
}