"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "@/components/dashboard/overview-tab"
import { AnalyticsTab } from "@/components/dashboard/analytics-tab"
import { VideosTab } from "@/components/dashboard/videos-tab"
import { CommentsTab } from "@/components/dashboard/comments-tab"
import { TopBar } from "@/components/dashboard/top-bar"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase" // Use our custom Supabase client

// Check if we're in a preview environment
const isPreviewEnvironment = () => {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    (typeof window !== "undefined" &&
      (window.location.hostname === "v0.dev" || window.location.hostname.includes("lite.vusercontent.net")))
  )
}

// Mock channel data for preview mode
const mockChannelData = {
  id: "UC123456789",
  user_id: "preview-user-id",
  title: "Demo YouTube Channel",
  description: "This is a demo YouTube channel for preview mode",
  subscribers: 10500,
  videos: 42,
  thumbnail: "https://via.placeholder.com/150",
  created_at: new Date().toISOString(),
  last_updated: new Date().toISOString(),
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [hasChannel, setHasChannel] = useState(false)
  const [channelData, setChannelData] = useState(null)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    // Check if we're in preview mode
    setIsPreview(isPreviewEnvironment())

    // In preview mode, set mock data and skip authentication check
    if (isPreviewEnvironment()) {
      setHasChannel(true)
      setChannelData(mockChannelData)
      setIsLoading(false)
      return
    }

    // Check if user is authenticated
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    async function fetchChannelData() {
      try {
        setIsLoading(true)

        // Check if the user has a connected YouTube channel
        const { data: channels, error } = await supabase
          .from("youtube_channels")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(1)

        if (error) {
          console.error("Error fetching channel data:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch channel data",
          })
          return
        }

        if (channels && channels.length > 0) {
          setHasChannel(true)
          setChannelData(channels[0])
        } else {
          setHasChannel(false)
        }
      } catch (error) {
        console.error("Error in fetchChannelData:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchChannelData()
    }
  }, [user, authLoading, router, toast])

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  // If no channel is connected, suggest connecting one
  if (!hasChannel && !isPreview) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <TopBar />
        <div className="container mx-auto flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Connect Your YouTube Channel</CardTitle>
              <CardDescription>
                To access analytics and insights, you need to connect your YouTube channel
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <button
                className="w-full rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                onClick={() => router.push("/connect-channel")}
              >
                Connect YouTube Channel
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <TopBar channelData={channelData} />
      <div className="container mx-auto p-4">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab channelData={channelData} />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab channelData={channelData} />
          </TabsContent>
          <TabsContent value="videos">
            <VideosTab channelData={channelData} />
          </TabsContent>
          <TabsContent value="comments">
            <CommentsTab channelData={channelData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
