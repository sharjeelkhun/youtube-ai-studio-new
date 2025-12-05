/**
 * Helper to get available Mistral AI models for a given API key
 */
export async function getAvailableMistralModels(apiKey: string): Promise<string[]> {
    try {
        const response = await fetch('https://api.mistral.ai/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        })

        if (!response.ok) {
            console.error('[MISTRAL-MODELS] Failed to fetch models:', response.status)
            return []
        }

        const data = await response.json()
        const models = data.data?.map((m: any) => m.id) || []

        console.log('[MISTRAL-MODELS] Available models:', models)
        return models
    } catch (error) {
        console.error('[MISTRAL-MODELS] Error fetching models:', error)
        return []
    }
}

/**
 * Get the best available Mistral model for the given API key
 * Tries preferred models in order, falls back to first available
 */
export async function getBestMistralModel(
    apiKey: string,
    preferredModel?: string
): Promise<string> {
    const availableModels = await getAvailableMistralModels(apiKey)

    if (availableModels.length === 0) {
        // Fallback to common model names if API call fails
        console.warn('[MISTRAL-MODELS] No models found, using fallback')
        return preferredModel || 'mistral-large-latest'
    }

    // If preferred model is available, use it
    if (preferredModel && availableModels.includes(preferredModel)) {
        console.log('[MISTRAL-MODELS] Using preferred model:', preferredModel)
        return preferredModel
    }

    // Try common models in order of preference
    const preferredModels = [
        'mistral-large-latest',
        'mistral-large-2411',
        'mistral-medium-latest',
        'mistral-small-latest',
        'open-mistral-7b',
    ]

    for (const model of preferredModels) {
        if (availableModels.includes(model)) {
            console.log('[MISTRAL-MODELS] Using fallback model:', model)
            return model
        }
    }

    // Use first available model
    const firstModel = availableModels[0]
    console.log('[MISTRAL-MODELS] Using first available model:', firstModel)
    return firstModel
}
