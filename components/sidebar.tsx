"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Home,
  Video,
  Search,
  Lightbulb,
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeSection?: string
}

export function Sidebar({ open, onOpenChange, activeSection = "dashboard" }: SidebarProps) {
  const router = useRouter()
  const toggleSidebar = () => {
    onOpenChange(!open)
  }

  const handleLogout = () => {
    // In a real app, this would handle logout logic
    console.log("Logging out...")
    // Then redirect to login page
    router.push("/login")
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "relative z-30 flex h-full flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
          open ? "w-64" : "w-16",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className={cn("flex items-center gap-2", !open && "justify-center w-full")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            {open && <span className="font-semibold">YouTube AI Studio</span>}
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className={cn("h-8 w-8", !open && "hidden")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {[
              { name: "Dashboard", icon: Home, id: "dashboard", path: "/dashboard" },
              { name: "Analytics", icon: BarChart3, id: "analytics", path: "/dashboard/analytics" },
              { name: "Videos", icon: Video, id: "videos", path: "/dashboard/videos" },
              { name: "SEO", icon: Search, id: "seo", path: "/dashboard/seo" },
              { name: "AI Suggestions", icon: Lightbulb, id: "suggestions", path: "/dashboard/suggestions" },
              { name: "Settings", icon: Settings, id: "settings", path: "/dashboard/settings" },
            ].map((item) => (
              <NavItem
                key={item.id}
                name={item.name}
                icon={item.icon}
                path={item.path}
                active={activeSection === item.id}
                expanded={open}
              />
            ))}
          </nav>
        </div>

        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-3", !open && "justify-center w-full")}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-auto">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" alt="User" />
                      <AvatarFallback>US</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {open && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">User Name</span>
                  <span className="text-xs text-muted-foreground">user@example.com</span>
                </div>
              )}
            </div>
            {open && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
          {!open && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mt-4 h-8 w-8 mx-auto flex">
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

interface NavItemProps {
  name: string
  icon: React.ElementType
  path: string
  active: boolean
  expanded: boolean
}

function NavItem({ name, icon: Icon, path, active, expanded }: NavItemProps) {
  if (expanded) {
    return (
      <Button variant={active ? "secondary" : "ghost"} className="w-full justify-start" asChild>
        <Link href={path}>
          <Icon className="mr-2 h-4 w-4" />
          {name}
        </Link>
      </Button>
    )
  }

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button variant={active ? "secondary" : "ghost"} size="icon" className="h-9 w-9 mx-auto" asChild>
          <Link href={path}>
            <Icon className="h-4 w-4" />
            <span className="sr-only">{name}</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-normal">
        {name}
      </TooltipContent>
    </Tooltip>
  )
}
