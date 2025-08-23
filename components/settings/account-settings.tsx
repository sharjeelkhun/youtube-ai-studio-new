"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload, Save } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/contexts/session-context"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"

export function AccountSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const { session } = useSession()
  const { channelData } = useYouTubeChannel()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
  })

  useEffect(() => {
    if (session) {
      setFormData((prev) => ({
        ...prev,
        email: session.user.email || "",
        username: session.user.user_metadata.user_name || "",
      }))
    }
    if (channelData) {
      setFormData((prev) => ({
        ...prev,
        name: channelData.title || "",
      }))
    }
  }, [session, channelData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success("Profile updated", {
        description: "Your profile information has been updated successfully.",
      })
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update profile. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const avatarSrc = channelData?.thumbnail || "/placeholder-user.jpg"
  const avatarFallback = channelData?.title
    ? channelData.title
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "AV"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your account profile details and public information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarSrc} alt="Profile" />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Change Avatar
              </Button>
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Your username"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Your email address"
                  disabled
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" placeholder="••••••••" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline">Update Password</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-destructive/20 p-4">
            <h3 className="text-lg font-medium text-destructive">Delete Account</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Once you delete your account, there is no going back. All your data will be permanently removed.
            </p>
            <Button variant="destructive" size="sm" className="mt-4">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
