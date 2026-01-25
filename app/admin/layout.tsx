import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { AdminLayoutClient } from "@/components/admin/admin-layout-client"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Verify admin role strictly using admin client
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if ((profile as any)?.role !== 'admin') {
        redirect("/dashboard")
    }

    // If we're here, user is admin
    return <AdminLayoutClient>{children}</AdminLayoutClient>
}
