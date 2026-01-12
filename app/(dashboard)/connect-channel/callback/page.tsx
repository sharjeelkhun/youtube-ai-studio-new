"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { supabase } from "@/lib/supabase/client"

export default function ConnectionCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'conflict'>('loading')
    const [errorMessage, setErrorMessage] = useState("")
    const [conflictData, setConflictData] = useState<{ channelTitle?: string } | null>(null)
    const hasProcessed = useRef(false)
    const { refreshChannel } = useYouTubeChannel()

    useEffect(() => {
        // Middleware renames 'code' to 'g_code' to prevent Supabase conflict
        const code = searchParams.get("g_code") || searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")

        if (hasProcessed.current) return
        hasProcessed.current = true

        if (error) {
            setStatus('error')
            setErrorMessage(error)
            return
        }

        if (!code) {
            setStatus('error')
            setErrorMessage("No authorization code received.")
            return
        }

        const exchangeCode = async () => {
            try {
                // Recover session first
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    console.error("No session found in callback, attempting refresh...")
                    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
                    if (refreshError || !refreshedSession) {
                        throw new Error("Authentication failed. Please log in again.")
                    }
                }

                const currentSession = (await supabase.auth.getSession()).data.session
                if (!currentSession) throw new Error("No active session")

                console.log("Exchanging code with token...")

                const response = await fetch("/api/youtube/auth-callback", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${currentSession.access_token}`
                    },
                    body: JSON.stringify({ code, state }),
                })

                const data = await response.json()

                if (response.status === 409 && data.conflict) {
                    setStatus('conflict')
                    setErrorMessage(data.error)
                    setConflictData({ channelTitle: data.channelTitle })
                    return
                }

                if (!response.ok) {
                    throw new Error(data.error || "Failed to exchange token")
                }

                setStatus('success')
                toast.success("Channel Monitor Connected!", {
                    description: `Successfully connected to ${data.channelTitle || 'your channel'}`
                })

                // Check if onboarding is complete
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("onboarding_completed")
                    .eq("id", (await supabase.auth.getUser()).data.user?.id)
                    .single()

                // Redirect after short delay
                setTimeout(() => {
                    if (profile && !profile.onboarding_completed) {
                        window.location.href = "/setup"
                    } else {
                        window.location.href = "/dashboard"
                    }
                }, 2000)

            } catch (err: any) {
                console.error("Auth callback error:", err)
                setStatus('error')
                setErrorMessage(err.message || "An unexpected error occurred.")
            }
        }

        exchangeCode()
    }, [searchParams, router, refreshChannel])

    const handleForceClaim = async () => {
        try {
            const currentSession = (await supabase.auth.getSession()).data.session
            if (!currentSession) {
                toast.error("Authentication lost. Please reload properly.")
                return
            }

            setStatus('loading')
            const response = await fetch('/api/youtube/connect?force=true', {
                headers: {
                    "Authorization": `Bearer ${currentSession.access_token}`
                }
            })
            const data = await response.json()

            if (response.status === 401) {
                toast.error("Session expired. Please log in again.")
                return
            }

            if (data.authUrl) {
                window.location.href = data.authUrl
            } else {
                toast.error("Failed to start connection process.")
            }
        } catch (e) {
            console.error(e)
            toast.error("An error occurred starting the claim process.")
        }
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center p-4">
            <Card className="w-full max-w-md border-border/50 bg-background/60 backdrop-blur-xl shadow-xl">
                <CardContent className="pt-6 flex flex-col items-center text-center gap-4">

                    {status === 'loading' && (
                        <>
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold">Connecting Channel...</h2>
                                <p className="text-sm text-muted-foreground">
                                    Finalizing secure connection with YouTube.
                                </p>
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                                <CheckCircle2 className="h-8 w-8 text-green-500 animate-in zoom-in duration-300" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold text-green-600">Success!</h2>
                                <p className="text-sm text-muted-foreground">
                                    Your channel has been connected. Redirecting...
                                </p>
                            </div>
                        </>
                    )}

                    {status === 'conflict' && (
                        <>
                            <div className="h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
                                <AlertCircle className="h-8 w-8 text-yellow-600" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold text-yellow-600">Channel Already Connected</h2>
                                <p className="text-sm text-muted-foreground">
                                    The channel <strong>{conflictData?.channelTitle}</strong> is already connected to another account.
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Do you want to disconnect it from the other account and connect it here?
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 w-full mt-4">
                                <Button
                                    variant="default"
                                    onClick={handleForceClaim}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                    Yes, Claim Channel
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => router.push('/dashboard')}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold text-destructive">Connection Failed</h2>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                    {errorMessage}
                                </p>
                                {errorMessage.toLowerCase().includes('quota') && (
                                    <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded border border-border/50">
                                        Tip: You can proceed to the dashboard and add your own YouTube API Key in Settings to avoid this limit.
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 w-full mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/connect-channel')}
                                >
                                    Try Again
                                </Button>
                                {errorMessage.toLowerCase().includes('quota') && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => window.location.href = "/dashboard"}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        Skip for Now
                                    </Button>
                                )}
                            </div>
                        </>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}
