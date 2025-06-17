-- Add last_synced column to youtube_channels
ALTER TABLE youtube_channels
ADD COLUMN IF NOT EXISTS last_synced TIMESTAMP WITH TIME ZONE;

-- Create videos table if it doesn't exist
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES youtube_channels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    duration TEXT,
    status TEXT DEFAULT 'private',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for videos
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own videos"
    ON videos FOR SELECT
    USING (
        channel_id IN (
            SELECT id FROM youtube_channels
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own videos"
    ON videos FOR INSERT
    WITH CHECK (
        channel_id IN (
            SELECT id FROM youtube_channels
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own videos"
    ON videos FOR UPDATE
    USING (
        channel_id IN (
            SELECT id FROM youtube_channels
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own videos"
    ON videos FOR DELETE
    USING (
        channel_id IN (
            SELECT id FROM youtube_channels
            WHERE user_id = auth.uid()
        )
    ); 