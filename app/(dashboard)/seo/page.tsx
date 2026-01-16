import { SeoTab } from "@/components/tabs/seo-tab"
import type { Metadata } from "next"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: `SEO | ${siteConfig.name}`,
  description: "Optimize your YouTube videos for search engines",
}

export default function SeoPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">SEO Optimization</h1>
      <Suspense fallback={
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <SeoTab />
      </Suspense>

    </div>
  )
}
