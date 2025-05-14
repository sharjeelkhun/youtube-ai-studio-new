"use client"

import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  // Use the YouTube channel context with fallback for preview mode
  const channelContext = useYouTubeChannel?.() || {
    channel: {
      title: "Demo Channel",
      subscribers: 1000,
      thumbnail: "/placeholder.svg",
    },
    isLoading: false,
    error: null,
  }

  const { channel, isLoading } = channelContext

  return (
    <TooltipProvider>
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="mr-2 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
            ) : (
              <img
                src={channel?.thumbnail || "/placeholder.svg"}
                alt={channel?.title || "Channel"}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-sm font-medium">{isLoading ? "Loading..." : channel?.title || "Demo Channel"}</h2>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "..." : `${channel?.subscribers?.toLocaleString() || "1,000"} subscribers`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      3
                    </span>
                    <span className="sr-only">Notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>New subscriber milestone reached!</DropdownMenuItem>
                  <DropdownMenuItem>Your latest video is trending</DropdownMenuItem>
                  <DropdownMenuItem>Content suggestion available</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
