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
      <SidebarHeader>
        <a className="flex items-center gap-2" href="/dashboard">
          <img
            src="https://www.youtube.com/s/desktop/377f632f/img/logos/favicon_144x144.png"
            alt="Logo"
            className="h-8 w-8"
          />
          <span className="text-lg font-semibold">AI Studio</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
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
              tooltip="Settings"
            >
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4 shrink-0" />
                <span>Settings</span>
              </Link>
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
