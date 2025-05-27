'use client'

import { useYouTubeChannel } from "@/contexts/youtube-channel-context"
import { Button } from "@/components/ui/button"
import { ChannelIndicator } from "@/components/channel-indicator"
import { UserNav } from "@/components/user-nav"

export function TopBar() {
  const { channelData, isConnected, isLoading } = useYouTubeChannel()

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex-1">
          {isLoading ? (
            <div className="w-[200px] h-5 bg-gray-200 animate-pulse rounded" />
          ) : (
            <ChannelIndicator
              isConnected={isConnected}
              channelTitle={channelData?.title}
              channelThumbnail={channelData?.thumbnail}
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          {!isConnected && !isLoading && (
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
