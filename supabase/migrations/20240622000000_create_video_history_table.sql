CREATE TABLE video_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (video_id) REFERENCES youtube_videos(id) ON DELETE CASCADE
);

ALTER TABLE video_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage their video history"
ON video_history
FOR ALL
USING (auth.uid() = (SELECT user_id FROM youtube_videos WHERE id = video_id))
WITH CHECK (auth.uid() = (SELECT user_id FROM youtube_videos WHERE id = video_id)); 