"use client"

import type React from "react"
import { DashboardProvider } from "@/components/dashboard-provider"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import {
  Sidebar as AppSidebar,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { useSession } from "@/contexts/session-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.replace("/login")
    }
  }, [session, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex h-full w-full flex-col">
          <div className="border-b">
            <div className="flex h-16 items-center px-4">
              <div className="flex-1">
                <Skeleton className="h-5 w-[200px]" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex flex-1">
            <div className="hidden h-full w-64 border-r md:block">
              <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                  <Skeleton className="h-4 w-20" />
                  <div className="mt-4 space-y-1">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </div>
            </div>
            <main className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-
900 md:p-6 lg:p-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </main>
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
      <div className="flex min-h-screen w-full">
        <AppSidebar>
          <Sidebar />
        </AppSidebar>
        <SidebarInset>
          <div className="flex flex-1 flex-col">
            <TopBar />
            <main className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-
900 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
          <Toaster />
        </SidebarInset>
      </div>
    </DashboardProvider>
  )
}
