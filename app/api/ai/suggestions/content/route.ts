import { NextResponse } from "next/server";
import { generateContentSuggestions } from "@/lib/ai-suggestions";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
      },
    }
  );

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