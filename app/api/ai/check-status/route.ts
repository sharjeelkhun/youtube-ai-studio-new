import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { Mistral } from '@mistralai/mistralai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getRateLimitStatus } from '@/lib/rate-limiter'
import { aiProviders, getFallbackModel, isValidModel } from '@/lib/ai-providers'

// Temperature mapping (same as optimize route)
const temperatureMap: Record<string, number> = {
  precise: 0.3,
  balanced: 0.7,
  creative: 1.0,
}

async function checkOpenAI(apiKey: string, userId: string, userModel?: string, temperature: number = 0.7) {
  try {
    // Check rate limiter status first
    const rateLimitStatus = getRateLimitStatus('openai', userId)
    if (rateLimitStatus.availableTokens < 1) {
      throw new Error(`Rate limiter exhausted. Please wait ${Math.ceil(rateLimitStatus.estimatedWaitMs / 1000)} seconds.`)
    }

    const openai = new OpenAI({ apiKey })

    // Dynamically get the best available model
    const { getBestOpenAIModel } = await import('@/lib/openai-models')
    const modelToUse = await getBestOpenAIModel(apiKey, userModel)
    console.log('[CHECK-STATUS-OPENAI] Using model:', modelToUse, '(requested:', userModel, ')')

    // Perform realistic test with minimal optimization prompt
    await openai.chat.completions.create({
      model: modelToUse,
      max_tokens: 100,
      temperature,
      messages: [{
        role: 'user',
        content: 'Optimize this YouTube title: "Test Video". Return JSON: {"title": "string"}'
      }]
    })

    return rateLimitStatus
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid OpenAI API key. Get a key at https://platform.openai.com/api-keys')
    }
    if (error.response?.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Wait a few minutes and try again.')
    }
    throw error
  }
}

async function checkAnthropic(apiKey: string, userId: string, userModel?: string, temperature: number = 0.7) {
  try {
    // Check rate limiter status first
    const rateLimitStatus = getRateLimitStatus('anthropic', userId)
    if (rateLimitStatus.availableTokens < 1) {
      throw new Error(`Rate limiter exhausted. Please wait ${Math.ceil(rateLimitStatus.estimatedWaitMs / 1000)} seconds.`)
    }

    const anthropic = new Anthropic({ apiKey })

    // Dynamically get the best available model
    const { getBestAnthropicModel } = await import('@/lib/anthropic-models')
    const modelToUse = await getBestAnthropicModel(apiKey, userModel)
    console.log('[CHECK-STATUS-ANTHROPIC] Using model:', modelToUse, '(requested:', userModel, ')')

    // Perform realistic test with minimal optimization prompt
    await anthropic.messages.create({
      model: modelToUse,
      max_tokens: 100,
      temperature,
      messages: [{
        role: 'user',
        content: 'Optimize this YouTube title: "Test Video". Return JSON: {"title": "string"}'
      }]
    })

    return rateLimitStatus
  } catch (error: any) {
    if (error.status === 401 || error.status === 403) {
      throw new Error('Invalid Anthropic API key. Get a key at https://console.anthropic.com/settings/keys')
    }
    if (error.status === 404 || error.error?.type === 'not_found_error') {
      const fallback = getFallbackModel('anthropic')
      throw new Error(`Model '${userModel}' not available. Try '${fallback}' instead. Check https://console.anthropic.com/ for available models.`)
    }
    if (error.status === 402 || error.error?.type === 'insufficient_quota') {
      throw new Error('Insufficient Anthropic credits. Add credits at https://console.anthropic.com/settings/billing')
    }
    if (error.status === 429) {
      throw new Error('Anthropic API rate limit exceeded. Wait a few minutes and try again.')
    }
    throw error
  }
}

async function checkMistral(apiKey: string, userId: string, userModel?: string, temperature: number = 0.7) {
  try {
    // Check rate limiter status first
    const rateLimitStatus = getRateLimitStatus('mistral', userId)
    if (rateLimitStatus.availableTokens < 1) {
      throw new Error(`Rate limiter exhausted. Please wait ${Math.ceil(rateLimitStatus.estimatedWaitMs / 1000)} seconds.`)
    }

    const mistral = new Mistral({ apiKey })

    // Dynamically get the best available model
    const { getBestMistralModel } = await import('@/lib/mistral-models')
    const modelToUse = await getBestMistralModel(apiKey, userModel)
    console.log('[CHECK-STATUS-MISTRAL] Using model:', modelToUse, '(requested:', userModel, ')')

    // Perform realistic test with minimal optimization prompt
    await mistral.chat.complete({
      model: modelToUse,
      maxTokens: 100,
      temperature,
      messages: [{
        role: 'user',
        content: 'Optimize this YouTube title: "Test Video". Return JSON: {"title": "string"}'
      }]
    })

    return rateLimitStatus
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Mistral API key. Get a key at https://console.mistral.ai/')
    }
    if (error.response?.status === 429) {
      throw new Error('Mistral API rate limit exceeded. Wait a few minutes and try again.')
    }
    throw error
  }
}

async function checkGemini(apiKey: string, userId: string, userModel?: string, temperature: number = 0.7) {
  try {
    // Check rate limiter status first
    const rateLimitStatus = getRateLimitStatus('gemini', userId)
    console.log('[CHECK-STATUS-GEMINI] Rate limiter status:', {
      available: rateLimitStatus.availableTokens,
      capacity: 60
    })

    if (rateLimitStatus.availableTokens < 1) {
      throw new Error(`Rate limiter exhausted. Please wait ${Math.ceil(rateLimitStatus.estimatedWaitMs / 1000)} seconds.`)
    }

    console.log('[CHECK-STATUS-GEMINI] Initializing GoogleGenerativeAI client')
    const genAI = new GoogleGenerativeAI(apiKey)

    // Query Google's API for actual available models
    console.log('[CHECK-STATUS-GEMINI] Fetching available models from Google API')
    let availableModels: string[] = []
    let modelsListError: string | null = null
    try {
      const modelsResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
      console.log('[CHECK-STATUS-GEMINI] Models API response status:', modelsResponse.status)

      if (!modelsResponse.ok) {
        const errorText = await modelsResponse.text()
        console.error('[CHECK-STATUS-GEMINI] Models API error:', {
          status: modelsResponse.status,
          statusText: modelsResponse.statusText,
          error: errorText
        })
        modelsListError = errorText

        // If 401 or 403, the API key is invalid
        if (modelsResponse.status === 401 || modelsResponse.status === 403) {
          throw new Error('Invalid or expired Google API key. Please create a new API key at https://aistudio.google.com/app/apikey')
        }
      } else {
        const modelsData = await modelsResponse.json()
        availableModels = modelsData.models
          ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          ?.map((m: any) => m.name.replace('models/', '')) || []
        console.log('[CHECK-STATUS-GEMINI] Available models from API:', availableModels.slice(0, 10))
        console.log('[CHECK-STATUS-GEMINI] Total models available:', availableModels.length)
      }
    } catch (error: any) {
      console.error('[CHECK-STATUS-GEMINI] Error fetching models list:', {
        message: error.message,
        stack: error.stack
      })
      // If this is an API key error, rethrow it
      if (error.message?.includes('API key')) {
        throw error
      }
      modelsListError = error.message
    }

    // Determine which model to use
    let modelToUse = userModel

    // If user specified a model, validate it against actual available models
    if (userModel && availableModels.length > 0) {
      if (!availableModels.includes(userModel)) {
        console.warn(`[CHECK-STATUS-GEMINI] User model '${userModel}' not in available models`)
        // Try to find a suitable fallback
        const fallbackCandidates = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
        modelToUse = fallbackCandidates.find(m => availableModels.includes(m)) || availableModels[0]
        console.log(`[CHECK-STATUS-GEMINI] Using fallback model: ${modelToUse}`)
      }
    } else if (!userModel && availableModels.length > 0) {
      // No user model specified, use first available
      modelToUse = availableModels[0]
      console.log(`[CHECK-STATUS-GEMINI] No user model, using first available: ${modelToUse}`)
    } else if (!userModel) {
      // No models list and no user model, use hardcoded fallback
      modelToUse = getFallbackModel('gemini') || 'gemini-pro'
      console.log(`[CHECK-STATUS-GEMINI] Using hardcoded fallback: ${modelToUse}`)
    }

    // Ensure we have a model
    if (!modelToUse) {
      modelToUse = 'gemini-pro'
      console.warn('[CHECK-STATUS-GEMINI] No model determined, using gemini-pro as last resort')
    }

    console.log('[CHECK-STATUS-GEMINI] Using model:', modelToUse)
    const geminiModel = genAI.getGenerativeModel({ model: modelToUse })

    console.log('[CHECK-STATUS-GEMINI] Making test API call to Gemini')
    // Perform realistic test with minimal optimization prompt
    const result = await geminiModel.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: 'Optimize this YouTube title: "Test Video". Return JSON: {"title": "string"}' }]
      }],
      generationConfig: {
        temperature,
      },
    })

    if (!result || !result.response) {
      throw new Error('Failed to connect to Gemini API')
    }

    console.log('[CHECK-STATUS-GEMINI] Successfully validated Gemini API key')
    return { ...rateLimitStatus, availableModels }
  } catch (error: any) {
    console.error('[CHECK-STATUS-GEMINI] Validation error:', {
      status: error.status,
      message: error.message,
      type: error.constructor.name
    })

    if (error.status === 401 || error.message?.includes('API key')) {
      throw new Error('Invalid Google API key. Please verify your key starts with "AIza", is at least 30 characters, and is active. Get a key at https://aistudio.google.com/app/apikey')
    }
    if (error.status === 404 || error.message?.includes('models/') || error.message?.includes('not found')) {
      console.error('[CHECK-STATUS-GEMINI] Model not available:', {
        requestedModel: userModel,
        fallback: getFallbackModel('gemini')
      })
      throw new Error(`Model '${userModel}' not available with your API key. Please go to https://aistudio.google.com to check which models are available for your account, then update your selection in Settings.`)
    }
    if (error.status === 429) {
      console.error('[CHECK-STATUS-GEMINI] Rate limit exceeded from Gemini API')
      throw new Error('Google API rate limit exceeded (60 req/min). Wait 60 seconds and try again.')
    }
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const { provider, apiKey, model: requestModel, temperature: requestTemperature } = await req.json()

    // Add validation logging at entry point
    console.log('[CHECK-STATUS] Validating provider:', provider)
    if (apiKey) {
      console.log('[CHECK-STATUS] API key metadata:', {
        provider,
        hasKey: !!apiKey,
        keyLength: apiKey?.length,
        keyPrefix: apiKey?.substring(0, 4)
      })
    }

    // SPECIAL BEHAVIOR: When no API key is provided, return success without validation.
    // 
    // Intent: This allows the UI to display usage statistics and rate limiter status
    // even when users haven't configured an API key yet, preventing unnecessary
    // error messages during initial onboarding or when browsing settings.
    // 
    // Contract: Callers expecting validation MUST provide an API key. This endpoint
    // will NOT validate provider configuration when the key is missing; it simply
    // acknowledges the request was received successfully.
    // 
    // Future: Consider adding a query parameter like `?skipValidation=true` to make
    // this behavior more explicit and avoid potential confusion for API consumers.
    if (!apiKey || apiKey.trim() === '') {
      console.log('[CHECK-STATUS] No API key provided, returning success without validation')
      return NextResponse.json({ ok: true });
    }

    if (!provider) {
      return NextResponse.json({
        ok: false,
        error: 'Provider is required',
        errorCode: 'missing_provider'
      }, { status: 400 })
    }

    // Get user session and settings
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized',
        errorCode: 'no_session'
      }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch user's AI settings from Supabase
    let userModel: string | undefined
    let temperature: number = 0.7

    try {
      const { data, error } = await supabase.rpc('get_ai_settings')
      if (!error && data && data.length > 0) {
        const settings = data[0].settings
        userModel = settings?.features?.defaultModel
        const tempSetting = settings?.features?.temperature
        if (tempSetting && temperatureMap[tempSetting]) {
          temperature = temperatureMap[tempSetting]
        }
      }
    } catch (error) {
      console.warn('[CHECK-STATUS] Failed to fetch user settings, using defaults:', error)
    }

    // Prefer request body values (current in-memory state) over Supabase values
    if (requestModel) {
      userModel = requestModel
    }
    if (requestTemperature !== undefined) {
      // Map string temperature to number if needed
      if (typeof requestTemperature === 'string' && temperatureMap[requestTemperature]) {
        temperature = temperatureMap[requestTemperature]
      } else if (typeof requestTemperature === 'number') {
        temperature = requestTemperature
      }
    }

    // Validate the API key format based on provider
    const trimmedKey = apiKey.trim()

    switch (provider) {
      case 'openai':
        if (!trimmedKey.startsWith('sk-')) {
          return NextResponse.json({
            ok: false,
            error: 'Invalid OpenAI API key format. Keys should start with "sk-"',
            errorCode: 'invalid_format',
            suggestion: 'Check your API key at https://platform.openai.com/api-keys'
          }, { status: 400 })
        }
        break
      case 'anthropic':
        if (!trimmedKey.startsWith('sk-ant-')) {
          return NextResponse.json({
            ok: false,
            error: 'Invalid Anthropic API key format. Keys should start with "sk-ant-"',
            errorCode: 'invalid_format',
            suggestion: 'Check your API key at https://console.anthropic.com/settings/keys'
          }, { status: 400 })
        }
        break
      case 'gemini':
        console.log('[CHECK-STATUS-GEMINI] Validating API key:', {
          hasKey: !!trimmedKey,
          keyLength: trimmedKey.length,
          keyPrefix: trimmedKey.substring(0, 4),
          startsWithAIza: trimmedKey.startsWith('AIza'),
          meetsLengthRequirement: trimmedKey.length >= 30
        })
        if (!trimmedKey.startsWith('AIza') || trimmedKey.length < 30) {
          console.error('[CHECK-STATUS] Gemini API key validation failed:', {
            startsWithAIza: trimmedKey.startsWith('AIza'),
            length: trimmedKey.length,
            required: 30,
            keyPrefix: trimmedKey.substring(0, 10)
          })
          return NextResponse.json({
            ok: false,
            error: 'Invalid Google API key format. Keys must start with "AIza" and be at least 30 characters long.',
            errorCode: 'invalid_format',
            suggestion: 'Get a key at https://aistudio.google.com/app/apikey'
          }, { status: 400 })
        }
        break
      case 'mistral':
        if (trimmedKey.length < 32) {
          return NextResponse.json({
            ok: false,
            error: 'Invalid Mistral API key format. Keys should be at least 32 characters',
            errorCode: 'invalid_format',
            suggestion: 'Check your API key at https://console.mistral.ai/'
          }, { status: 400 })
        }
        break
      default:
        return NextResponse.json({
          ok: false,
          error: `Unsupported AI provider: ${provider}`,
          errorCode: 'unsupported_provider'
        }, { status: 400 })
    }

    // Validation summary logging
    console.log('[CHECK-STATUS] Pre-flight validation passed:', {
      provider,
      formatValid: true,
      sessionValid: true
    })

    // Perform realistic validation with user's configuration
    try {
      let rateLimitStatus

      switch (provider) {
        case 'openai':
          rateLimitStatus = await checkOpenAI(apiKey, userId, userModel)
          console.log('[CHECK-STATUS] Validation successful:', {
            provider,
            model: userModel || 'default',
            available: Math.floor(rateLimitStatus.availableTokens)
          })
          return NextResponse.json({
            ok: true,
            provider,
            model: userModel || 'default',
            rateLimitStatus: {
              available: Math.floor(rateLimitStatus.availableTokens),
              capacity: 60,
              percentAvailable: Math.floor((rateLimitStatus.availableTokens / 60) * 100)
            },
            message: `Successfully validated OpenAI${userModel ? ` with model '${userModel}'` : ''}. ${Math.floor(rateLimitStatus.availableTokens)} requests remaining.`
          })

        case 'anthropic':
          rateLimitStatus = await checkAnthropic(apiKey, userId, userModel, temperature)
          console.log('[CHECK-STATUS] Validation successful:', {
            provider,
            model: userModel || 'default',
            available: Math.floor(rateLimitStatus.availableTokens)
          })
          return NextResponse.json({
            ok: true,
            provider,
            model: userModel || 'default',
            rateLimitStatus: {
              available: Math.floor(rateLimitStatus.availableTokens),
              capacity: 5,
              percentAvailable: Math.floor((rateLimitStatus.availableTokens / 5) * 100)
            },
            message: `Successfully validated Anthropic${userModel ? ` with model '${userModel}'` : ''}. ${Math.floor(rateLimitStatus.availableTokens)} requests remaining.`
          })

        case 'gemini':
          rateLimitStatus = await checkGemini(apiKey, userId, userModel, temperature)
          console.log('[CHECK-STATUS] Validation successful:', {
            provider,
            model: userModel || 'default',
            available: Math.floor(rateLimitStatus.availableTokens)
          })
          return NextResponse.json({
            ok: true,
            provider,
            model: userModel || 'default',
            rateLimitStatus: {
              available: Math.floor(rateLimitStatus.availableTokens),
              capacity: 60,
              percentAvailable: Math.floor((rateLimitStatus.availableTokens / 60) * 100)
            },
            message: `Successfully validated Gemini${userModel ? ` with model '${userModel}'` : ''}. ${Math.floor(rateLimitStatus.availableTokens)} requests remaining.`
          })

        case 'mistral':
          rateLimitStatus = await checkMistral(apiKey, userId, userModel)
          console.log('[CHECK-STATUS] Validation successful:', {
            provider,
            model: userModel || 'default',
            available: Math.floor(rateLimitStatus.availableTokens)
          })
          return NextResponse.json({
            ok: true,
            provider,
            model: userModel || 'default',
            rateLimitStatus: {
              available: Math.floor(rateLimitStatus.availableTokens),
              capacity: 60,
              percentAvailable: Math.floor((rateLimitStatus.availableTokens / 60) * 100)
            },
            message: `Successfully validated Mistral${userModel ? ` with model '${userModel}'` : ''}. ${Math.floor(rateLimitStatus.availableTokens)} requests remaining.`
          })
      }

      // If we reach here without returning, something went wrong
      return NextResponse.json({
        ok: false,
        error: 'Validation failed unexpectedly',
        errorCode: 'unknown_error'
      }, { status: 500 })

    } catch (error: any) {
      console.error('[CHECK-STATUS] Validation failed:', {
        provider,
        errorMessage: error.message,
        errorType: error.constructor.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      })

      // Parse error message for specific codes
      const errorMessage = error.message || 'Invalid API key'
      let errorCode = 'validation_failed'
      let suggestion = ''
      let statusCode = 500

      if (errorMessage.includes('Rate limiter exhausted')) {
        errorCode = 'rate_limit'
        statusCode = 429
        const match = errorMessage.match(/wait (\d+) seconds/)
        const resetIn = match ? parseInt(match[1]) : 60
        console.log('[CHECK-STATUS] Returning rate limit error response:', {
          resetIn,
          available: 0
        })
        return NextResponse.json({
          ok: false,
          error: errorMessage,
          errorCode,
          rateLimitStatus: {
            resetIn,
            available: 0
          },
          suggestion: `Wait ${resetIn} seconds for the rate limit to reset, then try again.`
        }, { status: statusCode })
      }

      if (errorMessage.includes('Model') && errorMessage.includes('not')) {
        errorCode = 'invalid_model'
        statusCode = 400
        // Extract suggestion from error message if present
        const fallback = getFallbackModel(provider)
        suggestion = `Change your model to '${fallback}' in settings and try again.`
        console.log('[CHECK-STATUS] Returning invalid model error response:', {
          provider,
          fallback: getFallbackModel(provider)
        })
      }

      if (errorMessage.includes('Insufficient') || errorMessage.includes('credits')) {
        errorCode = 'insufficient_credits'
        statusCode = 402
        suggestion = 'Add credits to your account and try again.'
      }

      if (errorMessage.includes('Invalid') && errorMessage.includes('key')) {
        errorCode = 'invalid_key'
        statusCode = 401
        // Provide Gemini-specific suggestion if applicable
        if (provider === 'gemini' || errorMessage.includes('aistudio.google.com')) {
          suggestion = 'Get a key at https://aistudio.google.com/app/apikey and ensure it starts with "AIza" and is at least 30 characters.'
        } else {
          suggestion = 'Check your API key and try again.'
        }
        console.log('[CHECK-STATUS] Returning invalid key error response:', { provider })
      }

      return NextResponse.json({
        ok: false,
        error: errorMessage,
        errorCode,
        ...(suggestion && { suggestion })
      }, { status: statusCode })
    }

  } catch (error) {
    console.error('[AI_CHECK_STATUS_ERROR]', error)

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (/credit|quota|limit|billing/i.test(errorMessage)) {
        return NextResponse.json({
          ok: false,
          error: 'A billing-related error occurred with the AI provider.',
          errorCode: 'billing_error',
          suggestion: 'Check your billing status in the provider console.'
        }, { status: 400 });
      }

      if (/api key/i.test(errorMessage) || /authentication/i.test(errorMessage)) {
        return NextResponse.json({
          ok: false,
          error: 'The provided API key is invalid or has been rejected by the provider.',
          errorCode: 'invalid_key',
          suggestion: 'Verify your API key in the provider console.'
        }, { status: 400 })
      }

      return NextResponse.json({
        ok: false,
        error: errorMessage,
        errorCode: 'unknown_error'
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: false,
      error: 'An unexpected error occurred.',
      errorCode: 'unknown_error'
    }, { status: 500 })
  }
}
