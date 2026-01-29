"use client"

import { useEffect, useState } from "react"
import { UsersTable } from "@/components/admin/users-table"
import { AdminStats } from "@/components/admin/admin-stats"
import { AdminAnalytics } from "@/components/admin/admin-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

interface User {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
    created_at: string
    plan: string
    status: string
    last_sign_in: string | null
    role: string
}


interface AdminOverviewProps {
    showStats?: boolean
}

export function AdminOverview({ showStats = true }: AdminOverviewProps) {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/admin/users', { cache: 'no-store' })
                if (!response.ok) {
                    throw new Error('Failed to fetch users')
                }
                const data = await response.json()
                setUsers(data.users)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-red-500 font-medium p-4 border border-red-200 rounded-md bg-red-50">
                Error from overview: {error}
            </div>
        )
    }

    const handleUserDelete = (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId))
    }

    return (
        <div className="space-y-6">
            {showStats && <AdminStats users={users} />}

            {showStats ? (
                <Tabs defaultValue="analytics" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="analytics">Revenue & Growth</TabsTrigger>
                        <TabsTrigger value="users">Users Management</TabsTrigger>
                    </TabsList>
                    <TabsContent value="users" className="space-y-4">
                        <UsersTable initialUsers={users} onUserDelete={handleUserDelete} />
                    </TabsContent>
                    <TabsContent value="analytics" className="space-y-4">
                        <AdminAnalytics />
                    </TabsContent>
                </Tabs>
            ) : (
                <UsersTable initialUsers={users} onUserDelete={handleUserDelete} />
            )}
        </div>
    )
}
