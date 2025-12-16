"use client"

import type React from "react"
import { DashboardProvider } from "@/components/dashboard-provider"
import { DashboardSidebar as Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { AIProviderSwitcher } from "@/components/ai-provider-switcher"
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

export default function SettingsLayout({
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!session?.user) {
        return null
    }

    return (
        <DashboardProvider>
            <div className="flex h-screen w-full overflow-hidden">
                <AppSidebar>
                    <Sidebar />
                </AppSidebar>
                <SidebarInset className="overflow-hidden">
                    <div className="flex flex-1 flex-col h-full overflow-hidden">
                        <TopBar />
                        <main className="flex-1 overflow-y-auto bg-muted/40">
                            {children}
                        </main>
                    </div>
                    <Toaster position="bottom-center" richColors />
                    <AIProviderSwitcher />
                </SidebarInset>
            </div>
        </DashboardProvider>
    )
}
