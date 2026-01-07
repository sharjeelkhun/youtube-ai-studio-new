import { AdminOverview } from "@/components/admin/admin-overview"

export default function AdminUsersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
                    <p className="text-muted-foreground">
                        View detailed list of all platform users.
                    </p>
                </div>
            </div>

            <AdminOverview showStats={false} />
        </div>
    )
}
