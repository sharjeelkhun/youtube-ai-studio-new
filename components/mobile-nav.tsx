"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, MessageSquare, Settings, Video, Search, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: Home,
    },
    {
        label: "Videos",
        href: "/videos",
        icon: Video,
    },
    {
        label: "Comments",
        href: "/comments",
        icon: MessageSquare,
    },
    {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
    },
    {
        label: "SEO",
        href: "/seo",
        icon: Search,
    },
    {
        label: "Suggestions",
        href: "/suggestions",
        icon: Lightbulb,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
    },
]

export function MobileNav() {
    const pathname = usePathname()

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-xl block md:hidden">
            {/* Safe area padding for devices with home indicators */}
            <div className="pb-safe-area-inset-bottom">
                <div className="flex h-16 items-center justify-around px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group relative flex flex-col items-center justify-center rounded-xl px-2 py-1 transition-all duration-200 min-w-0 flex-1 max-w-[60px]",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground active:scale-95"
                                )}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute -top-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary" />
                                )}

                                {/* Icon with background for active state */}
                                <div className={cn(
                                    "relative mb-1 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-primary/10 shadow-sm"
                                        : "group-hover:bg-muted/50"
                                )}>
                                    <item.icon className={cn(
                                        "h-5 w-5 transition-all duration-200",
                                        isActive
                                            ? "scale-110 text-primary"
                                            : "group-hover:scale-105"
                                    )} />
                                </div>

                                {/* Label */}
                                <span className={cn(
                                    "text-[9px] font-medium leading-tight text-center transition-all duration-200 truncate max-w-full",
                                    isActive
                                        ? "text-primary font-semibold"
                                        : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
