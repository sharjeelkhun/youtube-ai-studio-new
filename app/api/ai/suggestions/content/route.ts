import { NextResponse } from "next/server";
import { generateContentSuggestions } from "@/lib/ai-suggestions";

export async function GET() {
  try {
    const suggestions = await generateContentSuggestions();
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error generating content suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate content suggestions" },
      { status: 500 }
    );
  }
}
