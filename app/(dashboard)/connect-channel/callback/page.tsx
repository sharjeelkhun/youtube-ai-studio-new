"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"

export default function ConnectionCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [errorMessage, setErrorMessage] = useState("")
    const hasProcessed = useRef(false)
    const { refreshChannel } = useYouTubeChannel()

    useEffect(() => {
        const code = searchParams.get("code")
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
                const response = await fetch("/api/youtube/auth-callback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || "Failed to exchange token")
                }

                setStatus('success')
                toast.success("Channel Monitor Connected!", {
                    description: `Successfully connected to ${data.channelTitle || 'your channel'}`
                })

                // Refresh context data
                await refreshChannel()

                // Redirect after short delay
                setTimeout(() => {
                    router.push("/dashboard")
                }, 2000)

            } catch (err: any) {
                console.error("Auth callback error:", err)
                setStatus('error')
                setErrorMessage(err.message || "An unexpected error occurred.")
            }
        }

        exchangeCode()
    }, [searchParams, router, refreshChannel])

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
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/connect-channel')}
                                className="mt-4"
                            >
                                Try Again
                            </Button>
                        </>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}
