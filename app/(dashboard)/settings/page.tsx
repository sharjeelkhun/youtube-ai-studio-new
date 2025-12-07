import { SettingsContent } from "@/components/settings/settings-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings | YouTube AI Studio",
  description: "Configure your account and integrations",
}

export default function SettingsPage() {
  return (
    <div className="space-y-8 py-8 px-4 md:px-0 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your account preferences and integrations</p>
      </div>
      <SettingsContent />
    </div>
  )
}
