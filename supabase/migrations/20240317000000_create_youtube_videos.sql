-- Create youtube_videos table
CREATE TABLE IF NOT EXISTS public.youtube_videos (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES public.youtube_channels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    duration TEXT,
    status TEXT DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own videos"
    ON public.youtube_videos
    FOR SELECT
    USING (
        channel_id IN (
            SELECT id FROM public.youtube_channels
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own videos"
    ON public.youtube_videos
    FOR INSERT
    WITH CHECK (
        channel_id IN (
            SELECT id FROM public.youtube_channels
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own videos"
    ON public.youtube_videos
    FOR UPDATE
    USING (
        channel_id IN (
            SELECT id FROM public.youtube_channels
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        channel_id IN (
            SELECT id FROM public.youtube_channels
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own videos"
    ON public.youtube_videos
    FOR DELETE
    USING (
        channel_id IN (
            SELECT id FROM public.youtube_channels
            WHERE user_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS youtube_videos_channel_id_idx ON public.youtube_videos(channel_id);
CREATE INDEX IF NOT EXISTS youtube_videos_published_at_idx ON public.youtube_videos(published_at DESC); 