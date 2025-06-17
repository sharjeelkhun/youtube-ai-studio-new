"use client"

import { SessionProvider } from "@/contexts/session-context"
import { AuthProvider } from "@/contexts/auth-context"
import { YouTubeChannelProvider } from "@/contexts/youtube-channel-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <YouTubeChannelProvider>
          {children}
        </YouTubeChannelProvider>
      </AuthProvider>
    </SessionProvider>
  )
}
