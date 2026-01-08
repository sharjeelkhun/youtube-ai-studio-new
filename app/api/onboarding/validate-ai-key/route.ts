import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
    try {
        const { provider, apiKey } = await request.json()

        if (!provider || !apiKey) {
            return NextResponse.json({ valid: false, error: "Provider and API key are required" }, { status: 400 })
        }

        // Validate API key based on provider
        let isValid = false
        let errorMessage = ""

        switch (provider) {
            case "openai":
                isValid = await validateOpenAIKey(apiKey)
                errorMessage = "Invalid OpenAI API key"
                break
            case "gemini":
                isValid = await validateGeminiKey(apiKey)
                errorMessage = "Invalid Gemini API key"
                break
            case "anthropic":
                isValid = await validateAnthropicKey(apiKey)
                errorMessage = "Invalid Anthropic API key"
                break
            case "mistral":
                isValid = await validateMistralKey(apiKey)
                errorMessage = "Invalid Mistral API key"
                break
            default:
                return NextResponse.json({ valid: false, error: "Unsupported provider" }, { status: 400 })
        }

        if (isValid) {
            // Save the API key to the user's profile
            const supabase = createRouteHandlerClient({ cookies })
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (user) {
                const { error } = await supabase
                    .from("profiles")
                    .update({
                        ai_provider: provider,
                        ai_settings: { api_key: apiKey },
                    })
                    .eq("id", user.id)

                if (error) {
                    console.error("Error saving AI settings:", error)
                }
            }

            return NextResponse.json({ valid: true })
        } else {
            return NextResponse.json({ valid: false, error: errorMessage }, { status: 400 })
        }
    } catch (error) {
        console.error("Error validating API key:", error)
        return NextResponse.json({ valid: false, error: "Failed to validate API key" }, { status: 500 })
    }
}

async function validateOpenAIKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch("https://api.openai.com/v1/models", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        })
        return response.ok
    } catch {
        return false
    }
}

async function validateGeminiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`)
        return response.ok
    } catch {
        return false
    }
}

async function validateAnthropicKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                max_tokens: 1,
                messages: [{ role: "user", content: "test" }],
            }),
        })
        return response.ok || response.status === 400 // 400 means auth worked but request was invalid
    } catch {
        return false
    }
}

async function validateMistralKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch("https://api.mistral.ai/v1/models", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        })
        return response.ok
    } catch {
        return false
    }
}
