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
} from "lucide-react"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isConnected } = useYouTubeChannel()

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
      href: "/analytics",
      label: "Analytics",
      icon: BarChart,
    },
  ]

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">AI Studio</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                icon={<item.icon />}
                tooltip={item.label}
              >
                <Link href={item.href}>{item.label}</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/settings"}
              icon={<Settings />}
              tooltip="Settings"
            >
              <Link href="/settings">Settings</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!isConnected && (
          <div className="px-3 py-2">
            <YoutubeConnectionStatus />
          </div>
        )}
      </SidebarFooter>
    </>
  )
}
