import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return redirect('/login')
  }

  return <DashboardContent />
}
