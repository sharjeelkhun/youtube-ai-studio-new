import { SeoTab } from "@/components/tabs/seo-tab"
import type { Metadata } from "next"

import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: `SEO | ${siteConfig.name}`,
  description: "Optimize your YouTube videos for search engines",
}

export default function SeoPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">SEO Optimization</h1>
      <SeoTab />
    </div>
  )
}
