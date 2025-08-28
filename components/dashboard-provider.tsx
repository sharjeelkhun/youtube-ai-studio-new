"use client"

import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>
}
