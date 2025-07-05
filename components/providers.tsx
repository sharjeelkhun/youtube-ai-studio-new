"use client"

import { SessionProvider } from "@/contexts/session-context"
import { AuthContextWrapper } from "@/components/auth-context-wrapper"
import { YouTubeChannelProvider } from "@/contexts/youtube-channel-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextWrapper>
        <YouTubeChannelProvider>
          {children}
        </YouTubeChannelProvider>
      </AuthContextWrapper>
    </SessionProvider>
  )
}
