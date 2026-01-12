"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { YoutubeConnectionStatus } from "@/components/youtube-connection-status"
import {
    LayoutDashboard,
    Video,
    BarChart,
    Settings,
    Sparkles,
    MessageSquare,
    TrendingUp,
    Lightbulb,
    Youtube,
} from "lucide-react"

export function DashboardSidebar() {
    const pathname = usePathname()
    const { isConnected, isLoading } = useYouTubeChannel()

    const menuItems = [
        {
            href: "/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            href: "/videos",
            label: "Videos",
            icon: Video,
        },
        {
            href: "/comments",
            label: "Comments",
            icon: MessageSquare,
        },
        {
            href: "/analytics",
            label: "Analytics",
            icon: BarChart,
        },
        {
            href: "/seo",
            label: "SEO",
            icon: TrendingUp,
        },
        {
            href: "/suggestions",
            label: "Suggestions",
            icon: Lightbulb,
        },
    ]

    return (
        <>
            <SidebarHeader className="pb-6">
                <a className="flex items-center gap-3 px-2 py-2" href="/dashboard">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100">
                        <img
                            src="https://www.youtube.com/s/desktop/377f632f/img/logos/favicon_144x144.png"
                            alt="YourAI Studio"
                            className="h-6 w-6 object-contain"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold leading-none tracking-tight">YourAI Studio</span>
                        <span className="text-xs text-muted-foreground font-medium">YouTube Growth</span>
                    </div>
                </a>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu className="gap-2 px-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={item.label}
                                    className={`
                                        h-11 rounded-xl transition-all duration-300
                                        ${isActive
                                            ? 'bg-gradient-to-r from-red-500/10 to-red-500/5 text-red-600 dark:text-red-400 font-semibold shadow-sm border border-red-200/50 dark:border-red-900/30'
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                        }
                                    `}
                                >
                                    <Link href={item.href} className="flex items-center gap-3 px-3">
                                        <item.icon className={`h-5 w-5 ${isActive ? 'text-red-500' : 'opacity-70'}`} />
                                        <span>{item.label}</span>
                                        {isActive && (
                                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                        )}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4">
                {!isLoading && !isConnected && (
                    <div className="mb-4 overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-3 dark:border-red-900/30 dark:from-red-950/30 dark:to-background">
                        <YoutubeConnectionStatus />
                    </div>
                )}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === "/settings"}
                            tooltip="Settings"
                            className="h-11 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
                        >
                            <Link href="/settings" className="flex items-center gap-3 px-3">
                                <Settings className="h-5 w-5 opacity-70" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </>
    )
}