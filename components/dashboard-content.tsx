"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "@/components/tabs/overview-tab"
import { useRouter, useSearchParams } from "next/navigation"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Youtube, ArrowRight, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function DashboardContent() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams?.get('tab') as string) || 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)
  const router = useRouter()
  const { isConnected, channelData, isLoading: isChannelLoading } = useYouTubeChannel()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Navigate to the appropriate page for non-overview tabs
    if (value !== "overview") {
      router.push(`/dashboard/${value}`)
    }
    // Keep tab in the URL when staying on /dashboard
    if (value === 'overview') {
      const params = new URLSearchParams(window.location.search)
      params.set('tab', value)
      const query = params.toString()
      router.replace(`/dashboard${query ? `?${query}` : ''}`)
    }
  }

  // If auth is still loading, show a loading state
  if (isAuthLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user is not authenticated, redirect to login
  useEffect(() => {
    setIsAuthenticated(!!user) // Set authentication status
    if (!isAuthLoading && !user) {
      router.push("/login?redirectTo=/dashboard")
    }
  }, [user, isAuthLoading, router])

  if (!isAuthenticated) {
    return null // Or a loading indicator if preferred
  }

  // If channel data is still loading, show a loading state
  if (isChannelLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Sync tab from URL if it changes
  useEffect(() => {
    const tab = (searchParams?.get('tab') as string) || 'overview'
    if (tab !== activeTab) setActiveTab(tab)
  }, [searchParams])

  // If no channel is connected, show a connection prompt
  if (!isConnected || !channelData) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

        <Card className="border-2 border-dashed border-muted-foreground/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              Connect Your YouTube Channel
            </CardTitle>
            <CardDescription>
              Connect your YouTube channel to see personalized analytics and AI-powered recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 mb-6">
              <Youtube className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">No YouTube Channel Connected</h3>
            <p className="text-center text-muted-foreground max-w-md mb-6">
              Connect your YouTube channel to unlock personalized analytics, content suggestions, and optimization
              tools.
            </p>
            <Button
              onClick={() => router.push("/connect-channel")}
              className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
            >
              Connect YouTube Channel
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/20 py-4">
            <p className="text-sm text-muted-foreground">
              Your data is secure and we only request read-only access to your channel.
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>
      </div>

        <div className="flex items-center gap-3 px-2 py-1 bg-muted/30 rounded-md">
          <div className="relative h-8 w-8 overflow-hidden rounded-full border">
            <img
              src={channelData.thumbnail || "/placeholder.svg"}
              alt={channelData.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{channelData.title}</span>
            <span className="text-xs text-muted-foreground">
              {(channelData.subscriber_count ?? 0).toLocaleString()} subscribers • {(channelData.video_count ?? 0).toLocaleString()} videos
            </span>
          </div>
        </div>

      <TabsContent value="overview" className="space-y-4">
        <OverviewTab />
      </TabsContent>

      {/* Other tabs are now handled by their respective pages */}
    </Tabs>
  )
}
