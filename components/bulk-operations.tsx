"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useFeatureAccess } from '@/lib/feature-access'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { Zap, CheckSquare, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface BulkOperationsProps {
  videos: Array<{ id: string; title: string; status: string }>
  onBulkAction?: (action: string, videoIds: string[]) => void
}

export function BulkOperations({ videos, onBulkAction }: BulkOperationsProps) {
  const [selectedVideos, setSelectedVideos] = useState<string[]>([])
  const { hasFeature, getUpgradeMessage } = useFeatureAccess()

  const canUseBulkOperations = hasFeature('BULK_VIDEO_OPERATIONS')

  const handleSelectVideo = (videoId: string, checked: boolean) => {
    if (checked) {
      setSelectedVideos(prev => [...prev, videoId])
    } else {
      setSelectedVideos(prev => prev.filter(id => id !== videoId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVideos(videos.map(v => v.id))
    } else {
      setSelectedVideos([])
    }
  }

  const handleBulkAction = (action: string) => {
    if (!canUseBulkOperations) {
      toast.error('Bulk operations require a premium plan')
      return
    }

    if (selectedVideos.length === 0) {
      toast.error('Please select videos to perform bulk operations')
      return
    }

    onBulkAction?.(action, selectedVideos)
    toast.success(`Bulk ${action} initiated for ${selectedVideos.length} videos`)
  }

  if (!canUseBulkOperations) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Bulk Operations</CardTitle>
          <p className="text-muted-foreground">
            Process multiple videos at once with powerful bulk operations
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-semibold">Bulk AI Optimization</h3>
                <p className="text-sm text-muted-foreground">Optimize titles, descriptions, and tags for multiple videos</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-semibold">Bulk Status Updates</h3>
                <p className="text-sm text-muted-foreground">Change privacy settings and publish status in bulk</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-semibold">Bulk Thumbnail Generation</h3>
                <p className="text-sm text-muted-foreground">Generate optimized thumbnails for selected videos</p>
              </div>
            </div>
            <UpgradePrompt
              feature="BULK_VIDEO_OPERATIONS"
              description={getUpgradeMessage('BULK_VIDEO_OPERATIONS')}
              requiredPlan="Professional"
              currentPlan="Starter"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Bulk Operations
          <Badge variant="secondary">Pro</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedVideos.length === videos.length && videos.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All ({videos.length} videos)
            </label>
          </div>
          <Badge variant="outline">
            {selectedVideos.length} selected
          </Badge>
        </div>

        {/* Video List with Checkboxes */}
        <div className="max-h-60 overflow-y-auto space-y-2">
          {videos.map((video) => (
            <div key={video.id} className="flex items-center space-x-2 p-2 border rounded">
              <Checkbox
                id={video.id}
                checked={selectedVideos.includes(video.id)}
                onCheckedChange={(checked) => handleSelectVideo(video.id, checked as boolean)}
              />
              <label htmlFor={video.id} className="text-sm flex-1 cursor-pointer">
                <div className="font-medium truncate">{video.title}</div>
                <div className="text-xs text-muted-foreground capitalize">{video.status}</div>
              </label>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('optimize')}
            disabled={selectedVideos.length === 0}
          >
            AI Optimize ({selectedVideos.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('thumbnails')}
            disabled={selectedVideos.length === 0}
          >
            Generate Thumbnails ({selectedVideos.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('publish')}
            disabled={selectedVideos.length === 0}
          >
            Bulk Publish ({selectedVideos.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}