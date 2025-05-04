"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConnectChannelPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  // Function to initiate OAuth flow
  const connectYouTube = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, this would redirect to the YouTube OAuth flow
      // For preview purposes, we'll just simulate success
      setTimeout(() => {
        setSuccess("YouTube channel connected successfully!")

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }, 1500)
    } catch (error: any) {
      console.error("Error initiating OAuth:", error)
      setError(error.message || "Failed to start YouTube connection")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to set up the database
  const setupDatabase = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, this would set up the database
      // For preview purposes, we'll just simulate success
      setTimeout(() => {
        setSuccess("Database setup completed successfully!")

        // Clear success message after a short delay
        setTimeout(() => {
          setSuccess(null)
        }, 2000)
      }, 1500)
    } catch (error: any) {
      console.error("Error setting up database:", error)
      setError(error.message || "Failed to set up database")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Connect YouTube Channel</CardTitle>
          <CardDescription>Connect your YouTube channel to see analytics and manage your content</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Before connecting your YouTube channel, you need to set up the database to store your channel data.
            </p>

            <Button onClick={setupDatabase} disabled={isLoading} className="w-full" variant="outline">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Setup Database"
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50 px-2 text-sm text-muted-foreground">Then</span>
              </div>
            </div>

            <Button onClick={connectYouTube} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect with YouTube"
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground">
            Your data is secure and we only request read-only access to your channel.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
