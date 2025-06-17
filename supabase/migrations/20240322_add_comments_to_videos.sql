-- Add comments column to videos table
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS comments integer DEFAULT 0;

-- Update RLS policies
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

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