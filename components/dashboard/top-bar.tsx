'use client'

import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { Button } from "@/components/ui/button"
import { ChannelIndicator } from "@/components/channel-indicator"
import { UserNav } from "@/components/user-nav"

export function TopBar() {
  const { channel, loading, isConnected } = useYouTubeChannel()

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex-1">
          {loading ? (
            <div className="w-[200px] h-5 bg-gray-200 animate-pulse rounded" />
          ) : (
            <ChannelIndicator
              isConnected={isConnected}
              channelTitle={channel?.title}
              channelThumbnail={channel?.thumbnail}
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          {!isConnected && !loading && (
            <Button
              variant="default"
              size="sm"
              asChild
            >
              <a href="/connect-channel">Connect Channel</a>
            </Button>
          )}
          <UserNav />
        </div>
      </div>
    </div>
  )
}
