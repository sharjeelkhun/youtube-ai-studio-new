"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Video {
  id: string
  title: string
  description?: string | null
  status: string
  thumbnail_url?: string | null
  published_at?: string | null
  view_count?: number
  like_count?: number
  comment_count?: number
}

interface VideoEditorProps {
  video: Video
  onSave: (video: Video) => void
}

export function VideoEditor({ video, onSave }: VideoEditorProps) {
  const [editedVideo, setEditedVideo] = useState<Video>(video)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = createClientComponentClient()
      const { error } = await supabase
        .from('youtube_videos')
        .update({
          title: editedVideo.title,
          description: editedVideo.description,
          status: editedVideo.status
        })
        .eq('id', video.id)

      if (error) throw error

      onSave(editedVideo)
      toast.success('Success', {
        description: 'Video details updated successfully'
      })
    } catch (error) {
      console.error('Error saving video:', error)
      toast.error('Error', {
        description: 'Failed to update video details'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Tabs defaultValue="basic" className="space-y-4">
      <TabsList>
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
    <Card>
      <CardHeader>
            <CardTitle>Basic Information</CardTitle>
      </CardHeader>
          <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedVideo.title}
                onChange={(e) => setEditedVideo({ ...editedVideo, title: e.target.value })}
              />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
                value={editedVideo.description || ''}
                onChange={(e) => setEditedVideo({ ...editedVideo, description: e.target.value })}
                rows={5}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
              <Select
                value={editedVideo.status}
                onValueChange={(value) => setEditedVideo({ ...editedVideo, status: value })}
              >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
            </SelectContent>
          </Select>
        </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="advanced" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
        <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
            <Input
                id="thumbnail"
                value={editedVideo.thumbnail_url || ''}
                onChange={(e) => setEditedVideo({ ...editedVideo, thumbnail_url: e.target.value })}
              />
          </div>
            <div className="space-y-2">
              <Label htmlFor="publish-date">Publish Date</Label>
              <Input
                id="publish-date"
                type="datetime-local"
                value={editedVideo.published_at || ''}
                onChange={(e) => setEditedVideo({ ...editedVideo, published_at: e.target.value })}
              />
          </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seo" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
        <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Enter tags separated by commas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                </SelectContent>
              </Select>
        </div>
      </CardContent>
        </Card>
      </TabsContent>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Tabs>
  )
}
