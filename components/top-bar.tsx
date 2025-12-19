"use client"

import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { useAuth } from "@/contexts/auth-context"
import { useSession } from "@/contexts/session-context"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, supabaseUser } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching profile:", error)
        } else if (data) {
          setProfile(data)
        }
      } catch (error) {
        console.error("Exception fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleNotificationClick = () => {
    toast.info("Notifications", {
      description: "You have no new notifications",
    })
  }

  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-4">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-6 w-6" strokeWidth={2.5} />
        <span className="sr-only">Toggle menu</span>
      </Button>
      <div className="flex items-center gap-4">
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={handleNotificationClick}>
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <UserMenu user={supabaseUser} profile={profile} />
      </div>
    </div>
  )
}
