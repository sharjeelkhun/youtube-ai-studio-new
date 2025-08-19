"use client"

import { SessionProvider } from "@/contexts/session-context"
import { AuthContextWrapper } from "@/components/auth-context-wrapper"
import { YouTubeChannelProvider } from "@/contexts/youtube-channel-context"
import { ProfileProvider } from "@/contexts/profile-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextWrapper>
        <ProfileProvider>
          <YouTubeChannelProvider>
            {children}
          </YouTubeChannelProvider>
        </ProfileProvider>
      </AuthContextWrapper>
    </SessionProvider>
  )
}
