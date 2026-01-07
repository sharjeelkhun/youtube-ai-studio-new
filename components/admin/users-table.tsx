"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Copy, Shield, ShieldOff } from "lucide-react"
import { format } from "date-fns"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

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

interface UsersTableProps {
    initialUsers: User[]
}

export function UsersTable({ initialUsers }: UsersTableProps) {
    const [users, setUsers] = useState<User[]>(initialUsers || [])
    const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers || [])

    // Sync state with props when data is fetched
    useEffect(() => {
        if (initialUsers) {
            setUsers(initialUsers)
        }
    }, [initialUsers])

    // Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [planFilter, setPlanFilter] = useState("all")

    // Confirm Dialog State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [userToUpdate, setUserToUpdate] = useState<{ id: string, email: string, role: 'admin' | 'user' } | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [confirmEmail, setConfirmEmail] = useState("")

    useEffect(() => {
        // Safe check for users in case it is undefined/null
        let result = [...(users || [])]

        // Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase()
            result = result.filter(u =>
                (u.full_name?.toLowerCase().includes(lowerQuery) || false) ||
                (u.email?.toLowerCase().includes(lowerQuery) || false)
            )
        }

        // Role Filter
        if (roleFilter !== "all") {
            result = result.filter(u => u.role === roleFilter)
        }

        // Plan Filter
        if (planFilter !== "all") {
            if (planFilter === 'pro') {
                result = result.filter(u => u.plan !== 'Free' && u.plan !== 'free')
            } else {
                result = result.filter(u => u.plan === 'Free' || u.plan === 'free')
            }
        }

        setFilteredUsers(result)
    }, [users, searchQuery, roleFilter, planFilter])


    const initiateRoleUpdate = (userId: string, email: string, newRole: 'admin' | 'user') => {
        setUserToUpdate({ id: userId, email, role: newRole })
        setConfirmEmail("")
        setIsConfirmOpen(true)
    }

    const executeRoleUpdate = async () => {
        if (!userToUpdate) return

        setIsUpdating(true)
        try {
            const response = await fetch('/api/admin/users/role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: userToUpdate.id, role: userToUpdate.role })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update role')
            }

            toast.success(`User role updated to ${userToUpdate.role}`)

            // Optimistic update
            setUsers(users.map(u => u.id === userToUpdate.id ? { ...u, role: userToUpdate.role } : u))
            setIsConfirmOpen(false)
            setUserToUpdate(null)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update user role')
            console.error(error)
        } finally {
            setIsUpdating(false)
        }
    }



    return (
        <Card>
            <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                    Manage and view all registered users. Total: {users?.length || 0}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={planFilter} onValueChange={setPlanFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Plan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Plans</SelectItem>
                                <SelectItem value="pro">Paid Plans</SelectItem>
                                <SelectItem value="free">Free Plan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Last Seen</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="flex items-center gap-3 min-w-[250px]">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "User"} />
                                            <AvatarFallback>{(user.full_name || user.email || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm text-foreground">
                                                {user.full_name || "No Name"}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            onClick={() => initiateRoleUpdate(user.id, user.email, user.role === 'admin' ? 'user' : 'admin')}
                                            className={`
                                                cursor-pointer transition-all hover:scale-105 active:scale-95
                                                ${user.role === 'admin'
                                                    ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}
                                            `}
                                        >
                                            <div className="flex items-center gap-1">
                                                {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <div className="w-3" />}
                                                {user.role.toUpperCase()}
                                            </div>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {user.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={user.status === 'active' ? 'default' : 'secondary'}
                                            className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                        >
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {user.last_sign_in ? format(new Date(user.last_sign_in), "MMM d, HH:mm") : "Never"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(user.id)
                                                                toast.success("User ID copied to clipboard")
                                                            }}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Copy User ID</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-8 w-8 ${user.role === 'admin' ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
                                                            onClick={() => initiateRoleUpdate(user.id, user.email, user.role === 'admin' ? 'user' : 'admin')}
                                                        >
                                                            {user.role === 'admin' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{user.role === 'admin' ? 'Revoke Admin Access' : 'Promote to Admin'}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

            </CardContent>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change User Role?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            <div>
                                Are you sure you want to change this user&apos;s role to{' '}
                                <span className="font-bold">{userToUpdate?.role.toUpperCase()}</span>?
                                {userToUpdate?.role === 'admin' && (
                                    <span className="block mt-2 text-yellow-600 dark:text-yellow-500 font-medium">
                                        Warning: This gives the user full control over the system.
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">
                                    Type <span className="font-mono text-muted-foreground select-all">{userToUpdate?.email}</span> to confirm:
                                </p>
                                <Input
                                    value={confirmEmail}
                                    onChange={(e) => setConfirmEmail(e.target.value)}
                                    placeholder={userToUpdate?.email}
                                    className="font-mono"
                                />
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToUpdate(null)} disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => {
                            e.preventDefault() // Prevent default auto-close
                            executeRoleUpdate()
                        }} disabled={isUpdating || confirmEmail !== userToUpdate?.email} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Switch
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card >
    )
}
