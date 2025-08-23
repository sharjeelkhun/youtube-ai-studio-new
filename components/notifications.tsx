"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  type: "comment" | "performance" | "suggestion" | "system"
  avatar?: string
  link?: string
}

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock notifications data
        const mockNotifications: Notification[] = [
          {
            id: "1",
            title: "New comment on your video",
            description:
              "Sarah Johnson commented: 'This video was super helpful! I've been looking for a clear explanation of this topic for ages.'",
            time: "5 minutes ago",
            read: false,
            type: "comment",
            avatar: "/placeholder.svg",
            link: "/videos/1",
          },
          {
            id: "2",
            title: "Performance milestone reached",
            description: "Your video 'How to Use AI for Content Creation' has reached 10,000 views!",
            time: "2 hours ago",
            read: false,
            type: "performance",
            link: "/analytics",
          },
          {
            id: "3",
            title: "New content suggestion",
            description:
              "Based on your channel's performance, we recommend creating content about 'AI Tools for YouTube Creators'.",
            time: "Yesterday",
            read: false,
            type: "suggestion",
            link: "/suggestions",
          },
          {
            id: "4",
            title: "System update",
            description: "We've added new features to help you optimize your YouTube SEO. Check them out!",
            time: "3 days ago",
            read: true,
            type: "system",
          },
          {
            id: "5",
            title: "Comment from a subscriber",
            description:
              "Michael Chen commented: 'Great content as always! Would love to see a follow-up video on advanced techniques.'",
            time: "5 days ago",
            read: true,
            type: "comment",
            avatar: "/placeholder.svg",
            link: "/videos/2",
          },
        ]

        setNotifications(mockNotifications)
        setUnreadCount(mockNotifications.filter((n) => !n.read).length)
      } catch (error) {
        toast.error("Error", {
          description: "Failed to load notifications",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)

    toast.success("Success", {
      description: "All notifications marked as read",
    })
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      setNotifications(notifications.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    // In a real app, you would navigate to the notification link
    if (notification.link) {
      // router.push(notification.link)
      console.log(`Navigating to: ${notification.link}`)
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "comment":
        return "text-blue-500 bg-blue-100 dark:bg-blue-900/20"
      case "performance":
        return "text-green-500 bg-green-100 dark:bg-green-900/20"
      case "suggestion":
        return "text-purple-500 bg-purple-100 dark:bg-purple-900/20"
      case "system":
        return "text-orange-500 bg-orange-100 dark:bg-orange-900/20"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : notifications.length > 0 ? (
          <>
            <ScrollArea className="h-[300px]">
              <DropdownMenuGroup>
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex cursor-pointer flex-col items-start p-3 ${!notification.read ? "bg-muted/50" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex w-full gap-2">
                      {notification.type === "comment" && notification.avatar ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={notification.avatar} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${getNotificationIcon(notification.type)}`}
                        >
                          {notification.type === "comment" && "💬"}
                          {notification.type === "performance" && "📈"}
                          {notification.type === "suggestion" && "💡"}
                          {notification.type === "system" && "🔔"}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {!notification.read && <div className="h-2 w-2 rounded-full bg-primary"></div>}
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{notification.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </ScrollArea>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <a href="/notifications">View all notifications</a>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-2 text-sm font-medium">No notifications</p>
            <p className="text-xs text-muted-foreground">You're all caught up!</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
