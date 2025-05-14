"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Youtube } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export default function ConnectChannel() {
  const [isConnecting, setIsConnecting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  async function connectYouTubeChannel() {
    setIsConnecting(true)

    try {
      // Get the authorization URL from our API
      const response = await fetch("/api/youtube/connect")
      const data = await response.json()

      if (data.authUrl) {
        // Redirect to the Google OAuth consent screen
        window.location.href = data.authUrl
      } else {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: data.error || "Failed to initiate YouTube connection",
        })
      }
    } catch (error) {
      console.error("Error connecting YouTube channel:", error)
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Something went wrong. Please try again later.",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  if (isLoading) {
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
