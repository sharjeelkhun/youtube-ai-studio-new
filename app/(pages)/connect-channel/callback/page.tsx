"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { isPreviewEnvironment } from "@/lib/db"
import { youtubeService } from "@/lib/youtube-service"

export default function YouTubeCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const isPreview = isPreviewEnvironment()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user && !isPreview) {
      router.push("/login?redirect=/connect-channel")
      return
    }

    // Check if this is a preview mode callback
    const isPreviewCallback = searchParams.get("preview") === "true"

    // In preview mode or preview callback, simulate success after a short delay
    if (isPreview || isPreviewCallback) {
      simulateCallbackSteps()
      return
    }

    async function handleCallback() {
      try {
        const code = searchParams.get("code")
        const error = searchParams.get("error")
        const state = searchParams.get("state")

        // Verify state parameter
        const savedState = localStorage.getItem("youtube_auth_state")
        localStorage.removeItem("youtube_auth_state") // Clear it after use

        if (state && savedState && state !== savedState) {
          setStatus("error")
          setErrorMessage("Invalid state parameter. This could be a security issue.")
          return
        }

        if (error) {
          setStatus("error")
          setErrorMessage(error)
          return
        }

        if (!code) {
          setStatus("error")
          setErrorMessage("No authorization code received")
          return
        }

        // Exchange the code for tokens
        const exchangeResult = await youtubeService.exchangeCodeForTokens(code)

        if (!exchangeResult.success) {
          setStatus("error")
          setErrorMessage(exchangeResult.error || "Failed to connect channel")
          return
        }

        setStatus("success")
        toast({
          title: "Channel connected!",
          description: "Your YouTube channel has been connected successfully.",
        })

        // Wait a moment before redirecting
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } catch (error: any) {
        console.error("Error during callback:", error)
        setStatus("error")
        setErrorMessage(error.message || "An unknown error occurred")
      }
    }

    if (user && !isPreview && !isPreviewCallback) {
      handleCallback()
    }
  }, [searchParams, router, user, isLoading, toast, isPreview])

  // Simulate callback steps for preview mode
  async function simulateCallbackSteps() {
    await new Promise(resolve => setTimeout(resolve, 1500))
    setStatus("success")
    toast({
      title: "Preview Mode",
      description: "YouTube channel connection simulated successfully.",
    })
    setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Connecting YouTube Channel..."}
            {status === "success" && "YouTube Channel Connected"}
            {status === "error" && "Connection Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we connect to your YouTube channel."}
            {status === "success" && "Your YouTube channel has been connected successfully."}
            {status === "error" && "We encountered an error connecting your YouTube channel."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === "loading" && (
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </div>
          )}

          {status === "success" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Check className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                You can now access your YouTube analytics, manage videos, and get AI-powered recommendations.
              </p>
              <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-300" />
              </div>
              <p className="text-center text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
              <Button onClick={() => router.push("/connect-channel")}>Try Again</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
