import { SettingsContent } from "@/components/settings/settings-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings | YouTube AI Studio",
  description: "Configure your account and integrations",
}

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <SettingsContent />
    </div>
  )
}
