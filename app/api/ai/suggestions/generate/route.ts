import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai-suggestions";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const text = await generateText(supabase, prompt);
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error generating text:", error);
    return NextResponse.json(
      { error: "Failed to generate text" },
      { status: 500 }
    );
  }
}