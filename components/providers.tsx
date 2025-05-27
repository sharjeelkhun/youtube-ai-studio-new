"use client"

import { AuthProvider } from "@/contexts/auth-context"
import { YouTubeChannelProvider } from "@/contexts/youtube-channel-context"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <YouTubeChannelProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </YouTubeChannelProvider>
    </AuthProvider>
  )
}
