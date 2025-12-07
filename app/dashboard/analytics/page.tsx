// import { AnalyticsTab } from "@/components/tabs/analytics-tab"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics | YouTube AI Studio",
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
