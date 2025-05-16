"use client"

import { useEffect, useState } from "react"
import { Bell, Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/sidebar"
import { UserMenu } from "@/components/user-menu"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { db, type Profile } from "@/lib/db"
import { useAuth } from "@/contexts/auth-context"

export function TopBar() {
  const { channel, isLoading: channelLoading } = useYouTubeChannel()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      setIsLoadingProfile(true)
      try {
        if (user?.id) {
          const profileData = await db.profiles.getByUserId(user.id)
          setProfile(profileData)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    if (user) {
      fetchProfile()
    }
  }, [user])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        {channelLoading || isLoadingProfile ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : channel ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={channel.thumbnail || "/placeholder.svg?height=32&width=32"} alt={channel.title} />
              <AvatarFallback>{channel.title?.charAt(0) || "Y"}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{channel.title}</span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No channel connected</div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-4">
        <form className="hidden md:flex">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="w-64 pl-8 md:w-80 lg:w-96" />
          </div>
        </form>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary"></span>
        </Button>
        <UserMenu user={user} profile={profile} />
      </div>
    </header>
  )
}
