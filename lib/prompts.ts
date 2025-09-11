export const optimizeTitlePrompt = (title: string, description: string) => `Optimize this YouTube title to be more engaging while maintaining the core message. Keep it under 100 characters.

Current Title: ${title}
Video Description: ${description}

Requirements:
1. Keep it under 100 characters
2. Make it engaging and click-worthy
3. Maintain key information and topic
4. Use 1-2 relevant emojis maximum at the start
5. Focus on clarity and searchability
6. DO NOT use asterisks (*) or any markdown formatting
7. DO NOT add quotes unless they are part of the actual title
8. DO NOT add unnecessary formatting or symbols

Respond with ONLY the optimized title - no explanations, no asterisks, no quotes, no markdown.`

export const optimizeDescriptionPrompt = (title: string, description: string) => `You are a YouTube SEO expert. Optimize this video description to maximize views and engagement while maintaining accuracy.

Current Title: "${title}"
Current Description: "${description}"

Generate a highly optimized description that:
1. Starts with a strong hook in the first two lines (no asterisks or bold formatting)
2. Uses natural language and keywords (avoid excessive formatting)
3. Uses emojis as section headers (max 1 emoji per section)
4. Uses basic formatting (new lines for readability)
5. Includes clear sections:
   - Main description
   - What you'll learn
   - Links & resources
   - Call to action
6. Avoids overuse of:
   - Asterisks/bold text
   - Excessive emojis
   - Multiple line breaks
7. Ends with 3-5 relevant hashtags

Format the description with proper spacing and no markdown formatting. Use emojis sparingly and naturally.`

export const optimizeTagsPrompt = (title: string, description: string) => `Generate relevant YouTube tags for this video.

Current Title: ${title}
Current Description: ${description}

Requirements:
1. Generate up to 10 highly relevant tags
2. Focus on search traffic and discoverability
3. Include a mix of:
   - Main topic keywords
   - Related topics
   - Specific details
4. Keep tags between 2-30 characters each
5. Avoid overused generic tags
6. Ensure tags are relevant to the content
7. Return only the tags, one per line
8. No special characters or formatting`
