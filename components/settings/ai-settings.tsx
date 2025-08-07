"use client"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Sparkles, Save, Loader2, Check, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase"
import { useSession } from "@/contexts/session-context"

export function AISettings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState("openai")
  const { session } = useSession()
  const supabase = createClient()
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    gemini: "",
    anthropic: "",
    mistral: "",
  })
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
    const fetchSettings = async () => {
      if (!session) return

      const { data, error } = await supabase
        .from("profiles")
        .select("ai_provider, ai_settings")
        .eq("id", session.user.id)
        .single()

      if (data) {
        setSelectedProvider(data.ai_provider || "openai")
        if (data.ai_settings) {
          const settings = data.ai_settings as any
          setApiKeys(settings.apiKeys || { openai: "", gemini: "", anthropic: "", mistral: "" })
          setAiSettings(settings.features || aiSettings)
        }
      }
    }

    fetchSettings()
  }, [session, supabase])

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }))
  }

  const handleSettingChange = (setting: string, value: any) => {
    setAiSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleSaveSettings = async () => {
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to save settings.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ai_provider: selectedProvider,
          ai_settings: JSON.stringify({ apiKeys: apiKeys, features: aiSettings }),
        })
        .eq("id", session.user.id)

      if (error) throw error

      toast({
        title: "AI settings saved",
        description: "Your AI provider settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save AI settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isApiKeySet = (provider: string) => {
    return apiKeys[provider as keyof typeof apiKeys]?.length > 0
  }

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
            {[
              {
                id: "openai",
                name: "OpenAI",
                description: "GPT-4o and GPT-3.5 Turbo models",
                logo: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                  </svg>
                ),
              },
              {
                id: "gemini",
                name: "Google Gemini",
                description: "Gemini Pro and Ultra models",
                logo: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-3.5l6-4.5-6-4.5v9z" />
                  </svg>
                ),
              },
              {
                id: "anthropic",
                name: "Anthropic",
                description: "Claude 3 Opus and Sonnet models",
                logo: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M12 2L2 12l10 10 10-10L12 2zm0 15.5L6.5 12 12 6.5l5.5 5.5-5.5 5.5z" />
                  </svg>
                ),
              },
              {
                id: "mistral",
                name: "Mistral AI",
                description: "Mistral Large and Medium models",
                logo: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm1-9.5c0 .83-.67 1.5-1.5 1.5S13 8.33 13 7.5 13.67 6 14.5 6s1.5.67 1.5 1.5zM9.5 6C10.33 6 11 6.67 11 7.5S10.33 9 9.5 9 8 8.33 8 7.5 8.67 6 9.5 6z" />
                  </svg>
                ),
              },
            ].map((provider) => (
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
                  <div className="mb-3">{provider.logo}</div>
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

            {selectedProvider === "openai" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="openai-api-key"
                      type="password"
                      placeholder="sk-..."
                      value={apiKeys.openai}
                      onChange={(e) => handleApiKeyChange("openai", e.target.value)}
                    />
                    <Button variant="outline" size="icon">
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key is stored securely and never shared with third parties.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openai-model">Default Model</Label>
                  <Select
                    value={aiSettings.defaultModel}
                    onValueChange={(value) => handleSettingChange("defaultModel", value)}
                  >
                    <SelectTrigger id="openai-model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {selectedProvider === "gemini" && (
              <div className="space-y-2">
                <Label htmlFor="gemini-api-key">Google Gemini API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="gemini-api-key"
                    type="password"
                    placeholder="AIza..."
                    value={apiKeys.gemini}
                    onChange={(e) => handleApiKeyChange("gemini", e.target.value)}
                  />
                  <Button variant="outline" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Get your API key from the Google AI Studio.</p>
              </div>
            )}

            {selectedProvider === "anthropic" && (
              <div className="space-y-2">
                <Label htmlFor="anthropic-api-key">Anthropic API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="anthropic-api-key"
                    type="password"
                    placeholder="sk-ant-..."
                    value={apiKeys.anthropic}
                    onChange={(e) => handleApiKeyChange("anthropic", e.target.value)}
                  />
                  <Button variant="outline" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Get your API key from the Anthropic Console.</p>
              </div>
            )}

            {selectedProvider === "mistral" && (
              <div className="space-y-2">
                <Label htmlFor="mistral-api-key">Mistral AI API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="mistral-api-key"
                    type="password"
                    placeholder="..."
                    value={apiKeys.mistral}
                    onChange={(e) => handleApiKeyChange("mistral", e.target.value)}
                  />
                  <Button variant="outline" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Get your API key from the Mistral AI Platform.</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            {isLoading ? (
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
          <Button onClick={handleSaveSettings} disabled={isLoading}>
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
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium">Current Usage</h3>
              <div className="mt-2 space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>API Calls</span>
                    <span className="font-medium">245 / 1,000</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "24.5%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>Content Generation</span>
                    <span className="font-medium">18 / 50</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "36%" }}></div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Usage resets on the 1st of each month. Current billing cycle: Apr 1 - Apr 30, 2025
              </p>
            </div>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Upgrade for more AI features</AlertTitle>
              <AlertDescription>
                Your current plan includes limited AI usage. Upgrade to Pro for unlimited AI-powered content suggestions
                and analytics.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline">View Upgrade Options</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
