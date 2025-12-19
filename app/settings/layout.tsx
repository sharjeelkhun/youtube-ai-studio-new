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
import { useSubscription } from "@/contexts/subscription-context"
import { useRouter } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { MobileNav } from "@/components/mobile-nav"

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { session, isLoading: sessionLoading } = useSession()
    const { isCheckoutRequired, isLoading: subLoading } = useSubscription()
    const router = useRouter()
    const isMobile = useMobile()

    const isLoading = sessionLoading || subLoading

    useEffect(() => {
        if (!sessionLoading && !session?.user) {
            router.replace("/login")
        }
    }, [session, sessionLoading, router])

    // Redirect if checkout is required
    useEffect(() => {
        if (!isLoading && isCheckoutRequired) {
            router.push("/dashboard")
        }
    }, [isCheckoutRequired, isLoading, router])

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
                    <AIProviderSwitcher />
                </SidebarInset>
            </div>
            <MobileNav />
        </DashboardProvider>
    )
}
