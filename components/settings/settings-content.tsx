"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountSettings } from "@/components/settings/account-settings"
import { IntegrationsSettings } from "@/components/settings/integrations-settings"
import { AISettings } from "@/components/settings/ai-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { AppearanceSettings } from "@/components/settings/appearance-settings"

export function SettingsContent() {
  const [activeTab, setActiveTab] = useState("account")

  return (
    <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
