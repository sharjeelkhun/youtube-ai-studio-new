import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  // Check if we're in a preview environment
  const isPreview = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // For non-preview, check server-side auth
  if (!isPreview) {
    const supabase = createServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      // Not authenticated, redirect to login
      redirect("/login")
    }
  }

  return <DashboardContent />
}
