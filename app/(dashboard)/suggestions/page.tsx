import { SuggestionsTab } from "@/components/tabs/suggestions-tab"
import type { Metadata } from "next"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: `AI Suggestions | ${siteConfig.name}`,
  description: "AI-powered content suggestions for your YouTube channel",
}

export default function SuggestionsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
          AI Suggestions
        </h1>
        <p className="text-lg text-muted-foreground">
          Get AI-powered content ideas and suggestions for your YouTube channel
        </p>
      </div>
      <Suspense fallback={
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <SuggestionsTab />
      </Suspense>

    </div>
  )
}
