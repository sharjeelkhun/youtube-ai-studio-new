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

-- Set up RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;

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
