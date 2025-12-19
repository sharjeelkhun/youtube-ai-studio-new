import { VideosTab } from "@/components/tabs/videos-tab"
import type { Metadata } from "next"

import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: `Videos | ${siteConfig.name}`,
  description: "Manage your YouTube videos",
}

export default function VideosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Videos</h1>
      <VideosTab />
    </div>
  )
}
