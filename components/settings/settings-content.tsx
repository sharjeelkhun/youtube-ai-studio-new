"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountSettings } from "@/components/settings/account-settings"
import { IntegrationsSettings } from "@/components/settings/integrations-settings"
import { AISettings } from "@/components/settings/ai-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { AppearanceSettings } from "@/components/settings/appearance-settings"
import { useRouter, useSearchParams } from "next/navigation"

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

  return (
    <Tabs defaultValue="account" value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="ai">AI Providers</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="space-y-6">
        <AccountSettings />
      </TabsContent>

      <TabsContent value="integrations" className="space-y-6">
        <IntegrationsSettings />
      </TabsContent>

      <TabsContent value="ai" className="space-y-6">
        <AISettings />
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <NotificationSettings />
      </TabsContent>

      <TabsContent value="appearance" className="space-y-6">
        <AppearanceSettings />
      </TabsContent>
    </Tabs>
  )
}
