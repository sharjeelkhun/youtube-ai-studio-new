-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create youtube_channels table if it doesn't exist
CREATE TABLE IF NOT EXISTS youtube_channels (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  subscribers INTEGER,
  videos INTEGER,
  thumbnail TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create videos table if it doesn't exist
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  channel_id TEXT REFERENCES youtube_channels(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  status TEXT,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS analytics_data (
  id SERIAL PRIMARY KEY,
  channel_id TEXT REFERENCES youtube_channels(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE,
  views INTEGER,
  watch_time INTEGER,
  engagement INTEGER,
  subscribers INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enum for idea status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE idea_status AS ENUM ('saved', 'in_progress', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for idea type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE idea_type AS ENUM ('video_idea', 'script_outline', 'series_idea', 'collaboration_idea', 'tutorial_idea');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for idea source if it doesn't exist
DO $$ BEGIN
    CREATE TYPE idea_source AS ENUM ('ai_generated', 'user_created', 'imported');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create content ideas table if it doesn't exist
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type idea_type NOT NULL DEFAULT 'video_idea',
  status idea_status NOT NULL DEFAULT 'saved',
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  source idea_source NOT NULL DEFAULT 'user_created',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT content_ideas_title_user_id_key UNIQUE (title, user_id)
);

-- Add indexes for content ideas
CREATE INDEX IF NOT EXISTS idx_content_ideas_user_id ON content_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_type ON content_ideas(type);
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON content_ideas(status);

-- Set up RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policies for youtube_channels
CREATE POLICY IF NOT EXISTS "Users can view their own channels"
  ON youtube_channels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own channels"
  ON youtube_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own channels"
  ON youtube_channels FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for videos
CREATE POLICY IF NOT EXISTS "Users can view videos from their channels"
  ON videos FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM youtube_channels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert videos to their channels"
  ON videos FOR INSERT
  WITH CHECK (
    channel_id IN (
      SELECT id FROM youtube_channels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update videos from their channels"
  ON videos FOR UPDATE
  USING (
    channel_id IN (
      SELECT id FROM youtube_channels WHERE user_id = auth.uid()
    )
  );

-- Create policies for analytics_data
CREATE POLICY IF NOT EXISTS "Users can view analytics from their channels"
  ON analytics_data FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM youtube_channels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert analytics to their channels"
  ON analytics_data FOR INSERT
  WITH CHECK (
    channel_id IN (
      SELECT id FROM youtube_channels WHERE user_id = auth.uid()
    )
  );

-- Create policies for content_ideas
CREATE POLICY IF NOT EXISTS "Users can view their own content ideas"
  ON content_ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own content ideas"
  ON content_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own content ideas"
  ON content_ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own content ideas"
  ON content_ideas FOR DELETE
  USING (auth.uid() = user_id);

-- Add function for updating content_ideas updated_at
CREATE OR REPLACE FUNCTION update_content_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updating content_ideas updated_at
DROP TRIGGER IF EXISTS update_content_ideas_updated_at ON content_ideas;
CREATE TRIGGER update_content_ideas_updated_at
  BEFORE UPDATE ON content_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_content_ideas_updated_at();
