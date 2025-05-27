import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ChannelIndicatorProps {
  isConnected: boolean
  channelTitle?: string | null
  channelThumbnail?: string | null
}

export function ChannelIndicator({ isConnected, channelTitle, channelThumbnail }: ChannelIndicatorProps) {
  if (!isConnected) {
    return (
      <span className="font-medium text-muted-foreground">
        No channel connected
      </span>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        {channelThumbnail ? (
          <img 
            src={channelThumbnail} 
            alt={channelTitle || 'Channel'} 
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <AvatarFallback>
            {channelTitle?.[0]?.toUpperCase() || 'C'}
          </AvatarFallback>
        )}
      </Avatar>
      <span className="font-medium">
        {channelTitle || 'Channel'}
      </span>
    </div>
  )
}
