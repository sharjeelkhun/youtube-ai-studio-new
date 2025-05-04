"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const error = searchParams.get("error")

      if (error) {
        setStatus("error")
        setError(`Google OAuth error: ${error}`)
        return
      }

      if (!code) {
        setStatus("error")
        setError("No authorization code received")
        return
      }

      try {
        // Exchange the code for tokens
        const response = await fetch("/api/youtube/auth-callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to exchange code for tokens")
        }

        setStatus("success")

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } catch (error: any) {
        console.error("Error handling OAuth callback:", error)
        setStatus("error")
        setError(error.message || "Failed to connect YouTube channel")
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h1 className="text-2xl font-bold">Connecting your YouTube channel...</h1>
          <p className="text-muted-foreground">Please wait while we complete the connection process.</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-green-100 p-3">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">YouTube channel connected!</h1>
          <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
        </div>
      )}

      {status === "error" && (
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Connection Failed</AlertTitle>
          <AlertDescription>
            {error || "An error occurred while connecting your YouTube channel."}
            <div className="mt-4">
              <button onClick={() => router.push("/connect-channel")} className="text-sm font-medium underline">
                Try again
              </button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
