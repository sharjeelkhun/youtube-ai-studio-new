"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
    LayoutDashboard,
    Users,
    Settings,
} from "lucide-react"

export function AdminSidebar() {
    const pathname = usePathname()

    const menuItems = [
        {
            href: "/admin",
            label: "Overview",
            icon: LayoutDashboard,
        },
        {
            href: "/admin/users",
            label: "Users",
            icon: Users,
        },
    ]

    return (
        <>
            <SidebarHeader className="pb-6">
                <a className="flex items-center gap-3 px-2 py-2" href="/admin">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100">
                        <img
                            src="https://www.youtube.com/s/desktop/377f632f/img/logos/favicon_144x144.png"
                            alt="YourAI Studio"
                            className="h-6 w-6 object-contain"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold leading-none tracking-tight">YourAI Studio</span>
                        <span className="text-xs text-muted-foreground font-medium">Admin Panel</span>
                    </div>
                </a>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu className="gap-2 px-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                        return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={item.label}
                                    className={`
                                        h-11 rounded-xl transition-all duration-300
                                        ${isActive
                                            ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                        }
                                    `}
                                >
                                    <Link href={item.href} className="flex items-center gap-3 px-3">
                                        <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>
        </>
    )
}
