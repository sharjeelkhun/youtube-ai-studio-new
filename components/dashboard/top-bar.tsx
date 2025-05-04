"use client"

import Link from "next/link"
import { Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function TopBar() {
  const { channel } = useYouTubeChannel()
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.error("Error fetching user:", error)
          return
        }

        if (data?.user) {
          setUser(data.user)
        }
      } catch (error) {
        console.error("Error in getUser:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Get the first letter of the email or a fallback
  const getInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <div className="flex h-16 items-center justify-between border-b px-4">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-xl font-bold">
          YT Dashboard
        </Link>
        <div className="hidden md:block">
          <Input placeholder="Search..." className="w-[300px]" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                {channel?.thumbnails?.default?.url ? (
                  <AvatarImage
                    src={channel.thumbnails.default.url || "/placeholder.svg"}
                    alt={channel.title || "User"}
                  />
                ) : (
                  <AvatarFallback>{loading ? "..." : getInitial()}</AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{channel?.title || user?.email || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{channel?.customUrl || user?.email || ""}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/integrations">Integrations</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
