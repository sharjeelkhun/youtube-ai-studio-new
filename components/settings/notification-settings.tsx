"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure how and when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Delivery Methods</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-method">Preferred Notification Method</Label>
              <RadioGroup
                id="notification-method"
                value={notificationSettings.notificationMethod}
                onValueChange={(value) => handleSettingChange("notificationMethod", value)}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All methods (Email & Push)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email-only" />
                  <Label htmlFor="email-only">Email only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="push" id="push-only" />
                  <Label htmlFor="push-only">Push only</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="digest-frequency">Email Digest Frequency</Label>
              <Select
                value={notificationSettings.digestFrequency}
                onValueChange={(value) => handleSettingChange("digestFrequency", value)}
              >
                <SelectTrigger id="digest-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often you want to receive email summaries of your channel activity
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">YouTube Activity</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="comment-notifications">Comments</Label>
                  <p className="text-sm text-muted-foreground">Notify when someone comments on your videos</p>
                </div>
                <Switch
                  id="comment-notifications"
                  checked={notificationSettings.commentNotifications}
                  onCheckedChange={(checked) => handleSettingChange("commentNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="like-notifications">Likes</Label>
                  <p className="text-sm text-muted-foreground">Notify when someone likes your videos</p>
                </div>
                <Switch
                  id="like-notifications"
                  checked={notificationSettings.likeNotifications}
                  onCheckedChange={(checked) => handleSettingChange("likeNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="subscription-notifications">Subscriptions</Label>
                  <p className="text-sm text-muted-foreground">Notify when someone subscribes to your channel</p>
                </div>
                <Switch
                  id="subscription-notifications"
                  checked={notificationSettings.subscriptionNotifications}
                  onCheckedChange={(checked) => handleSettingChange("subscriptionNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="milestone-notifications">Milestones</Label>
                  <p className="text-sm text-muted-foreground">Notify when your channel reaches important milestones</p>
                </div>
                <Switch
                  id="milestone-notifications"
                  checked={notificationSettings.milestoneNotifications}
                  onCheckedChange={(checked) => handleSettingChange("milestoneNotifications", checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">AI & Analytics</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="content-suggestions">Content Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive AI-generated content ideas and recommendations
                  </p>
                </div>
                <Switch
                  id="content-suggestions"
                  checked={notificationSettings.contentSuggestions}
                  onCheckedChange={(checked) => handleSettingChange("contentSuggestions", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="performance-alerts">Performance Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about significant changes in your channel performance
                  </p>
                </div>
                <Switch
                  id="performance-alerts"
                  checked={notificationSettings.performanceAlerts}
                  onCheckedChange={(checked) => handleSettingChange("performanceAlerts", checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Marketing</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-emails">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features, tips, and special offers
                </p>
              </div>
              <Switch
                id="marketing-emails"
                checked={notificationSettings.marketingEmails}
                onCheckedChange={(checked) => handleSettingChange("marketingEmails", checked)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Notification Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
