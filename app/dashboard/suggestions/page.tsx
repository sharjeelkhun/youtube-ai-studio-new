import { SuggestionsTab } from "@/components/tabs/suggestions-tab"
import type { Metadata } from "next"

import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: `AI Suggestions | ${siteConfig.name}`,
  description: "AI-powered content suggestions for your YouTube channel",
}

export default function SuggestionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">AI Suggestions</h1>
      <SuggestionsTab />
    </div>
  )
}
