import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"

export default async function ConnectChannelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return redirect('/login')
  }

  return (
    <div className="mx-auto py-6 bg-gray-50 min-h-screen">
      {children}
    </div>
  )
}
