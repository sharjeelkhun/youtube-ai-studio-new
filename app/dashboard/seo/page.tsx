import { SeoTab } from "@/components/tabs/seo-tab"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SEO | YouTube AI Studio",
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
