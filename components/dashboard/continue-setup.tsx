"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Youtube, ArrowRight } from "lucide-react"
import { useProfile } from "@/contexts/profile-context"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import Link from "next/link"

export function ContinueSetup() {
    const { profile, loading: profileLoading } = useProfile()
    const { channel, loading: channelLoading } = useYouTubeChannel()
    const [isConnecting, setIsConnecting] = useState(false)

    const handleConnect = async () => {
        setIsConnecting(true)
        try {
            const response = await fetch('/api/youtube/connect')
            const data = await response.json()
            if (data.authUrl) {
                window.location.href = data.authUrl
            }
        } catch (error) {
            console.error('Error connecting channel:', error)
        } finally {
            setIsConnecting(false)
        }
    }

    if (profileLoading || channelLoading) return null

    const isAiConfigured = !!profile?.ai_provider && !!profile?.ai_settings?.apiKeys?.[profile.ai_provider]
    const isChannelConnected = !!channel

    if (isAiConfigured && isChannelConnected) return null

    return (
        <section className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Continue Setup</h2>
                <p className="text-sm text-muted-foreground">Complete these steps to unlock full potential</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {!isAiConfigured && (
                    <Card className="relative overflow-hidden border-primary/20 bg-primary/5">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Sparkles className="h-20 w-20" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Connect AI Provider
                            </CardTitle>
                            <CardDescription>
                                Set up OpenAI or Gemini to generate title and thumbnail ideas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/settings?tab=ai">
                                <Button size="sm" className="group">
                                    Configure AI
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {!isChannelConnected && (
                    <Card className="relative overflow-hidden border-red-500/20 bg-red-500/5">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Youtube className="h-20 w-20" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Youtube className="h-5 w-5 text-red-500" />
                                Connect YouTube Channel
                            </CardTitle>
                            <CardDescription>
                                Link your channel to sync your videos and get AI insights.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="group border-red-500/20 hover:bg-red-500/10"
                            >
                                {isConnecting ? "Connecting..." : "Connect Channel"}
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </section>
    )
}
