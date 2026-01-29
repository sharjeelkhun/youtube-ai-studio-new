"use client"

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, User, Calendar, Mail, Shield, ShieldOff, Activity, CreditCard, Trash2, Loader2, Copy } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import { deleteUser } from "@/actions/admin-actions"

interface UserDetailsModalProps {
    user: {
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
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onRoleUpdate: (userId: string, currentRole: string) => void
    onDeleteSuccess: (userId: string) => void
}

export function UserDetailsModal({ user, isOpen, onOpenChange, onRoleUpdate, onDeleteSuccess }: UserDetailsModalProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.")) return

        setIsDeleting(true)
        try {
            const result = await deleteUser(user.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.message || "User deleted successfully")
                onDeleteSuccess(user.id)
                onOpenChange(false)
            }
        } catch (error) {
            toast.error("Failed to delete user")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange} dismissible={false}>
            <DrawerContent className="max-w-2xl mx-auto inset-x-0 rounded-t-[32px] max-h-[92vh] border-t border-x border-border/40 shadow-2xl bg-background text-foreground">
                <div className="w-full relative">
                    {/* Close Button */}
                    <div className="absolute right-6 top-6 z-50">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="w-9 h-9 rounded-full bg-muted/80 hover:bg-muted border border-border/50 shadow-sm transition-all hover:rotate-90 duration-300 group"
                        >
                            <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground" strokeWidth={2.5} />
                            <span className="sr-only">Close</span>
                        </Button>
                    </div>

                    <div className="flex flex-col h-full max-h-[92vh]">
                        <DrawerHeader className="text-center sm:text-center pt-10 pb-6 shrink-0 flex flex-col items-center">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50" />
                                <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                                    <AvatarImage src={user.avatar_url || undefined} />
                                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                        {(user.full_name || user.email || "U").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <Badge
                                    className={`absolute -bottom-2 right-1/2 translate-x-1/2 shadow-lg ${user.role === 'admin' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-500 hover:bg-slate-600'
                                        }`}
                                >
                                    {user.role}
                                </Badge>
                            </div>

                            <DrawerTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                {user.full_name || "No Name"}
                            </DrawerTitle>
                            <DrawerDescription className="flex items-center gap-2 text-muted-foreground text-base mt-2">
                                <Mail className="w-4 h-4" /> {user.email}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 ml-1"
                                    onClick={() => {
                                        navigator.clipboard.writeText(user.email)
                                        toast.success("Email copied")
                                    }}
                                >
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="px-6 sm:px-10 overflow-y-auto min-h-0 flex-1 space-y-6 pb-10">
                            {/* User Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="w-4 h-4" /> Joined
                                    </div>
                                    <div className="font-semibold text-lg">
                                        {format(new Date(user.created_at), "MMMM d, yyyy")}
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Activity className="w-4 h-4" /> Last Active
                                    </div>
                                    <div className="font-semibold text-lg">
                                        {user.last_sign_in ? format(new Date(user.last_sign_in), "MMM d, HH:mm") : "Never"}
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CreditCard className="w-4 h-4" /> Plan
                                    </div>
                                    <div className="font-semibold text-lg capitalize flex items-center gap-2">
                                        {user.plan}
                                        <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'} className="text-[10px]">
                                            {user.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Shield className="w-4 h-4" /> ID
                                    </div>
                                    <div className="font-mono text-xs text-muted-foreground truncate" title={user.id}>
                                        {user.id}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-4 pt-4 border-t border-border/40">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Account Actions</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-12 w-full justify-start gap-3"
                                        onClick={() => onRoleUpdate(user.id, user.role)}
                                    >
                                        {user.role === 'admin' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                        {user.role === 'admin' ? "Revoke Admin Access" : "Promote to Admin"}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="h-12 w-full justify-start gap-3 bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200 dark:border-red-900"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Delete User Account
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
