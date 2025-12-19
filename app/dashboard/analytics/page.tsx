// import { AnalyticsTab } from "@/components/tabs/analytics-tab"
import type { Metadata } from "next"

import { siteConfig } from "@/lib/config"

export const metadata: Metadata = {
  title: `Analytics | ${siteConfig.name}`,
  description: "Detailed analytics for your YouTube channel",
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
      {/* <AnalyticsTab /> */}
    </div>
  )
}
