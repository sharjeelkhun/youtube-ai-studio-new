"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Loader2, Check, Youtube, AlertCircle } from "lucide-react"
import { useSession } from "@/contexts/session-context"
import { supabase } from "@/lib/supabase/client"

interface Step3ConnectChannelProps {
    onNext: () => void
    onBack: () => void
}

export function Step3ConnectChannel({ onNext, onBack }: Step3ConnectChannelProps) {
    const { onboardingData, updateOnboardingData } = useOnboarding()
    const { session } = useSession()
    const [isConnecting, setIsConnecting] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [channelInfo, setChannelInfo] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    // Check if channel is already connected
    useEffect(() => {
        const checkChannelConnection = async () => {
            if (!session?.user?.id) return

            try {
                const { data, error } = await supabase
                    .from("youtube_channels")
                    .select("*")
                    .eq("user_id", session.user.id)
                    .single()

                if (data && !error) {
                    setIsConnected(true)
                    setChannelInfo(data)
                    updateOnboardingData({ channelConnected: true })
                }
            } catch (err) {
                console.error("Error checking channel connection:", err)
            }
        }

        checkChannelConnection()
    }, [session?.user?.id])

    const handleConnectChannel = async () => {
        setIsConnecting(true)
        setError(null)

        try {
            // Fetch auth URL from the connect endpoint with Bearer token
            if (!session?.access_token) {
                throw new Error("No active session")
            }

            const response = await fetch('/api/youtube/connect', {
                headers: {
                    "Authorization": `Bearer ${session.access_token}`
                }
            })
            if (!response.ok) {
                throw new Error('Failed to initiate connection')
            }

            const data = await response.json()
            if (data.authUrl) {
                window.location.href = data.authUrl
            } else {
                throw new Error('No auth URL received')
            }
        } catch (err) {
            console.error('Error initiating connection:', err)
            setError("Failed to initiate YouTube connection. Please try again.")
            setIsConnecting(false)
        }
    }

    const handleNext = () => {
        onNext()
    }

    const handleSkip = () => {
        onNext()
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Connect Your YouTube Channel</h2>
                <p className="text-muted-foreground">
                    Link your YouTube channel to get personalized insights and recommendations
                </p>
            </div>

            <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Youtube className="h-5 w-5 text-red-500" />
                        YouTube Channel Connection
                    </CardTitle>
                    <CardDescription>
                        We'll need access to your YouTube channel to provide AI-powered suggestions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!isConnected ? (
                        <>
                            <div className="space-y-4">
                                <Alert className="bg-muted/50 border-muted">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        <strong>What we'll access:</strong>
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>Your channel information and statistics</li>
                                            <li>Your video metadata and analytics</li>
                                            <li>Read-only access to your content</li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>

                                <div className="flex justify-center pt-4">
                                    <Button
                                        onClick={handleConnectChannel}
                                        disabled={isConnecting}
                                        size="lg"
                                        className="min-w-[250px] shadow-lg hover:shadow-red-500/20 transition-all"
                                    >
                                        {isConnecting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                Connecting...
                                            </>
                                        ) : (
                                            <>
                                                <Youtube className="h-5 w-5 mr-2" />
                                                Connect YouTube Channel
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <Alert className="border-green-500/20 bg-green-500/5">
                                <Check className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-700 dark:text-green-400">
                                    <strong>Channel connected successfully!</strong>
                                    {channelInfo && (
                                        <div className="mt-2 space-y-1">
                                            <p className="font-medium">Channel: {channelInfo.title}</p>
                                            <p className="text-xs opacity-70">
                                                {channelInfo.subscriber_count?.toLocaleString() || 0} subscribers •{" "}
                                                {channelInfo.video_count?.toLocaleString() || 0} videos
                                            </p>
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>

                            <div className="rounded-xl border bg-card/50 p-6 space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    What's next?
                                </h4>
                                <ul className="space-y-3 text-sm text-muted-foreground ml-6 list-disc">
                                    <li>Automated analysis of your channel's performance</li>
                                    <li>Personalized AI content suggestions</li>
                                    <li>AI-powered thumbnail and title optimization</li>
                                    <li>Growth tracking and pattern recognition</li>
                                </ul>
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
                    <Button onClick={handleNext} disabled={!isConnected && !onboardingData.channelConnected} size="lg" className="min-w-[150px]">
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    )
}
