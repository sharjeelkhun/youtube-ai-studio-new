"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Youtube, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isPreviewEnvironment, db } from "@/lib/db"

export default function ConnectChannel() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading } = useAuth()
  const isPreview = isPreviewEnvironment()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user && !isPreview) {
      router.push("/login")
    }

    // Check if user already has a connected channel
    const checkExistingChannel = async () => {
      if (!user && !isPreview) return

      try {
        const channelData = await db.channels.getByUserId(isPreview ? "preview-user-id" : user?.id || "")

        if (channelData) {
          toast({
            title: "Channel Already Connected",
            description: "You already have a connected YouTube channel. Redirecting to dashboard.",
          })

          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
        }
      } catch (err) {
        console.error("Error checking existing channel:", err)
      }
    }

    checkExistingChannel()
  }, [user, isLoading, router, toast, isPreview])

  async function connectYouTubeChannel() {
    setIsConnecting(true)
    setError(null)
    setDebugInfo(null)

    try {
      if (isPreview) {
        // In preview mode, simulate connection and redirect to dashboard
        toast({
          title: "Preview Mode",
          description: "YouTube channel connection simulated successfully.",
        })

        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
        return
      }

      // Get the authorization URL from our API
      const response = await fetch("/api/youtube/connect")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate YouTube connection")
      }

      if (data.authUrl) {
        // Save state to localStorage for verification
        if (data.state) {
          localStorage.setItem("youtube_auth_state", data.state)
        }

        // Redirect to the Google OAuth consent screen
        window.location.href = data.authUrl
      } else {
        throw new Error(data.error || "Failed to initiate YouTube connection")
      }
    } catch (error: any) {
      console.error("Error connecting YouTube channel:", error)
      setError(error.message || "Something went wrong. Please try again later.")

      // Collect debug info
      try {
        const debugResponse = await fetch("/api/debug/youtube-connect")
        const debugData = await debugResponse.json()
        setDebugInfo(debugData)
      } catch (debugError) {
        console.error("Error fetching debug info:", debugError)
      }

      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.message || "Something went wrong. Please try again later.",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  if (isLoading && !isPreview) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Connect YouTube Channel</CardTitle>
          <CardDescription>Connect your YouTube channel to get analytics and insights</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <Youtube className="h-8 w-8 text-red-600 dark:text-red-300" />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By connecting your YouTube channel, you will be able to see analytics, manage videos, and get
              recommendations.
            </p>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {debugInfo && (
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-2 text-sm font-medium">Debug Information:</p>
                <pre className="max-h-40 overflow-auto rounded-md bg-gray-100 p-2 text-xs dark:bg-gray-700">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" onClick={connectYouTubeChannel} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect YouTube Channel"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
            Skip for now
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
