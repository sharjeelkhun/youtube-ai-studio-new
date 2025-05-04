"use client"

import type React from "react"

import { Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationsMenu } from "@/components/notifications"
import { UserMenu } from "@/components/user-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TooltipProvider } from "@/components/ui/tooltip"

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter()
  const { channelData, isConnected } = useYouTubeChannel()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get("search") as string

    if (query.trim()) {
      // In a real app, you would navigate to search results
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <TooltipProvider>
      <header className="flex h-16 items-center border-b px-4 md:px-6">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="search"
            placeholder="Search videos, analytics..."
            className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
          />
        </form>

        <div className="ml-auto flex items-center gap-4">
          {isConnected ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/30">
              <Avatar className="h-6 w-6">
                <AvatarImage src={channelData?.thumbnail || "/placeholder.svg"} alt={channelData?.title || "Channel"} />
                <AvatarFallback>YT</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{channelData?.title || "Your Channel"}</span>
            </div>
          ) : (
            <Link href="/connect-channel">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C19.505 20.455 12 20.455 12 20.455s-7.505 0-9.377-.505A3.017 3.017 0 0 0 .502 17.814C0 15.93 0 12 0 12s0-3.93.502-5.814a3.016 3.016 0 0 0 2.122-2.136C4.495 3.545 12 3.545 12 3.545s7.505 0 9.377.505a3.016 3.016 0 0 0 2.122 2.136C24 8.07 24 12 24 12s0 3.93-.502 5.814a3.016 3.016 0 0 0-2.122 2.136C19.505 20.455 12 20.455 12 20.455s-7.505 0-9.377-.505A3.017 3.017 0 0 0 .502 17.814C0 15.93 0 12 0 12s0-3.93.502-5.814z" />
                </svg>
                Connect Channel
              </Button>
            </Link>
          )}

          <NotificationsMenu />

          <ThemeToggle />

          <UserMenu />
        </div>
      </header>
    </TooltipProvider>
  )
}
