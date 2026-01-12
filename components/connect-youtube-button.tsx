"use client"

import { Button } from "@/components/ui/button"
import { Youtube } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConnectYouTubeButtonProps {
  className?: string
}

import { supabase } from "@/lib/supabase/client"

export function ConnectYouTubeButton({ className }: ConnectYouTubeButtonProps) {
  const handleConnect = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const response = await fetch('/api/youtube/connect', {
      headers: {
        "Authorization": `Bearer ${session.access_token}`
      }
    })
    const data = await response.json()
    if (data.authUrl) {
      window.location.href = data.authUrl
    }
  }

  return (
    <Button
      size="lg"
      className={cn("bg-red-600 hover:bg-red-700 transition-all duration-300 flex items-center gap-2 text-lg px-8 py-6 shadow-lg hover:shadow-xl", className)}
      onClick={handleConnect}
    >
      <Youtube className="w-5 h-5" />
      Connect with YouTube
    </Button>
  )
}
