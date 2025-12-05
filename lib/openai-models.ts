/**
 * Helper to get available OpenAI models for a given API key
 */
export async function getAvailableOpenAIModels(apiKey: string): Promise<string[]> {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        })

        if (!response.ok) {
            console.error('[OPENAI-MODELS] Failed to fetch models:', response.status)
            return []
        }

        const data = await response.json()
        const models = data.data
            ?.filter((m: any) => {
                // Filter for chat/completion models only
                const id = m.id.toLowerCase()
                return id.includes('gpt') && !id.includes('instruct') && !id.includes('vision')
            })
            ?.map((m: any) => m.id) || []

        console.log('[OPENAI-MODELS] Available models:', models)
        return models
    } catch (error) {
        console.error('[OPENAI-MODELS] Error fetching models:', error)
        return []
    }
}

/**
 * Get the best available OpenAI model for the given API key
 * Tries preferred models in order, falls back to first available
 */
export async function getBestOpenAIModel(
    apiKey: string,
    preferredModel?: string
): Promise<string> {
    const availableModels = await getAvailableOpenAIModels(apiKey)

    if (availableModels.length === 0) {
        // Fallback to common model names if API call fails
        console.warn('[OPENAI-MODELS] No models found, using fallback')
        return preferredModel || 'gpt-4o-mini'
    }

    // If preferred model is available, use it
    if (preferredModel && availableModels.includes(preferredModel)) {
        console.log('[OPENAI-MODELS] Using preferred model:', preferredModel)
        return preferredModel
    }

    // Try common models in order of preference (newest/best first)
    const preferredModels = [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4-turbo-preview',
        'gpt-4',
        'gpt-3.5-turbo',
    ]

    for (const model of preferredModels) {
        if (availableModels.includes(model)) {
            console.log('[OPENAI-MODELS] Using fallback model:', model)
            return model
        }
    }

    // Use first available model
    const firstModel = availableModels[0]
    console.log('[OPENAI-MODELS] Using first available model:', firstModel)
    return firstModel
}
