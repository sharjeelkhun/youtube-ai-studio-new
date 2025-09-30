import { NextResponse } from "next/server";
import { generateVideoImprovements } from "@/lib/ai-suggestions";
import { getVideos } from "@/lib/api";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic'

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerComponentClient({ cookies });

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