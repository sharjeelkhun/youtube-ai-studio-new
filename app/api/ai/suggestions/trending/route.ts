import { NextResponse } from "next/server";
import { generateTrendingTopics } from "@/lib/ai-suggestions";

export async function GET() {
  try {
    const topics = await generateTrendingTopics();
    return NextResponse.json(topics);
  } catch (error) {
    console.error("Error generating trending topics:", error);
    return NextResponse.json(
      { error: "Failed to generate trending topics" },
      { status: 500 }
    );
  }
}
