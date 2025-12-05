"use client"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Sparkles, Save, Loader2, Check, Info, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useProfile } from "@/contexts/profile-context"
import { aiProviders } from "@/lib/ai-providers"
import { useProviderUsage } from "@/hooks/use-provider-usage"
import { useAI } from "@/contexts/ai-context"

// Helper to detect if an error message is informational (usage tracking unavailable)
function isInformationalMessage(msg: string | undefined): boolean {
  if (!msg) return false
  const lower = msg.toLowerCase()
  return (
    lower.includes('does not provide programmatic usage') ||
    lower.includes('does not provide usage tracking') ||
    lower.includes('usage tracking not available') ||
    lower.includes('usage data is not available') ||
    lower.includes('no usage tracking available') ||
    lower.includes('may not be available')
  )
}

export function AISettings() {
  const { profile, updateProfile, loading: profileLoading } = useProfile()
  const [selectedProvider, setSelectedProvider] = useState("openai")
  const { usage: providerUsage, loading: providerLoading, error: providerError, refetch: refetchProvider } = useProviderUsage(selectedProvider)
  const { billingErrorProvider, setBillingErrorProvider } = useAI()

  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({})
  const [remainingResetTime, setRemainingResetTime] = useState<number | null>(null)
  const [rateLimiterStatus, setRateLimiterStatus] = useState<any>(null)
  const [aiSettings, setAiSettings] = useState({
    enhanceVideoTitles: true,
    generateThumbnailIdeas: true,
    improveDescriptions: true,
    suggestTags: true,
    contentIdeas: true,
    defaultModel: "gpt-4o",
    temperature: "balanced",
  })

  useEffect(() => {
    if (profile) {
      setSelectedProvider(profile.ai_provider || "openai")
      if (profile.ai_settings) {
        const settings = profile.ai_settings
        setApiKeys(settings.apiKeys || {})
        setAiSettings(settings.features || aiSettings)
      }
    }
  }, [profile])

  useEffect(() => {
    const providerConfig = aiProviders.find((p) => p.id === selectedProvider)
    if (providerConfig && providerConfig.models) {
      const currentModelIsValid = providerConfig.models.some((m) => m.id === aiSettings.defaultModel)
      if (!currentModelIsValid) {
        handleSettingChange("defaultModel", providerConfig.models[0].id)
      }
    }
  }, [selectedProvider, aiSettings.defaultModel])

  // Poll rate limiter status every 5 seconds
  useEffect(() => {
    const fetchRateLimiterStatus = async () => {
      try {
        const response = await fetch(`/api/debug/rate-limiter-status?provider=${selectedProvider}`)
        if (response.ok) {
          const data = await response.json()
          setRateLimiterStatus(data)
        }
      } catch (error) {
        console.error('Error fetching rate limiter status:', error)
      }
    }

    // Fetch immediately
    fetchRateLimiterStatus()

    // Poll every 5 seconds
    const interval = setInterval(fetchRateLimiterStatus, 5000)

    return () => clearInterval(interval)
  }, [selectedProvider])

  // Handle countdown timer for Gemini rate limit reset
  useEffect(() => {
    if (
      selectedProvider === 'gemini' &&
      providerUsage &&
      (providerUsage as any).error &&
      /rate.?limit/i.test((providerUsage as any).error)
    ) {
      // Start with a 60 second countdown
      setRemainingResetTime(60)

      // Update countdown every second
      const interval = setInterval(() => {
        setRemainingResetTime(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            // Trigger a refetch when timer reaches zero
            refetchProvider()
            return null
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setRemainingResetTime(null)
    }
  }, [selectedProvider, providerUsage, refetchProvider])

  /**
   * Validates API key format for a given provider
   * @param provider Provider ID (openai, anthropic, gemini, mistral)
   * @param apiKey The API key to validate
   * @returns Validation result with specific error message if invalid
   */
  const validateApiKeyFormat = (provider: string, apiKey: string): { valid: boolean; error?: string } => {
    const trimmedKey = apiKey.trim()

    console.log('[AI-SETTINGS] Validating API key format:', {
      provider,
      keyLength: trimmedKey.length,
      keyPrefix: trimmedKey.substring(0, 4) + '...'
    })

    switch (provider) {
      case 'openai':
        if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 40) {
          console.error('[AI-SETTINGS] API key validation failed:', {
            provider,
            hasPrefix: trimmedKey.startsWith('sk-'),
            length: trimmedKey.length,
            required: 40
          })
          return {
            valid: false,
            error: 'Invalid OpenAI API key format. Key must start with "sk-" and be at least 40 characters long.'
          }
        }
        break

      case 'anthropic':
        if (!trimmedKey.startsWith('sk-ant-') || trimmedKey.length < 40) {
          console.error('[AI-SETTINGS] API key validation failed:', {
            provider,
            hasPrefix: trimmedKey.startsWith('sk-ant-'),
            length: trimmedKey.length,
            required: 40
          })
          return {
            valid: false,
            error: 'Invalid Anthropic API key format. Key must start with "sk-ant-" and be at least 40 characters long.'
          }
        }
        break

      case 'gemini':
        if (!trimmedKey.startsWith('AIza') || trimmedKey.length < 30) {
          console.error('[AI-SETTINGS] API key validation failed:', {
            provider,
            hasPrefix: trimmedKey.startsWith('AIza'),
            length: trimmedKey.length,
            required: 30
          })
          return {
            valid: false,
            error: 'Invalid Gemini API key format. Key must start with "AIza" and be at least 30 characters long.'
          }
        }
        break

      case 'mistral':
        if (trimmedKey.length < 32) {
          console.error('[AI-SETTINGS] API key validation failed:', {
            provider,
            length: trimmedKey.length,
            required: 32
          })
          return {
            valid: false,
            error: 'Invalid Mistral API key format. Key must be at least 32 characters long.'
          }
        }
        break
    }

    console.log('[AI-SETTINGS] API key format validation passed:', { provider })
    return { valid: true }
  }

  const handleApiKeyChange = (provider: string, value: string) => {
    console.log('[AI-SETTINGS] API key updated for provider:', provider, '(length:', value.length, ')')
    setApiKeys((prev) => ({ ...prev, [provider]: value }))
  }

  const handleSettingChange = (setting: string, value: any) => {
    setAiSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleProviderChange = async (providerId: string) => {
    console.log('[AI-SETTINGS] Provider changed from', selectedProvider, 'to', providerId)
    setSelectedProvider(providerId)
    setBillingErrorProvider(null)

    const apiKey = apiKeys[providerId]
    if (!apiKey) {
      // Don't show error if user hasn't entered an API key yet
      return
    }

    // Clear any previous billing errors
    setBillingErrorProvider(null)

    try {
      // Validate API key format first
      const providerConfig = aiProviders.find(p => p.id === providerId)
      if (!providerConfig) {
        toast.error('Invalid provider selected')
        return
      }

      console.log('[AI-SETTINGS] Checking status for new provider:', providerId)

      // Use the validation helper function
      const validation = validateApiKeyFormat(providerId, apiKey)
      if (!validation.valid) {
        toast.error(validation.error || `Invalid ${providerConfig.name} API key format`)
        if (providerId === 'gemini') {
          toast.info('Get your API key at https://aistudio.google.com/app/apikey', { duration: 5000 })
        }
        return
      }

      const response = await fetch('/api/ai/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: providerId,
          apiKey: apiKey,
          model: aiSettings.defaultModel,
          temperature: aiSettings.temperature,
        }),
      })

      const data = await response.json()

      // Check data.ok first, before checking response.ok
      if (!data.ok) {
        console.error('[AI-SETTINGS] Provider change validation error:', {
          provider: providerId,
          errorCode: data.errorCode,
          error: data.error
        })

        // Handle error based on errorCode
        const providerConfig2 = aiProviders.find(p => p.id === providerId)

        if (data.errorCode === 'rate_limit') {
          toast.error(data.error || `${providerConfig2?.name} API rate limit exceeded`)
          setBillingErrorProvider(providerId)
        } else if (data.errorCode === 'invalid_key') {
          toast.error(data.error || `Invalid ${providerConfig2?.name} API key`)
        } else if (data.errorCode === 'invalid_format') {
          toast.error(data.error || `Invalid ${providerConfig2?.name} API key format`)
          if (data.suggestion) {
            toast.info(data.suggestion, { duration: 7000 })
          }
        } else if (data.errorCode === 'invalid_model') {
          toast.error(data.error || 'Invalid model selected')
          if (data.suggestion) {
            toast.info(data.suggestion)
          }
        } else if (data.errorCode === 'insufficient_credits') {
          toast.error(data.error || 'Insufficient credits')
          setBillingErrorProvider(providerId)
          if (data.suggestion) {
            toast.info(data.suggestion)
          }
        } else if (data.errorCode === 'billing_error') {
          setBillingErrorProvider(providerId)
          toast.error(data.error || `Billing error with ${providerConfig2?.name}`)
        } else {
          console.error('[AI-SETTINGS] Validation error:', {
            errorCode: data.errorCode,
            error: data.error,
            suggestion: data.suggestion
          })
          toast.error(data.error || 'Validation failed')
          if (data.suggestion) {
            toast.info(data.suggestion)
          }
        }
        return
      }

      // Success case - both response.ok and data.ok are true
      // Show detailed success message with model and remaining requests
      const providerConfig3 = aiProviders.find(p => p.id === providerId)
      const successMessage = data.message ||
        `Successfully validated ${providerConfig3?.name || providerId}${data.model ? ` with model '${data.model}'` : ''}. ${data.rateLimitStatus?.available || 0} requests remaining.`
      toast.success(successMessage)
    } catch (error) {
      console.error('Error checking AI provider status:', error)
      toast.error('An unexpected error occurred while validating the API key.')
    }
  }

  const handleTestConnection = async () => {
    const apiKey = apiKeys[selectedProvider]
    if (!apiKey) {
      toast.error('Please enter an API key first')
      return
    }

    console.log('[AI-SETTINGS] Testing connection for provider:', selectedProvider)
    console.log('[AI-SETTINGS] API key metadata:', {
      provider: selectedProvider,
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 4) + '...'
    })
    console.log('[AI-SETTINGS] Using settings:', {
      model: aiSettings.defaultModel,
      temperature: aiSettings.temperature
    })

    setIsTesting(true)

    try {
      const provider = aiProviders.find(p => p.id === selectedProvider)
      if (!provider) {
        toast.error('Invalid provider selected')
        return
      }

      // Use the validation helper function
      const validation = validateApiKeyFormat(selectedProvider, apiKey)
      if (!validation.valid) {
        toast.error(validation.error || `Invalid ${provider.name} API key format`)
        if (selectedProvider === 'gemini') {
          toast.info('Get your API key at https://aistudio.google.com/app/apikey', { duration: 5000 })
        }
        return
      }

      const response = await fetch('/api/ai/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey,
          model: aiSettings.defaultModel,
          temperature: aiSettings.temperature,
        }),
      })

      const data = await response.json()

      // Check data.ok first
      if (!data.ok) {
        console.error('[AI-SETTINGS] Test connection failed:', {
          errorCode: data.errorCode,
          error: data.error,
          provider: selectedProvider
        })

        // Handle error based on errorCode
        if (data.errorCode === 'rate_limit') {
          toast.error(data.error || `${provider.name} API rate limit exceeded`)
          if (data.suggestion) {
            toast.info(data.suggestion)
          }
        } else if (data.errorCode === 'invalid_key') {
          toast.error(data.error || `Invalid ${provider.name} API key`)
        } else if (data.errorCode === 'invalid_format') {
          toast.error(data.error || `Invalid ${provider.name} API key format`)
          if (data.suggestion) {
            toast.info(data.suggestion, { duration: 7000 })
          }
          console.error('[AI-SETTINGS] Format validation failed:', data)
        } else if (data.errorCode === 'invalid_model') {
          toast.error(data.error || 'Invalid model selected')
          if (data.suggestion) {
            toast.info(data.suggestion)
          }
        } else if (data.errorCode === 'insufficient_credits') {
          toast.error(data.error || 'Insufficient credits')
          if (data.suggestion) {
            toast.info(data.suggestion)
          }
        } else {
          console.error('[AI-SETTINGS] Validation error:', {
            errorCode: data.errorCode,
            error: data.error,
            suggestion: data.suggestion
          })
          toast.error(data.error || 'Validation failed')
          if (data.suggestion) {
            toast.info(data.suggestion)
          }
        }
        return
      }

      // Success case
      console.log('[AI-SETTINGS] Test connection successful:', {
        provider: selectedProvider,
        model: data.model,
        available: data.rateLimitStatus?.available
      })
      const successMessage = data.message ||
        `Successfully validated ${provider.name}${data.model ? ` with model '${data.model}'` : ''}. ${data.rateLimitStatus?.available || 0} requests remaining.`
      toast.success(successMessage)
    } catch (error) {
      console.error('[AI-SETTINGS] Network or unexpected error during test:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        provider: selectedProvider
      })
      toast.error('Failed to test connection. Please check your internet connection and try again.')
      toast.info('If the problem persists, verify your API key format and check the browser console for details.', { duration: 7000 })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveApiSettings = async () => {
    setIsLoading(true)
    try {
      await updateProfile({
        ai_provider: selectedProvider,
        ai_settings: {
          ...profile?.ai_settings,
          apiKeys,
          features: aiSettings  // Save model and temperature settings
        },
      })

      // Notify other components about provider change
      window.dispatchEvent(new CustomEvent('ai-provider-changed', {
        detail: { provider: selectedProvider }
      }))

      // Set storage flag for cross-tab sync
      localStorage.setItem('ai_provider_changed', Date.now().toString())

      toast.success("API settings saved successfully!")
    } catch (error) {
      toast.error("Failed to save API settings.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveFeatureSettings = async () => {
    setIsLoading(true)
    try {
      await updateProfile({
        ai_settings: { ...profile?.ai_settings, features: aiSettings },
      })
      toast.success("Feature settings saved successfully!")
    } catch (error) {
      toast.error("Failed to save feature settings.")
    } finally {
      setIsLoading(false)
    }
  }

  const getBillingMessage = (providerId: string) => {
    switch (providerId) {
      case 'gemini':
        return 'Google Gemini offers a generous free tier. Usage tracking is available in Google AI Studio.'
      case 'mistral':
        return 'Mistral AI offers a free tier. Usage tracking is available in Mistral Console.'
      case 'openai':
        return 'OpenAI API is a paid service. Please check your billing details on the OpenAI website.'
      case 'anthropic':
        return 'Anthropic API is a paid service. Usage tracking may be available via API or Console.'
      default:
        return ''
    }
  }

  const isApiKeySet = (provider: string) => {
    return apiKeys[provider]?.length > 0
  }

  const currentProviderConfig = useMemo(
    () => aiProviders.find((p) => p.id === selectedProvider),
    [selectedProvider]
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Provider</CardTitle>
          <CardDescription>Select and configure your preferred AI provider for content generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={selectedProvider}
            onValueChange={handleProviderChange}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            {aiProviders.map((provider) => (
              <div key={provider.id} className="relative">
                <RadioGroupItem
                  value={provider.id}
                  id={provider.id}
                  className="peer sr-only"
                  aria-label={provider.name}
                />
                <Label
                  htmlFor={provider.id}
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="mb-3">
                    <provider.logo />
                  </div>
                  <div className="font-semibold">{provider.name}</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">{provider.description}</div>
                  {isApiKeySet(provider.id) && (
                    <Badge className="mt-2 bg-green-500">
                      <Check className="mr-1 h-3 w-3" /> Connected
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">API Configuration</h3>

            {currentProviderConfig && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${currentProviderConfig.id}-api-key`}>{currentProviderConfig.name} API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`${currentProviderConfig.id}-api-key`}
                      type="password"
                      placeholder={currentProviderConfig.apiKeyPlaceholder}
                      value={apiKeys[currentProviderConfig.id] || ""}
                      onChange={(e) => handleApiKeyChange(currentProviderConfig.id, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTesting || !apiKeys[currentProviderConfig.id]}
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href={currentProviderConfig.apiKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Get ${currentProviderConfig.name} API key`}
                      >
                        <Info className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{currentProviderConfig.apiKeyHelpText}</p>
                </div>

                {currentProviderConfig.models && currentProviderConfig.models.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor={`${currentProviderConfig.id}-model`}>Default Model</Label>
                    <Select
                      value={aiSettings.defaultModel}
                      onValueChange={(value) => handleSettingChange("defaultModel", value)}
                    >
                      <SelectTrigger id={`${currentProviderConfig.id}-model`}>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentProviderConfig.models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Rate Limiter Status Panel */}
            {rateLimiterStatus && (
              <div className="mt-6 space-y-2">
                <h4 className="text-sm font-medium">Rate Limiter Status</h4>
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Available Tokens</span>
                    <span className="font-medium">
                      {rateLimiterStatus.available} / {rateLimiterStatus.capacity}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${rateLimiterStatus.status === 'available' ? 'bg-green-500' :
                          rateLimiterStatus.status === 'limited' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        style={{ width: `${rateLimiterStatus.percentAvailable}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{rateLimiterStatus.percentAvailable}% available</span>
                      <Badge variant={
                        rateLimiterStatus.status === 'available' ? 'default' :
                          rateLimiterStatus.status === 'limited' ? 'secondary' :
                            'destructive'
                      }>
                        {rateLimiterStatus.status}
                      </Badge>
                    </div>
                  </div>

                  {rateLimiterStatus.resetIn > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next Token In</span>
                      <span className="font-medium">{rateLimiterStatus.resetIn}s</span>
                    </div>
                  )}

                  {rateLimiterStatus.queueLength > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Queue Length</span>
                      <span className="font-medium">{rateLimiterStatus.queueLength}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveApiSettings} disabled={isLoading || profileLoading}>
            {isLoading || profileLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save API Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Real-time usage from your AI provider</CardDescription>
        </CardHeader>
        <CardContent>
          {billingErrorProvider && (
            <Alert variant="destructive" className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Billing Issue Detected</AlertTitle>
              <AlertDescription>
                We encountered a billing-related error with the AI provider: <strong>{billingErrorProvider}</strong>
              </AlertDescription>
              <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setBillingErrorProvider(null)}>Dismiss</Button>
            </Alert>
          )}

          {/* Show loader only on first load when no data exists */}
          {providerLoading && !providerUsage ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : providerError || !providerUsage || (providerUsage as any).configured === false ? (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                <div>
                  {typeof providerError === 'string' ? providerError :
                    (providerUsage as any)?.error || 'API key not configured'}
                </div>
              </AlertDescription>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchProvider()}>
                Retry
              </Button>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Show error message if provider has error */}
              {(providerUsage as any).error && (
                <Alert
                  variant="destructive"
                  className={`mb-4 ${/rate.?limit/i.test((providerUsage as any).error)
                    ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                    : /credit|balance|billing/i.test((providerUsage as any).error)
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                      : ""
                    }`}
                >
                  <Info className="h-4 w-4" />
                  <AlertTitle>
                    {/rate.?limit/i.test((providerUsage as any).error)
                      ? "Rate Limited"
                      : /credit|balance|billing/i.test((providerUsage as any).error)
                        ? "Billing Issue"
                        : "Provider Status"}
                  </AlertTitle>
                  <AlertDescription>
                    {(providerUsage as any).error}

                    {/rate.?limit/i.test((providerUsage as any).error) && selectedProvider === 'gemini' && (
                      <p className="mt-1 text-sm">Gemini's free tier resets every 60 seconds.</p>
                    )}

                    {/credit|balance|billing/i.test((providerUsage as any).error) && selectedProvider === 'anthropic' && (
                      <p className="mt-1 text-sm">
                        <a
                          href="https://console.anthropic.com/settings/billing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Check your Anthropic billing settings
                        </a>
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* OpenAI - Show Billing */}
              {selectedProvider === 'openai' && (providerUsage as any).billing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Account Balance</span>
                    <span className="font-semibold text-lg text-green-600">
                      ${((providerUsage as any).billing?.balance || 0).toFixed(2)} USD
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This month spent: ${((providerUsage as any).billing?.costThisMonth || 0).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Free Tier - Show Token Usage or No Tracking Message */}
              {selectedProvider !== 'openai' && (
                <div className="space-y-4">
                  {/* Debug logging for troubleshooting */}
                  {(() => {
                    console.log('[AI-SETTINGS] Provider usage data:', {
                      provider: selectedProvider,
                      error: (providerUsage as any)?.error,
                      quota: (providerUsage as any)?.quota,
                      isStatic: (providerUsage as any)?.isStatic,
                      trackingAvailable: (providerUsage as any)?.trackingAvailable,
                      errorIsInformational: isInformationalMessage((providerUsage as any)?.error)
                    });
                    return null;
                  })()}

                  {/* Check if provider has usage tracking unavailable using trackingAvailable flag or informational error */}
                  {(providerUsage as any).trackingAvailable === false || isInformationalMessage((providerUsage as any)?.error) ? (
                    <div className="space-y-3">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Usage Tracking Not Available</AlertTitle>
                        <AlertDescription>
                          {selectedProvider === 'gemini' && (
                            <>
                              Gemini API does not provide programmatic usage data. Monitor your usage in{' '}
                              <a
                                href="https://aistudio.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium underline"
                              >
                                Google AI Studio
                              </a>.
                            </>
                          )}
                          {selectedProvider === 'mistral' && (
                            <>
                              Mistral API does not provide programmatic usage data. Monitor your usage in{' '}
                              <a
                                href="https://console.mistral.ai/usage"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium underline"
                              >
                                Mistral Console
                              </a>.
                            </>
                          )}
                          {selectedProvider === 'anthropic' && (
                            <>
                              Usage tracking may not be available via API. Monitor your usage in{' '}
                              <a
                                href="https://console.anthropic.com/settings/billing"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium underline"
                              >
                                Anthropic Console
                              </a>.
                            </>
                          )}
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (providerUsage as any).error && !isInformationalMessage((providerUsage as any).error) ? (
                    // Real error state - show error message (exclude informational messages)
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{(providerUsage as any).error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{selectedProvider === 'gemini' ? 'Requests Today' : 'Tokens Used'}</span>
                        <span className="font-medium">
                          {/* For providers with static limits or billing/auth issues, show appropriate message */}
                          {(providerUsage as any).error && /credit|balance|billing|unauthorized|invalid/i.test((providerUsage as any).error)
                            ? "0"
                            : selectedProvider === 'gemini'
                              ? `${(providerUsage as any).usage?.used || 0} requests`
                              : `${(providerUsage as any).quota?.usedTokens ?? 0} / ${(providerUsage as any).quota?.totalTokens ?? (
                                selectedProvider === 'mistral' ? 50000 :
                                  selectedProvider === 'anthropic' ? 10000 : 0
                              )}`
                          }
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${(providerUsage as any).error && /rate.?limit/i.test((providerUsage as any).error)
                            ? 'bg-yellow-500'
                            : (providerUsage as any).error && /credit|balance|billing/i.test((providerUsage as any).error)
                              ? 'bg-orange-500'
                              : 'bg-primary'
                            }`}
                          style={{
                            width: `${
                              // If billing error, show empty bar
                              (providerUsage as any).error && /credit|balance|billing|unauthorized|invalid/i.test((providerUsage as any).error)
                                ? 0
                                // If rate limited, show full bar
                                : (providerUsage as any).error && /rate.?limit/i.test((providerUsage as any).error)
                                  ? 100
                                  // For Gemini, show minimal indicator based on usage
                                  : selectedProvider === 'gemini'
                                    ? Math.min(100, ((providerUsage as any).usage?.used || 0) / 10 * 100) // Visual indicator only
                                    // For static providers, return 0% to avoid showing false usage
                                    : (providerUsage as any).isStatic
                                      ? 0
                                      // Otherwise show actual usage percentage
                                      : ((providerUsage as any).quota?.usedTokens ?? 0) / ((providerUsage as any).quota?.totalTokens ?? (
                                        selectedProvider === 'mistral' ? 50000 :
                                          selectedProvider === 'anthropic' ? 10000 : 1
                                      )) * 100
                              }%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className={`font-medium ${(providerUsage as any).error && /rate.?limit/i.test((providerUsage as any).error)
                          ? "text-yellow-600"
                          : (providerUsage as any).error && /credit|balance|billing/i.test((providerUsage as any).error)
                            ? "text-orange-600"
                            : "text-green-600"
                          }`}>
                          {providerLoading ? (
                            "Loading usage data..."
                          ) : (providerUsage as any).error && /rate.?limit/i.test((providerUsage as any).error) ? (
                            "Rate limited"
                          ) : (providerUsage as any).error && /credit|balance|billing/i.test((providerUsage as any).error) ? (
                            "Billing required"
                          ) : selectedProvider === 'gemini' ? (
                            "Rate limit: 60 requests/minute"
                          ) : (providerUsage as any).isStatic ? (
                            `${(providerUsage as any).quota?.totalTokens ?? 0} tokens available (Static limits - actual usage not tracked)`
                          ) : (
                            `${(providerUsage as any).quota?.remainingTokens ?? (providerUsage as any).quota?.totalTokens ?? 0} tokens remaining`
                          )}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Rate Limit Reset Info - only show if tracking is available */}
                  {(providerUsage as any).trackingAvailable !== false && (
                    <div className="flex items-center justify-between text-sm p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                      <span>Rate Limit Reset</span>
                      <span className="font-semibold">
                        {/* Billing issues - show not applicable */}
                        {(providerUsage as any).error && /credit|balance|billing|unauthorized|invalid/i.test((providerUsage as any).error) ? (
                          'N/A - Account setup required'
                        ) : selectedProvider === 'gemini' ? (
                          (providerUsage as any).error && /rate.?limit/i.test((providerUsage as any).error) ?
                            `Resets in ${remainingResetTime || '< 60'} seconds` : 'Every 60 seconds'
                        ) : (providerUsage as any).quota?.resetDate && (
                          new Date((providerUsage as any).quota.resetDate) > new Date() ?
                            `In ${Math.ceil((new Date((providerUsage as any).quota.resetDate).getTime() - new Date().getTime()) / 1000)} seconds` :
                            `${(providerUsage as any).quota?.daysUntilReset || 1} day${(providerUsage as any).quota?.daysUntilReset !== 1 ? 's' : ''}`
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Rate Limits Info - Always Show For Free Tiers */}
              {((providerUsage as any).rateLimit || selectedProvider !== 'openai') && (
                <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded border">
                  <p className="text-xs font-semibold text-muted-foreground">Rate Limits</p>
                  {(providerUsage as any).rateLimit?.requestsPerMinute && (
                    <div className="flex justify-between text-xs">
                      <span>Requests/min:</span>
                      <span className="font-medium">{(providerUsage as any).rateLimit?.requestsPerMinute}</span>
                    </div>
                  )}
                  {(providerUsage as any).rateLimit?.tokensPerMinute && (
                    <div className="flex justify-between text-xs">
                      <span>Tokens/min:</span>
                      <span className="font-medium">{(providerUsage as any).rateLimit?.tokensPerMinute?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Show Help Text */}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>{getBillingMessage(selectedProvider)}</p>
                {(providerUsage as any).lastChecked && (
                  <p className="mt-1">
                    Last updated: {new Date((providerUsage as any).lastChecked).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Features</CardTitle>
          <CardDescription>Configure how AI is used throughout the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enhance-titles">Enhance Video Titles</Label>
                <p className="text-sm text-muted-foreground">Use AI to suggest improvements for your video titles</p>
              </div>
              <Switch
                id="enhance-titles"
                checked={aiSettings.enhanceVideoTitles}
                onCheckedChange={(checked) => handleSettingChange("enhanceVideoTitles", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="thumbnail-ideas">Generate Thumbnail Ideas</Label>
                <p className="text-sm text-muted-foreground">Get AI-generated thumbnail concepts for your videos</p>
              </div>
              <Switch
                id="thumbnail-ideas"
                checked={aiSettings.generateThumbnailIdeas}
                onCheckedChange={(checked) => handleSettingChange("generateThumbnailIdeas", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="improve-descriptions">Improve Descriptions</Label>
                <p className="text-sm text-muted-foreground">
                  Use AI to enhance your video descriptions for better SEO
                </p>
              </div>
              <Switch
                id="improve-descriptions"
                checked={aiSettings.improveDescriptions}
                onCheckedChange={(checked) => handleSettingChange("improveDescriptions", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="suggest-tags">Suggest Tags</Label>
                <p className="text-sm text-muted-foreground">
                  Get AI-generated tag suggestions for better discoverability
                </p>
              </div>
              <Switch
                id="suggest-tags"
                checked={aiSettings.suggestTags}
                onCheckedChange={(checked) => handleSettingChange("suggestTags", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="content-ideas">Content Ideas</Label>
                <p className="text-sm text-muted-foreground">
                  Receive AI-generated content ideas based on your channel performance
                </p>
              </div>
              <Switch
                id="content-ideas"
                checked={aiSettings.contentIdeas}
                onCheckedChange={(checked) => handleSettingChange("contentIdeas", checked)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium">AI Creativity</h3>
            <p className="text-sm text-muted-foreground">
              Adjust how creative the AI should be when generating content
            </p>

            <RadioGroup
              value={aiSettings.temperature}
              onValueChange={(value) => handleSettingChange("temperature", value)}
              className="grid grid-cols-3 gap-4"
            >
              <div className="relative">
                <RadioGroupItem value="precise" id="precise" className="peer sr-only" />
                <Label
                  htmlFor="precise"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="font-semibold">Precise</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">More factual, less creative</div>
                </Label>
              </div>

              <div className="relative">
                <RadioGroupItem value="balanced" id="balanced" className="peer sr-only" />
                <Label
                  htmlFor="balanced"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="font-semibold">Balanced</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">Mix of factual and creative</div>
                </Label>
              </div>

              <div className="relative">
                <RadioGroupItem value="creative" id="creative" className="peer sr-only" />
                <Label
                  htmlFor="creative"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="font-semibold">Creative</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">More creative, varied outputs</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveFeatureSettings} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Feature Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
