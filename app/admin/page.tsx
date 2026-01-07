import { AdminOverview } from "@/components/admin/admin-overview"

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage users, monitor growth, and control system settings.
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                <AdminOverview />
            </div>
        </div>
    )
}
