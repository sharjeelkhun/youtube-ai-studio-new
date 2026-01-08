"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, Check, AlertCircle, Sparkles, Info, Save } from "lucide-react"
import { useOnboarding } from "@/contexts/onboarding-context"
import { useProfile } from "@/contexts/profile-context"
import { aiProviders } from "@/lib/ai-providers"
import { toast } from "sonner"

interface Step2ConnectAIProps {
    onNext: () => void
    onBack: () => void
}

export function Step2ConnectAI({ onNext, onBack }: Step2ConnectAIProps) {
    const { onboardingData, updateOnboardingData } = useOnboarding()
    const { profile, updateProfile, loading: profileLoading } = useProfile()

    const [selectedProvider, setSelectedProvider] = useState<string>(profile?.ai_provider || "openai")
    const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({})
    const [aiSettings, setAiSettings] = useState({
        defaultModel: "gpt-4o",
        temperature: "balanced",
    })

    const [isTesting, setIsTesting] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [lastValidatedKey, setLastValidatedKey] = useState<string | null>(null)

    // Load initial data from profile
    useEffect(() => {
        if (profile) {
            setSelectedProvider(profile.ai_provider || "openai")
            if (profile.ai_settings) {
                setApiKeys(profile.ai_settings.apiKeys || {})
                if (profile.ai_settings.features) {
                    setAiSettings({
                        defaultModel: profile.ai_settings.features.defaultModel || "gpt-4o",
                        temperature: profile.ai_settings.features.temperature || "balanced",
                    })
                }
            }
        }
    }, [profile])

    const currentProviderConfig = useMemo(
        () => aiProviders.find((p) => p.id === selectedProvider),
        [selectedProvider]
    )

    const handleApiKeyChange = (provider: string, value: string) => {
        setApiKeys((prev) => ({ ...prev, [provider]: value }))
    }

    const handleModelChange = (value: string) => {
        setAiSettings((prev) => ({ ...prev, defaultModel: value }))
    }

    const handleTestConnection = async () => {
        const apiKey = apiKeys[selectedProvider]
        if (!apiKey) {
            toast.error('Please enter an API key first')
            return
        }

        setIsTesting(true)

        try {
            const response = await fetch('/api/ai/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: selectedProvider,
                    apiKey,
                    model: aiSettings.defaultModel,
                }),
            })

            const data = await response.json()

            if (!data.ok) {
                toast.error(data.error || 'Validation failed')
                return
            }

            setLastValidatedKey(apiKey)
            toast.success(`Successfully validated ${currentProviderConfig?.name}`)

            // Auto-save on success to sync with settings
            handleSave()
        } catch (error) {
            console.error('Test connection error:', error)
            toast.error('Failed to test connection')
        } finally {
            setIsTesting(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateProfile({
                ai_provider: selectedProvider,
                ai_settings: {
                    ...profile?.ai_settings,
                    apiKeys,
                    features: {
                        ...profile?.ai_settings?.features,
                        ...aiSettings
                    }
                },
            })

            updateOnboardingData({
                aiProvider: selectedProvider,
                aiApiKey: apiKeys[selectedProvider]
            })

            return true
        } catch (error) {
            toast.error("Failed to save AI configuration")
            return false
        } finally {
            setIsSaving(false)
        }
    }

    const handleNext = async () => {
        const success = await handleSave()
        if (success) {
            onNext()
        }
    }

    const handleSkip = () => {
        onNext()
    }

    const isApiKeySet = (providerId: string) => apiKeys[providerId]?.length > 0

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Connect AI Provider</h2>
                <p className="text-muted-foreground">
                    Same configuration as your dashboard settings. Power your intelligent suggestions.
                </p>
            </div>

            <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Select Provider
                    </CardTitle>
                    <CardDescription>Choose your preferred AI service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <RadioGroup
                        value={selectedProvider}
                        onValueChange={setSelectedProvider}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2"
                    >
                        {aiProviders.map((provider) => (
                            <div key={provider.id} className="relative group">
                                <RadioGroupItem
                                    value={provider.id}
                                    id={provider.id}
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor={provider.id}
                                    className="flex items-center gap-4 rounded-xl border border-muted bg-card/50 p-4 hover:bg-accent/50 hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                                >
                                    <div className="p-2 bg-background rounded-full shadow-sm ring-1 ring-border/50">
                                        <provider.logo />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold">{provider.name}</div>
                                        <div className="text-xs text-muted-foreground">{provider.description}</div>
                                    </div>
                                    {isApiKeySet(provider.id) && (
                                        <Check className="h-5 w-5 text-green-500" />
                                    )}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>

                    <Separator />

                    {currentProviderConfig && (
                        <div className="space-y-6 p-6 rounded-xl bg-muted/30 border border-border/50">
                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="apiKey" className="text-sm font-medium">
                                        {currentProviderConfig.name} API Key
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="apiKey"
                                            type="password"
                                            placeholder={currentProviderConfig.apiKeyPlaceholder}
                                            value={apiKeys[selectedProvider] || ""}
                                            onChange={(e) => handleApiKeyChange(selectedProvider, e.target.value)}
                                            className="bg-background/80"
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={handleTestConnection}
                                            disabled={isTesting || !apiKeys[selectedProvider]}
                                        >
                                            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{currentProviderConfig.apiKeyHelpText}</p>
                                </div>

                                {currentProviderConfig.models && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Default Model</Label>
                                        <Select value={aiSettings.defaultModel} onValueChange={handleModelChange}>
                                            <SelectTrigger className="bg-background/80">
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
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
                <Button onClick={onBack} variant="outline" size="lg">
                    Back
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleSkip} variant="ghost" size="lg">
                        Skip for Now
                    </Button>
                    <Button onClick={handleNext} disabled={isSaving || profileLoading} size="lg" className="min-w-[150px]">
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
