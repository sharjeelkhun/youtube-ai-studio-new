"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Youtube, AlertCircle, Check, ExternalLink, Loader2, BarChart, MessageSquare, RefreshCw, Unplug, ArrowRight, Save, Info, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { useProfile } from "@/contexts/profile-context"
import { cn } from "@/lib/utils"

export function IntegrationsSettings() {
  const router = useRouter()
  const { channelData, isLoading: channelLoading, isConnected, refreshChannel } = useYouTubeChannel()
  const { profile, updateProfile, loading: profileLoading } = useProfile()
  const [youtubeApiKey, setYoutubeApiKey] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setYoutubeApiKey(profile?.youtube_api_key || "")
  }, [profile?.youtube_api_key])

  const handleConnectYouTube = () => {
    router.push("/connect-channel")
  }

  const handleDisconnectYouTube = async () => {
    try {
      const response = await fetch('/api/youtube/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect');
      }

      toast.success("YouTube channel disconnected", {
        description: "Your YouTube channel has been successfully disconnected.",
      });

      // Refresh the channel data to update the UI
      await refreshChannel();
    } catch (error) {
      console.error("Error disconnecting YouTube:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
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

  const handleSaveYoutubeKey = async () => {
    setIsSaving(true)
    try {
      await updateProfile({
        youtube_api_key: youtubeApiKey
      })
      toast.success("YouTube API settings saved successfully!")
    } catch (error) {
      toast.error("Failed to save YouTube API settings.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUseGeminiKeyForYoutube = () => {
    const geminiKey = profile?.ai_settings?.apiKeys?.gemini
    if (geminiKey) {
      setYoutubeApiKey(geminiKey)
      toast.success("Using Gemini key for YouTube!")
    } else {
      toast.error("No Gemini API key found in your AI settings.")
    }
  }

  const isLoading = channelLoading || profileLoading
  const hasGeminiKey = !!profile?.ai_settings?.apiKeys?.gemini

  return (
    <div className="space-y-8">
      {/* YouTube Hero Card */}
      <div className="relative group">
        <div className={cn(
          "absolute -inset-0.5 rounded-3xl opacity-20 blur transition duration-500 group-hover:opacity-40",
          isConnected ? "bg-gradient-to-br from-red-600 to-red-900" : "bg-gradient-to-br from-gray-600 to-gray-900"
        )}></div>

        <Card className="relative border-border/50 bg-background/60 backdrop-blur-xl shadow-sm overflow-hidden">
          {isConnected && (
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
              <Youtube className="w-64 h-64 text-red-500 -rotate-12 transform translate-x-20 -translate-y-20" />
            </div>
          )}

          <CardHeader className="relative z-10 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner",
                  isConnected ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"
                )}>
                  <Youtube className="h-7 w-7" />
                </div>
                <div>
                  <CardTitle className="text-xl">YouTube Channel</CardTitle>
                  <CardDescription>Primary integration for content management and analytics</CardDescription>
                </div>
              </div>
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={cn("px-3 py-1 capitalize", isConnected ? "bg-red-500 hover:bg-red-600" : "bg-muted hover:bg-muted text-muted-foreground")}
              >
                {isConnected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 pt-6">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center rounded-xl bg-muted/20 border border-dashed border-border/50">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Syncing channel data...</span>
                </div>
              </div>
            ) : isConnected && channelData ? (
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-background/40 border border-white/5 backdrop-blur-md">
                    <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-border/50">
                      <img
                        src={channelData.thumbnail || "/placeholder.svg"}
                        alt={channelData.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{channelData.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span>{(channelData.subscriber_count ?? 0).toLocaleString()} subscribers</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>{(channelData.video_count ?? 0).toLocaleString()} videos</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sync Status</p>
                        <p className="text-sm font-medium text-green-600">Active</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <RefreshCw className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Synced</p>
                        <p className="text-sm font-medium">
                          {channelData.last_synced ? new Date(channelData.last_synced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col gap-2 min-w-[200px]">
                  <Button onClick={handleSyncChannel} variant="outline" className="w-full justify-start h-10 border-border/50 hover:bg-muted/50">
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
                  </Button>
                  <Button onClick={handleDisconnectYouTube} variant="outline" className="w-full justify-start h-10 border-red-200/20 text-red-500 hover:text-red-600 hover:bg-red-500/5">
                    <Unplug className="h-4 w-4 mr-2" /> Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-muted/30 border border-dashed border-border/60 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                    <Youtube className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">Connect your Channel</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Unlock full AI analytics, content suggestions, and automated SEO tools by connecting your channel.
                    </p>
                  </div>
                  <Button
                    onClick={handleConnectYouTube}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Youtube className="mr-2 h-4 w-4" />}
                    Connect Channel
                  </Button>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    "Personalized AI Recommendations",
                    "Deep Analytics & Insights",
                    "Automated SEO Optimization"
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-md hover:bg-background/70">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2 text-xl font-bold">
            YouTube API Configuration
          </div>
          <CardDescription>
            The system automatically reuses your Google Gemini key for YouTube to avoid quota limits.
            You only need to provide a separate key if you're using a different provider (like OpenAI).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 mb-2">
            <p className="text-sm text-red-600 dark:text-red-400 flex gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Using your own key increases your daily quota to 10,000 requests, which is plenty for personal use.
              </span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-api-key" className="text-sm font-medium">YouTube API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="youtube-api-key"
                  type="password"
                  placeholder="AIza..."
                  value={youtubeApiKey}
                  onChange={(e) => setYoutubeApiKey(e.target.value)}
                  className="bg-background/80"
                />
                {hasGeminiKey && youtubeApiKey !== profile?.ai_settings?.apiKeys?.gemini && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseGeminiKeyForYoutube}
                    className="shrink-0"
                  >
                    Use Gemini Key
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                <p className="text-xs text-muted-foreground">
                  Get your key from the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a>.
                </p>
                <p className="text-[10px] text-muted-foreground opacity-70">
                  Note: Ensure "YouTube Data API v3" is enabled in your Google Cloud Project.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-2 pb-6 px-6 border-t border-border/50">
          <Button onClick={handleSaveYoutubeKey} disabled={isSaving || profileLoading} className="shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
            {isSaving || profileLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save YouTube Key
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Secondary Integrations Grid */}
      <h3 className="text-lg font-semibold flex items-center gap-2 px-1">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Other Integrations
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Google Analytics */}
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <BarChart className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">Google Analytics</CardTitle>
                  <CardDescription className="text-xs">Website traffic & conversion tracking</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-background/50">Not Connected</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-sm text-muted-foreground p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 flex gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <p>Connect GA4 properties to track how your YouTube content drives website traffic.</p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" className="w-full justify-between hover:bg-muted/50 group">
              Connect Account
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardFooter>
        </Card>

        {/* Discord */}
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">Discord Community</CardTitle>
                  <CardDescription className="text-xs">Community notifications & hooks</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-background/50">Not Connected</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-sm text-muted-foreground p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex gap-2">
              <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <p>Link your server to receive real-time alerts for new video comments and milestones.</p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" className="w-full justify-between hover:bg-muted/50 group">
              Connect Server
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
