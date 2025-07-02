-- Create the youtube_channels table
CREATE TABLE IF NOT EXISTS public.youtube_channels (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT,
    description TEXT,
    thumbnail TEXT,
    subscriber_count BIGINT DEFAULT 0,
    video_count BIGINT DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    last_synced TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up RLS policies for youtube_channels
ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channels"
    ON public.youtube_channels FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own channels"
    ON public.youtube_channels FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own channels"
    ON public.youtube_channels FOR UPDATE
    USING (auth.uid() = user_id);

-- Create the videos table
CREATE TABLE IF NOT EXISTS public.videos (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES youtube_channels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    published_at TIMESTAMPTZ,
    views BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    status TEXT,
    last_synced TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up RLS policies for videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own videos"
    ON public.videos FOR SELECT
    USING (channel_id IN (SELECT id FROM youtube_channels WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own videos"
    ON public.videos FOR INSERT
    WITH CHECK (channel_id IN (SELECT id FROM youtube_channels WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own videos"
    ON public.videos FOR UPDATE
    USING (channel_id IN (SELECT id FROM youtube_channels WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own videos"
    ON public.videos FOR DELETE
    USING (channel_id IN (SELECT id FROM youtube_channels WHERE user_id = auth.uid())); 