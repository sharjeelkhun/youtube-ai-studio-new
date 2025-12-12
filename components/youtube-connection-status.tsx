"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Users, Video, AlertCircle } from 'lucide-react'

interface Channel {
  id: string
  title: string
  description: string
  thumbnail: string
  subscribers: number
  videos: number
}

interface YoutubeConnectionStatusProps {
  channel?: Channel | null
}

export function YoutubeConnectionStatus({ channel = null }: YoutubeConnectionStatusProps) {
  if (!channel) {
    return (
      <div className="flex flex-col gap-3 p-3 rounded-xl border border-red-500/20 bg-gradient-to-b from-red-500/5 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs font-medium text-red-600/80 dark:text-red-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span>Action Required</span>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">No Channel Found</h4>
          <p className="text-[10px] text-muted-foreground leading-snug">Connect to unlock AI tools and analytics.</p>
        </div>

        <Button
          size="sm"
          className="w-full justify-center gap-2 bg-white dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 shadow-sm h-8 text-xs font-semibold"
          onClick={async () => {
            const response = await fetch('/api/youtube/connect')
            const data = await response.json()
            if (data.authUrl) window.location.href = data.authUrl
          }}
        >
          <Users className="w-3.5 h-3.5" />
          Connect Now
        </Button>
      </div>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full">
          <Image
            src={channel.thumbnail || '/placeholder.svg'}
            alt={channel.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-1">{channel.title}</h2>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{channel.description}</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{channel.subscribers.toLocaleString()} subscribers</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{channel.videos.toLocaleString()} videos</span>
            </div>
          </div>
        </div>
        <Link href="/connect-channel">
          <Button variant="outline">Manage Connection</Button>
        </Link>
      </div>
    </Card>
  )
}
