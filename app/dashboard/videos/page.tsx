import { VideosTab } from "@/components/tabs/videos-tab"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Videos | YouTube AI Studio",
  description: "Manage your YouTube videos",
}

export default function VideosPage() {
  return (
    <div className="container mx-auto">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Videos</h1>
        <VideosTab />
      </div>
    </div>
  )
}
