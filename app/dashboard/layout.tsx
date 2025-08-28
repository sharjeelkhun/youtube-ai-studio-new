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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <main className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
          <Toaster />
        </SidebarInset>
      </div>
    </DashboardProvider>
  )
}
