"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Youtube, AlertCircle, Check, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"

export function IntegrationsSettings() {
  const router = useRouter()
  const { channelData, isLoading, isConnected, refreshChannel } = useYouTubeChannel()

  const handleConnectYouTube = () => {
    router.push("/connect-channel")
  }

  const handleDisconnectYouTube = async () => {
    try {
      // TODO: Implement disconnect functionality
      toast.warning("Disconnect feature", {
        description: "Disconnect functionality will be implemented soon.",
      })
    } catch (error) {
      console.error("Error disconnecting YouTube:", error)
    }
  }

  const handleSyncChannel = async () => {
    try {
      await refreshChannel()
      toast.success("Channel synced", {
        description: "Your channel data has been refreshed.",
      })
    } catch (error) {
      console.error("Error syncing channel:", error)
      toast.error("Error", {
        description: "Failed to sync channel data.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <Youtube className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <CardTitle>YouTube</CardTitle>
                <CardDescription>Connect your YouTube channel for analytics and AI suggestions</CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? "default" : "outline"} className={isConnected ? "bg-green-500" : ""}>
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[100px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isConnected && channelData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border">
                  <img
                    src={channelData.thumbnail || "/placeholder.svg"}
                    alt={channelData.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{channelData.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(channelData.subscriber_count ?? 0).toLocaleString()} subscribers
                  </p>
                  <p className="text-sm text-muted-foreground">{(channelData.video_count ?? 0).toLocaleString()} videos</p>
                </div>
              </div>

              <div className="rounded-lg border bg-card/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last synced:</span>
                  <span className="text-sm">{new Date(channelData.updated_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">All features enabled with this connection</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>YouTube channel not connected</AlertTitle>
                <AlertDescription>
                  Connect your YouTube channel to unlock AI-powered analytics and content suggestions.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border bg-card/50 p-4">
                <h3 className="font-medium">Benefits of connecting:</h3>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span className="text-sm">Get personalized content recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span className="text-sm">Analyze your video performance with detailed metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span className="text-sm">Optimize your content strategy with AI suggestions</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          {isConnected ? (
            <>
              <Button variant="outline" onClick={handleDisconnectYouTube} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Disconnect
              </Button>
              <Button onClick={handleSyncChannel} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Refresh Data
              </Button>
            </>
          ) : (
            <Button
              onClick={handleConnectYouTube}
              disabled={isLoading}
              className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Youtube className="mr-2 h-4 w-4" />}
              Connect YouTube Channel
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Other integration cards remain the same */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-500" fill="currentColor">
                  <path d="M22.258 1.33c-1.307-.782-2.942.278-2.942 1.866v2.898a1.2 1.2 0 0 1-1.2 1.2H1.2a1.2 1.2 0 0 0-1.2 1.2v6.746a1.2 1.2 0 0 0 1.2 1.2h16.916a1.2 1.2 0 0 1 1.2 1.2v2.898c0 1.588 1.635 2.648 2.942 1.866l13.958-8.36a2.4 2.4 0 0 0 0-4.096L22.258 1.33z" />
                </svg>
              </div>
              <div>
                <CardTitle>Google Analytics</CardTitle>
                <CardDescription>Connect Google Analytics for website traffic insights</CardDescription>
              </div>
            </div>
            <Badge variant="outline">Not Connected</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Google Analytics not connected</AlertTitle>
            <AlertDescription>
              Connect Google Analytics to track website performance and user behavior.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect Google Analytics
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-purple-500" fill="currentColor">
                  <path d="M19.54 0c1.356 0 2.46 1.104 2.46 2.472v21.528l-2.58-2.28-1.452-1.344-1.536-1.428.636 2.22h-13.608c-1.356 0-2.46-1.104-2.46-2.472v-16.224c0-1.368 1.104-2.472 2.46-2.472h16.08zm-4.632 15.672c2.652-.084 3.672-1.824 3.672-1.824 0-3.864-1.728-6.996-1.728-6.996-1.728-1.296-3.372-1.26-3.372-1.26l-.168.192c2.04.624 2.988 1.524 2.988 1.524-1.248-.684-2.472-1.02-3.612-1.152-.864-.096-1.692-.072-2.424.024l-.204.024c-.42.036-1.44.192-2.724.756-.444.204-.708.348-.708.348s.996-.948 3.156-1.572l-.12-.144s-1.644-.036-3.372 1.26c0 0-1.728 3.132-1.728 6.996 0 0 1.008 1.74 3.66 1.824 0 0 .444-.54.804-.996-1.524-.456-2.1-1.416-2.1-1.416l.336.204.048.036.047.027.014.006.047.027c.3.168.6.3.876.408.492.192 1.08.384 1.764.516.9.168 1.956.228 3.108.012.564-.096 1.14-.264 1.74-.516.42-.156.888-.384 1.38-.708 0 0-.6.984-2.172 1.428.36.456.792.972.792.972zm-5.58-5.604c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332.012-.732-.54-1.332-1.224-1.332zm4.38 0c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332 0-.732-.54-1.332-1.224-1.332z" />
                </svg>
              </div>
              <div>
                <CardTitle>Discord</CardTitle>
                <CardDescription>Connect Discord for community notifications</CardDescription>
              </div>
            </div>
            <Badge variant="outline">Not Connected</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Discord not connected</AlertTitle>
            <AlertDescription>
              Connect Discord to receive notifications and engage with your community.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect Discord
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
