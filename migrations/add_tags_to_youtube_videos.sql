-- Add tags column to youtube_videos table
ALTER TABLE youtube_videos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Update RLS policies to include tags
ALTER POLICY "Users can update videos from their channels" ON youtube_videos
USING (
  EXISTS (
    SELECT 1 FROM youtube_channels
    WHERE youtube_channels.id = youtube_videos.channel_id
    AND youtube_channels.user_id = auth.uid()
  )
); 