"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CreditCard, ShieldCheck, UserPlus } from "lucide-react"

interface AdminStatsProps {
    users: any[]
}

export function AdminStats({ users }: AdminStatsProps) {
    const totalUsers = users.length
    const proUsers = users.filter(u => u.plan !== 'Free' && u.plan !== 'free').length
    const admins = users.filter(u => u.role === 'admin').length
    // Hack: Assuming created_at is available and recent means last 24h
    const newUsers = users.filter(u => {
        if (!u.created_at) return false
        const date = new Date(u.created_at)
        const now = new Date()
        const oneDay = 24 * 60 * 60 * 1000
        return (now.getTime() - date.getTime()) < oneDay
    }).length

    const stats = [
        {
            title: "Total Users",
            value: totalUsers,
            icon: Users,
            description: "Registered profiles"
        },
        {
            title: "Pro / Scale Users",
            value: proUsers,
            icon: CreditCard,
            description: "Paying subscribers"
        },
        {
            title: "Admins",
            value: admins,
            icon: ShieldCheck,
            description: "System administrators"
        },
        {
            title: "New (24h)",
            value: newUsers,
            icon: UserPlus,
            description: "Joined recently"
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {stat.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
