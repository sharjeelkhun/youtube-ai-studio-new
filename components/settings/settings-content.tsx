"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountSettings } from "@/components/settings/account-settings"
import { IntegrationsSettings } from "@/components/settings/integrations-settings"
import { AISettings } from "@/components/settings/ai-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { AppearanceSettings } from "@/components/settings/appearance-settings"
import { useRouter, useSearchParams } from "next/navigation"
import { User, Layers, Cpu, Bell, Palette } from "lucide-react"
import { motion } from "framer-motion"

export function SettingsContent() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams?.get('tab') as string) || 'account'
  const [activeTab, setActiveTab] = useState(initialTab)
  const router = useRouter()

  useEffect(() => {
    const tab = (searchParams?.get('tab') as string) || 'account'
    if (tab !== activeTab) setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(window.location.search)
    params.set('tab', value)
    const query = params.toString()
    router.replace(`/settings${query ? `?${query}` : ''}`)
  }

  const tabs = [
    { value: "account", label: "Account", icon: User },
    // { value: "integrations", label: "Integrations", icon: Layers }, // Hiding unused if needed, but keeping for now
    { value: "integrations", label: "Integrations", icon: Layers },
    { value: "ai", label: "AI Providers", icon: Cpu },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "appearance", label: "Appearance", icon: Palette },
  ]

  return (
    <Tabs defaultValue="account" value={activeTab} onValueChange={handleTabChange} className="space-y-8">
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <TabsList className="h-auto p-1 bg-muted/40 backdrop-blur-md border border-white/10 rounded-full inline-flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-full px-4 py-2 gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300"
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </div>

      <div className="relative min-h-[500px]">
        {/* Using generic wrappers for now as we don't have AnimatePresence setup fully in this file context without generic components, keeping it simple but clean */}
        <TabsContent value="account" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <IntegrationsSettings />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <AISettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <AppearanceSettings />
        </TabsContent>
      </div>
    </Tabs>
  )
}
