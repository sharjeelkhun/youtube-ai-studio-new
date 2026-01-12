"use client"

import type React from "react"
import { DashboardProvider } from "@/components/dashboard-provider"
import { DashboardSidebar as Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"

import { MobileNav } from "@/components/mobile-nav"
import {
  Sidebar as AppSidebar,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { useSubscription } from "@/contexts/subscription-context"
import { useSession } from "@/contexts/session-context"
import { useRouter } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, isLoading: sessionLoading } = useSession()
  const { isCheckoutRequired, isLoading: subLoading } = useSubscription()
  const routerInstance = useRouter()
  const isMobile = useMobile()

  const isLoading = sessionLoading || subLoading

  useEffect(() => {
    // Determine if we are on a public path that doesn't strictly require auth (like callbacks being processed)
    // although callback IS inside dashboard layout...

    if (!sessionLoading && !session?.user) {
      console.log('[DashboardLayout] No session found, redirecting to login');
      routerInstance.replace("/login")
    }
  }, [session, sessionLoading, routerInstance])

  // Redirect if checkout is required and we're not on the main dashboard
  useEffect(() => {
    if (!isLoading && isCheckoutRequired) {
      if (window.location.pathname !== '/dashboard') {
        routerInstance.push("/dashboard")
      }
    }
  }, [isCheckoutRequired, isLoading, routerInstance])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-[200px] w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <DashboardProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {!isMobile && (
          <AppSidebar>
            <Sidebar />
          </AppSidebar>
        )}
        <SidebarInset className="overflow-hidden">
          <div className="flex flex-1 flex-col h-full overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
              {children}
            </main>
          </div>
          <Toaster position="bottom-center" richColors />

        </SidebarInset>
      </div>
      <MobileNav />
    </DashboardProvider>
  )
}
