-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
    id text PRIMARY KEY,
    channel_id text NOT NULL REFERENCES public.youtube_channels(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    thumbnail_url text,
    published_at timestamp with time zone,
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    duration text,
    status text DEFAULT 'private',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view videos from their channels"
    ON public.videos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.youtube_channels
            WHERE youtube_channels.id = videos.channel_id
            AND youtube_channels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert videos for their channels"
    ON public.videos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.youtube_channels
            WHERE youtube_channels.id = videos.channel_id
            AND youtube_channels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update videos from their channels"
    ON public.videos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.youtube_channels
            WHERE youtube_channels.id = videos.channel_id
            AND youtube_channels.user_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS videos_channel_id_idx ON public.videos(channel_id);
CREATE INDEX IF NOT EXISTS videos_published_at_idx ON public.videos(published_at DESC); 