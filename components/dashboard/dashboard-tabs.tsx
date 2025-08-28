"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, usePathname } from "next/navigation"

export function DashboardTabs() {
  const router = useRouter()
  const pathname = usePathname()

  const handleTabChange = (value: string) => {
    if (value === "overview") {
      router.push("/dashboard")
    } else {
      router.push(`/dashboard/${value}`)
    }
  }

  const activeTab = pathname.includes("/dashboard/")
    ? pathname.split("/").pop()
    : "overview"

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="flex-wrap">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="videos">Videos</TabsTrigger>
        <TabsTrigger value="comments">Comments</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
