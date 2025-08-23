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
      <Card className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No YouTube Channel Connected</h2>
          <p className="text-muted-foreground mb-4">
            Connect your YouTube channel to view and manage your videos.
          </p>
          <Link href="/connect-channel">
            <Button>Connect Channel</Button>
          </Link>
        </div>
      </Card>
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
