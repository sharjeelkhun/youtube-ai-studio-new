"use client"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Sparkles, Save, Loader2, Check, Info } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useProfile } from "@/contexts/profile-context"
import { aiProviders } from "@/lib/ai-providers"
import { useAIUsage } from "@/hooks/use-ai-usage"
import { useAI } from "@/contexts/ai-context"

export function AISettings() {
  const { profile, updateProfile, loading: profileLoading } = useProfile()
  const [selectedProvider, setSelectedProvider] = useState("openai")
  const { usageData, isLoading: usageLoading, error: usageError } = useAIUsage(selectedProvider)
  const { hasBillingError, setHasBillingError } = useAI()

  const [isLoading, setIsLoading] = useState(false)
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({})
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

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }))
  }

  const handleSettingChange = (setting: string, value: any) => {
    setAiSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleSaveApiSettings = async () => {
    setIsLoading(true)
    try {
      await updateProfile({
        ai_provider: selectedProvider,
        ai_settings: { ...profile?.ai_settings, apiKeys },
      })
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
            onValueChange={setSelectedProvider}
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
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Get API key"
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

      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>View your AI usage and set limits</CardDescription>
        </CardHeader>
        <CardContent>
          {hasBillingError && (
            <Alert variant="destructive" className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Billing Issue Detected</AlertTitle>
              <AlertDescription>
                We encountered a billing-related error with your AI provider. Please check your plan and billing details with the provider to ensure uninterrupted service.
              </AlertDescription>
              <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setHasBillingError(false)}>Dismiss</Button>
            </Alert>
          )}
          {usageLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : usageError ? (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Could not load usage data. Please try again later.</AlertDescription>
            </Alert>
          ) : usageData ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Current Usage</h3>
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>API Calls</span>
                      <span className="font-medium">
                        {usageData.apiCalls.used} / {usageData.apiCalls.limit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${(usageData.apiCalls.used / usageData.apiCalls.limit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>Content Generation</span>
                      <span className="font-medium">
                        {usageData.contentGeneration.used} / {usageData.contentGeneration.limit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${(usageData.contentGeneration.used / usageData.contentGeneration.limit) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Usage resets on the 1st of each month. Current billing cycle: {usageData.billingCycle.start} -{" "}
                  {usageData.billingCycle.end}
                </p>
              </div>

              {usageData.limitReached ? (
                <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>API Limit Reached</AlertTitle>
                  <AlertDescription>
                    You have exceeded your API quota for the current billing cycle. Please upgrade your plan to
                    continue using AI features.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Upgrade for more AI features</AlertTitle>
                  <AlertDescription>
                    Your current plan includes limited AI usage. Upgrade to Pro for unlimited AI-powered content
                    suggestions and analytics.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline">View Upgrade Options</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
