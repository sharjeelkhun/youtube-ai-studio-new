import { ContentSuggestion, TrendingTopic, VideoImprovement } from "./types";
import { getAiClient, getModel } from "./ai-provider-utils";
import { SupabaseClient } from "@supabase/supabase-js";

async function generate(
  supabase: SupabaseClient,
  prompt: string,
  json: boolean = false
) {
  const aiClient = await getAiClient(supabase);
  const model = await getModel(supabase);

  let response;

  // @ts-ignore
  if (
    aiClient.constructor.name === "OpenAI" ||
    aiClient.constructor.name === "MistralClient"
  ) {
    // @ts-ignore
    response = await aiClient.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
      ...(json && { response_format: { type: "json_object" } }),
    });
    // @ts-ignore
  } else if (aiClient.constructor.name === "GoogleGenerativeAI") {
    // @ts-ignore
    const gemini = aiClient.getGenerativeModel({ model: model });
    const result = await gemini.generateContent(prompt);
    response = {
      choices: [{ message: { content: result.response.text() } }],
    };
  } else if (aiClient.constructor.name === "Anthropic") {
    // @ts-ignore
    const result = await aiClient.messages.create({
      model: model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    response = {
      choices: [{ message: { content: result.content[0].text } }],
    };
  } else {
    throw new Error("Unsupported AI client");
  }

  return response.choices[0].message.content || "";
}

export async function generateContentSuggestions(
  supabase: SupabaseClient
): Promise<ContentSuggestion[]> {
  const prompt = `
    You are an expert YouTube content strategist. Your goal is to generate 5 innovative and engaging video ideas for a channel focused on AI and tech.

    For each idea, provide:
    - A catchy, SEO-friendly title.
    - A brief, compelling description (1-2 sentences).
    - A type (e.g., 'Tutorial', 'Explainer', 'News', 'Case Study').
    - Estimated view count potential (e.g., '50k-100k').
    - Estimated engagement level (e.g., 'High', 'Medium', 'Low').

    Format the output as a valid JSON array of objects. Each object should have the following keys: 'title', 'description', 'type', 'metrics'. The 'metrics' object should contain 'views' and 'engagement'.
  `;

  const response = await generate(supabase, prompt, true);
  const suggestions = JSON.parse(response);

  return suggestions.map((suggestion: any, index: number) => ({
    id: (index + 1).toString(),
    ...suggestion,
  }));
}

export async function generateTrendingTopics(
  supabase: SupabaseClient
): Promise<TrendingTopic[]> {
  const prompt = `
    You are a YouTube trend analyst specializing in the AI and tech niche. Identify the top 3-5 trending topics that are currently gaining significant traction.

    For each topic, provide:
    - A clear, concise title.
    - A short description (1-2 sentences) explaining its relevance.
    - A growth metric (e.g., '+150%').

    Format the output as a valid JSON array of objects. Each object should have the following keys: 'title', 'description', 'growth'.
  `;

  const response = await generate(supabase, prompt, true);
  const topics = JSON.parse(response);

  return topics.map((topic: any, index: number) => ({
    id: (index + 1).toString(),
    ...topic,
  }));
}

export async function generateVideoImprovements(
  supabase: SupabaseClient,
  videos: any[]
): Promise<VideoImprovement[]> {
  const prompt = `
    You are a YouTube optimization expert. Based on the provided video data, generate 2-3 actionable improvement suggestions for each video to enhance its performance.

    Focus on areas like:
    - Title and thumbnail optimization.
    - Description and keyword enhancements.
    - Audience retention and engagement strategies.

    The input will be a JSON array of video objects, each with 'title', 'description', and 'statistics'.

    Format the output as a valid JSON array of objects. Each object should have 'videoId', 'videoTitle', and a 'suggestions' array of strings.

    Here is the video data:
    ${JSON.stringify(videos)}
  `;

  const response = await generate(supabase, prompt, true);
  return JSON.parse(response);
}

export async function generateText(
  supabase: SupabaseClient,
  prompt: string
): Promise<string> {
  const systemPrompt =
    "You are a versatile AI assistant for YouTube creators. Respond to the user's prompt with helpful, concise, and well-formatted content.";
  const fullPrompt = `${systemPrompt}\n\n${prompt}`;
  return generate(supabase, fullPrompt);
}