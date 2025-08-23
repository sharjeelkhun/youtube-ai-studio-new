import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { Toaster } from "@/components/ui/sonner"
import { createServerClient } from "@/lib/supabase-server"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "YouTube AI Studio Dashboard",
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar className="h-full" />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto py-6">{children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
