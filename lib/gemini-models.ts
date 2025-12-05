/**
 * Helper to get available Gemini models for a given API key
 */
export async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        )

        if (!response.ok) {
            console.error('[GEMINI-MODELS] Failed to fetch models:', response.status)
            return []
        }

        const data = await response.json()
        const models = data.models
            ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            ?.map((m: any) => m.name.replace('models/', '')) || []

        console.log('[GEMINI-MODELS] Available models:', models)
        return models
    } catch (error) {
        console.error('[GEMINI-MODELS] Error fetching models:', error)
        return []
    }
}

/**
 * Get the best available model for the given API key
 * Tries preferred models in order, falls back to first available
 */
export async function getBestGeminiModel(
    apiKey: string,
    preferredModel?: string
): Promise<string> {
    const availableModels = await getAvailableGeminiModels(apiKey)

    if (availableModels.length === 0) {
        // Fallback to common model names if API call fails
        console.warn('[GEMINI-MODELS] No models found, using fallback')
        return preferredModel || 'gemini-pro'
    }

    // If preferred model is available, use it
    if (preferredModel && availableModels.includes(preferredModel)) {
        console.log('[GEMINI-MODELS] Using preferred model:', preferredModel)
        return preferredModel
    }

    // Try common models in order of preference
    const preferredModels = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.0-pro'
    ]

    for (const model of preferredModels) {
        if (availableModels.includes(model)) {
            console.log('[GEMINI-MODELS] Using fallback model:', model)
            return model
        }
    }

    // Use first available model
    const firstModel = availableModels[0]
    console.log('[GEMINI-MODELS] Using first available model:', firstModel)
    return firstModel
}
