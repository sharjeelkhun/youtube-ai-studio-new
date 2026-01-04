"use client"

import type React from "react"
import { DashboardProvider } from "@/components/dashboard-provider"
import { DashboardSidebar as Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import {
  Sidebar as AppSidebar,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { useSession } from "@/contexts/session-context"
import { useSubscription } from "@/contexts/subscription-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { MobileNav } from "@/components/mobile-nav"
import { useMobile } from "@/hooks/use-mobile"
import { AdsBanner } from "@/components/ads-banner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, isLoading: sessionLoading } = useSession()
  const { isCheckoutRequired, isLoading: subLoading } = useSubscription()
  const router = useRouter()
  const isMobile = useMobile()

  // Don't show loading if checkout is required - let the page show checkout card
  const isLoading = sessionLoading || (subLoading && !isCheckoutRequired)

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace("/login")
    }
  }, [session, sessionLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full">
        <div className="hidden w-64 border-r border-gray-200 bg-white md:flex flex-col">
          <div className="space-y-4 py-4">
            <div className="px-3 py-2">
              <Skeleton className="h-4 w-20" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="border-b border-gray-200 bg-white">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <Skeleton className="h-5 w-[200px]" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <DashboardProvider>
      <div className="flex h-screen w-full overflow-hidden text-foreground">
        {!isMobile && (
          <AppSidebar>
            <Sidebar />
          </AppSidebar>
        )}
        <SidebarInset className="overflow-hidden">
          <div className="flex flex-1 flex-col h-full overflow-hidden">
            <TopBar />
            {!subLoading && <AdsBanner position="top" className="sticky top-16 z-10" />}
            <main className={`flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8 ${isCheckoutRequired ? 'flex items-center justify-center' : ''}`}>
              <div className={isCheckoutRequired ? 'w-full max-w-4xl' : ''}>
                {children}
              </div>
            </main>
          </div>
          <Toaster />
        </SidebarInset>
      </div>
      <MobileNav />
    </DashboardProvider>
  )
}
