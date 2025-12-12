"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Save, Loader2, Bell, Mail, Smartphone, MessageSquare, ThumbsUp, UserPlus, Trophy, Zap, Sparkles, Inbox } from "lucide-react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    commentNotifications: true,
    likeNotifications: false,
    subscriptionNotifications: true,
    milestoneNotifications: true,
    contentSuggestions: true,
    performanceAlerts: true,
    marketingEmails: false,
    digestFrequency: "weekly",
    notificationMethod: "all",
  })

  const handleSettingChange = (setting: string, value: any) => {
    setNotificationSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success("Notification settings saved", {
        description: "Your notification preferences have been updated successfully.",
      })
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save notification settings. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Communication Hub Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-background shadow-sm">
        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-2xl font-bold tracking-tight">Communication Hub</h2>
              <p className="text-muted-foreground max-w-sm">Manage how you receive alerts, updates, and community interactions.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-background/50 backdrop-blur-md p-2 rounded-xl border border-border/50">
            <Badge variant={notificationSettings.emailNotifications && notificationSettings.pushNotifications ? "default" : "secondary"} className="h-8 px-3">
              {notificationSettings.emailNotifications && notificationSettings.pushNotifications ? "All Active" : "Customized"}
            </Badge>
            <div className="h-4 w-px bg-border/50" />
            <span className="text-sm font-medium pr-2 text-muted-foreground">
              {Object.values(notificationSettings).filter(v => v === true).length} Enabled
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Delivery Configuration */}
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Delivery Channels</CardTitle>
                <CardDescription>Where should we send your notifications?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/40">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label className="text-base">Email</Label>
                    <p className="text-xs text-muted-foreground">Get daily summaries</p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/40">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label className="text-base">Push</Label>
                    <p className="text-xs text-muted-foreground">Real-time browser alerts</p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                />
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border/20">
              <Label className="text-sm font-medium mb-2 block">Digest Frequency</Label>
              <Select
                value={notificationSettings.digestFrequency}
                onValueChange={(value) => handleSettingChange("digestFrequency", value)}
              >
                <SelectTrigger className="bg-background/80">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Summary</SelectItem>
                  <SelectItem value="weekly">Weekly Recap</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground pt-1">
                We combine lower priority notifications into a single email to reduce clutter.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Activity & Engagement */}
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <CardTitle>Engagement</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: "commentNotifications", label: "Comments", icon: MessageSquare, desc: "New comments on your videos" },
              { id: "likeNotifications", label: "Likes", icon: ThumbsUp, desc: "Milestones for video likes" },
              { id: "subscriptionNotifications", label: "New Subscribers", icon: UserPlus, desc: "When someone subscribes" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between group">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  // @ts-ignore
                  checked={notificationSettings[item.id]}
                  // @ts-ignore
                  onCheckedChange={(checked) => handleSettingChange(item.id, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI & Platform */}
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle>AI & Updates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: "contentSuggestions", label: "Content Ideas", icon: Zap, desc: "Weekly AI content recommendations" },
              { id: "performanceAlerts", label: "Performance", icon: Trophy, desc: "Significant changes in metrics" },
              { id: "marketingEmails", label: "Product Updates", icon: StarIcon, desc: "New features and tips" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  // @ts-ignore
                  checked={notificationSettings[item.id]}
                  // @ts-ignore
                  onCheckedChange={(checked) => handleSettingChange(item.id, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSaveSettings} disabled={isLoading} size="lg" className="shadow-lg shadow-primary/20">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function StarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
