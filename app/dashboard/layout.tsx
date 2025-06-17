'use client';

import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { YouTubeChannelProvider } from "@/contexts/youtube-channel-context"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useSession } from "@/contexts/session-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session?.user) {
      console.log('Dashboard Layout - No session, redirecting to login');
      router.replace('/login');
    }
  }, [session, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!session?.user) {
    return null;
  }

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
  );
}
