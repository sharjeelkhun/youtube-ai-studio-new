"use client"

import type React from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import {
    Sidebar as AppSidebar,
    SidebarInset,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { DashboardProvider } from "@/components/dashboard-provider"

export function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DashboardProvider>
            <div className="flex h-screen w-full overflow-hidden text-foreground">
                <AppSidebar>
                    <AdminSidebar />
                </AppSidebar>
                <SidebarInset className="overflow-hidden">
                    <div className="flex flex-1 flex-col h-full overflow-hidden">
                        <TopBar />
                        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8">
                            <div className="w-full max-w-7xl mx-auto">
                                {children}
                            </div>
                        </main>
                    </div>
                    <Toaster />
                </SidebarInset>
            </div>
        </DashboardProvider>
    )
}
