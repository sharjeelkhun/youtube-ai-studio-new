import { CommentsTab } from "@/components/dashboard/comments-tab"
import type { Metadata } from "next"

import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: `Comments | ${siteConfig.name}`,
  description: "Manage and respond to your YouTube comments",
}

export default function CommentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
      <CommentsTab channelData={{}} isLoading={false} />
    </div>
  )
}
