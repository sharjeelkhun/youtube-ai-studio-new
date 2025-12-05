/**
 * Helper to get available Anthropic models for a given API key
 * Note: Anthropic doesn't have a public API to list models, so we use known models
 */
export async function getAvailableAnthropicModels(apiKey: string): Promise<string[]> {
    // Anthropic doesn't provide a models list endpoint
    // Return known available models based on their documentation
    const knownModels = [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-sonnet-20240620',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
    ]

    console.log('[ANTHROPIC-MODELS] Using known models:', knownModels)
    return knownModels
}

/**
 * Get the best available Anthropic model for the given API key
 * Tries preferred models in order, falls back to recommended model
 */
export async function getBestAnthropicModel(
    apiKey: string,
    preferredModel?: string
): Promise<string> {
    const availableModels = await getAvailableAnthropicModels(apiKey)

    // If preferred model is in known models, use it
    if (preferredModel && availableModels.includes(preferredModel)) {
        console.log('[ANTHROPIC-MODELS] Using preferred model:', preferredModel)
        return preferredModel
    }

    // Try preferred models in order (newest/best first)
    const preferredModels = [
        'claude-3-5-sonnet-20241022', // Latest Sonnet 3.5
        'claude-3-5-sonnet-20240620', // Previous Sonnet 3.5
        'claude-3-opus-20240229',     // Most capable
        'claude-3-sonnet-20240229',   // Balanced
        'claude-3-haiku-20240307',    // Fastest/cheapest
    ]

    for (const model of preferredModels) {
        if (availableModels.includes(model)) {
            console.log('[ANTHROPIC-MODELS] Using fallback model:', model)
            return model
        }
    }

    // Default to latest Sonnet
    const defaultModel = 'claude-3-5-sonnet-20241022'
    console.log('[ANTHROPIC-MODELS] Using default model:', defaultModel)
    return defaultModel
}
