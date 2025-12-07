"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Save, User, Lock, ShieldAlert, BadgeCheck, Mail, Camera } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/contexts/session-context"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
      const meta = (session.user as any)?.user_metadata || {}
      const derivedUsername =
        meta.user_name ||
        meta.username ||
        meta.preferred_username ||
        (meta.full_name ? String(meta.full_name).split(" ")[0] : "") ||
        (session.user.email ? String(session.user.email).split("@")[0] : "") ||
        ""

      setFormData((prev) => ({
        ...prev,
        email: session.user.email || "",
        username: derivedUsername || prev.username,
      }))
    }
    if (channelData) {
      setFormData((prev) => ({
        ...prev,
        name: channelData.title || "",
        username: channelData.title || prev.username,
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
    <div className="space-y-8">
      {/* Profile Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-b from-muted/30 to-background shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />

        <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-purple-600 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <Avatar className="relative h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={avatarSrc} alt="Profile" className="object-cover" />
              <AvatarFallback className="text-3xl font-bold bg-muted">{avatarFallback}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-md border border-background"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{formData.name || "Your Name"}</h2>
              <Badge variant="secondary" className="px-2 py-0.5 h-6 text-xs bg-green-500/10 text-green-600 border-green-200/50">
                <BadgeCheck className="w-3 h-3 mr-1" /> Verified
              </Badge>
            </div>
            <p className="text-muted-foreground">{formData.email}</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
              <Badge variant="outline" className="bg-background/50 backdrop-blur">Pro Plan</Badge>
              <Badge variant="outline" className="bg-background/50 backdrop-blur">Early Adopter</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Personal Information */}
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-md hover:bg-background/70">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Personal Information</CardTitle>
            </div>
            <CardDescription>Update your public profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your full name"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">@</span>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="username"
                  disabled
                  className="pl-7 bg-background/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Your email address"
                  disabled
                  className="pl-9 bg-background/50"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <p className="text-xs text-muted-foreground">Some fields may be managed by your provider.</p>
            <Button onClick={handleSaveProfile} disabled={isLoading} className="shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
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

        {/* Security */}
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-md hover:bg-background/70">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Security & Password</CardTitle>
            </div>
            <CardDescription>Ensure your account stays secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" placeholder="••••••••" className="bg-background/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="••••••••" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm</Label>
                <Input id="confirm-password" type="password" placeholder="••••••••" className="bg-background/50" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-2">
            <Button variant="outline" className="hover:bg-muted/50">Update Password</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-background/50">
            <div className="space-y-1">
              <h3 className="font-medium text-destructive">Delete Account</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Once you delete your account, there is no going back. All your data and settings will be permanently removed.
              </p>
            </div>
            <Button variant="destructive" size="sm" className="shadow-sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
