import OpenAI from "openai";

export const AI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
