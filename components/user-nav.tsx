"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, CreditCard, Settings, LogOut, Sparkles, LifeBuoy, Youtube, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { useYouTubeChannel } from "@/contexts/youtube-channel-context"

export function UserNav() {
  const { user, signOut } = useAuth()
  const { channel } = useYouTubeChannel()

  if (!user) return null

  const initials = user.email
    ?.split('@')[0]
    .slice(0, 2)
    .toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all">
          <Avatar className="h-9 w-9 border border-border/50">
            {/* <AvatarImage src="/avatars/01.png" alt="@shadcn" /> */}
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2 bg-background/80 backdrop-blur-xl border-border/50 shadow-xl rounded-xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border/50">
              {/* <AvatarImage src="/avatars/01.png" alt="@shadcn" /> */}
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none text-foreground">{user.email?.split('@')[0]}</p>
              <p className="text-xs leading-none text-muted-foreground font-medium">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        {channel ? (
          <>
            <DropdownMenuSeparator className="bg-border/50 my-1" />
            <div className="px-2 py-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 px-1 tracking-wider">Connected Channel</p>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                <Avatar className="h-8 w-8 border border-red-200 dark:border-red-800">
                  {channel.thumbnail ? (
                    <AvatarImage src={channel.thumbnail} alt={channel.title} />
                  ) : null}
                  <AvatarFallback className="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400">
                    {channel.title.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium leading-none truncate">{channel.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">
                    {(channel.subscriber_count || 0).toLocaleString()} subscribers
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <DropdownMenuSeparator className="bg-border/50 my-1" />
            <DropdownMenuItem asChild>
              <Link href="/connect-channel" className="cursor-pointer rounded-lg bg-red-50 text-red-600 focus:bg-red-100 focus:text-red-700 py-2.5 w-full flex items-center justify-center font-medium gap-2">
                <Youtube className="w-4 h-4" />
                Connect Channel
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="bg-border/50 my-1" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary transition-colors py-2.5 w-full flex items-center">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings?tab=account" className="cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary transition-colors py-2.5 w-full flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings?tab=billing" className="cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary transition-colors py-2.5 w-full flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary transition-colors py-2.5 w-full flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border/50 my-1" />
        <DropdownMenuItem className="cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary transition-colors py-2.5">
          <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
          <span>New Features</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary transition-colors py-2.5">
          <LifeBuoy className="mr-2 h-4 w-4" />
          <span>Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50 my-1" />
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 py-2.5 my-1"
          onClick={async () => {
            try {
              await signOut()
            } catch (error) {
              console.error('Logout failed:', error)
              window.location.href = '/login'
            }
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
