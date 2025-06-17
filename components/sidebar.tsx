"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, MessageSquare, PlusCircle, Settings, User, Video, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isConnected } = useYouTubeChannel()

  return (
    <div className={cn("flex h-full flex-col border-r bg-background", className)}>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Youtube className="h-6 w-6 text-red-600" />
          <span>YouTube Dashboard</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <nav className="grid items-start gap-1 px-2 py-4 text-sm font-medium lg:px-4">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/dashboard" && "bg-muted text-primary",
            )}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/analytics"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/analytics" && "bg-muted text-primary",
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Link>
          <Link
            href="/videos"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/videos" && "bg-muted text-primary",
            )}
          >
            <Video className="h-4 w-4" />
            Videos
          </Link>
          <Link
            href="/comments"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/comments" && "bg-muted text-primary",
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Comments
          </Link>
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/profile" && "bg-muted text-primary",
            )}
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === "/settings" && "bg-muted text-primary",
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
      </ScrollArea>
      {!isConnected && (
      <div className="mt-auto border-t p-4">
        <Button asChild variant="outline" size="sm" className="w-full justify-start">
          <Link href="/connect-channel" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Connect Channel
          </Link>
        </Button>
      </div>
      )}
    </div>
  )
}
