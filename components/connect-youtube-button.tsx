"use client"

import { Button } from "@/components/ui/button"
import { Youtube } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConnectYouTubeButtonProps {
  className?: string
}

import { supabase } from "@/lib/supabase/client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

export function ConnectYouTubeButton({ className }: ConnectYouTubeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/youtube/connect', {
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error connecting YouTube:", error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      className={cn("bg-red-600 hover:bg-red-700 transition-all duration-300 flex items-center gap-2 text-lg px-8 py-6 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group", className)}
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Youtube className="w-5 h-5 transition-transform group-hover:scale-110" />
      )}
      {isLoading ? "Connecting..." : "Connect with YouTube"}
    </Button>
  )
}
