import { NextResponse } from "next/server";
import { generateContentSuggestions } from "@/lib/ai-suggestions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient();

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