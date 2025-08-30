"use client"

import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { YouTubeChannelProvider } from "@/contexts/youtube-channel-context"
import { TooltipProvider } from "@/components/ui/tooltip"

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  return (
    <YouTubeChannelProvider>
      <TooltipProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </TooltipProvider>
    </YouTubeChannelProvider>
  )
}
