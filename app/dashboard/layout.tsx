import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { YouTubeChannelProvider } from "@/contexts/youtube-channel-context"
import { TooltipProvider } from "@/components/ui/tooltip"
import { createServerClient } from "@/lib/supabase-server"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "YouTube AI Studio Dashboard",
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Check if we're in a preview environment
  const isPreview = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // For non-preview, check server-side auth
  if (!isPreview) {
    const supabase = createServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      // Not authenticated, redirect to login
      redirect("/login")
    }
  }

  // For preview, we rely on the middleware and client-side auth check

  return (
    <YouTubeChannelProvider>
      <TooltipProvider>
        <div className="flex min-h-screen flex-col">
          <TopBar />
          <div className="flex flex-1">
            <Sidebar className="" />
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              <div className="container mx-auto py-6">{children}</div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    </YouTubeChannelProvider>
  )
}
