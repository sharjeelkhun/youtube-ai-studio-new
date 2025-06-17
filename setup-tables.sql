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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  subscriber_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, id)
);

-- Create videos table if it doesn't exist
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  channel_id TEXT REFERENCES youtube_channels(id) ON DELETE CASCADE NOT NULL,
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

-- Create RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create RLS policies for youtube_channels
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own channels"
  ON youtube_channels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channels"
  ON youtube_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels"
  ON youtube_channels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channels"
  ON youtube_channels FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for videos
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view videos from their channels"
  ON videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM youtube_channels
      WHERE youtube_channels.id = videos.channel_id
      AND youtube_channels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert videos to their channels"
  ON videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM youtube_channels
      WHERE youtube_channels.id = videos.channel_id
      AND youtube_channels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update videos from their channels"
  ON videos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM youtube_channels
      WHERE youtube_channels.id = videos.channel_id
      AND youtube_channels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete videos from their channels"
  ON videos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM youtube_channels
      WHERE youtube_channels.id = videos.channel_id
      AND youtube_channels.user_id = auth.uid()
    )
  );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
