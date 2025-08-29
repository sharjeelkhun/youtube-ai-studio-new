import { SuggestionsTab } from "@/components/tabs/suggestions-tab"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Suggestions | YouTube AI Studio",
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
