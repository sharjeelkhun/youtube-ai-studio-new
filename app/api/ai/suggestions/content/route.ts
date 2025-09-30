import { NextResponse } from "next/server";
import { generateContentSuggestions } from "@/lib/ai-suggestions";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerComponentClient({ cookies });

  try {
    const suggestions = await generateContentSuggestions(supabase);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error generating content suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate content suggestions" },
      { status: 500 }
    );
  }
}