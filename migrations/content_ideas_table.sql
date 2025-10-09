-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
DO $$ 
BEGIN
    -- Create idea status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'idea_status') THEN
        CREATE TYPE idea_status AS ENUM ('saved', 'in_progress', 'completed', 'archived');
    END IF;
    
    -- Create idea type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'idea_type') THEN
        CREATE TYPE idea_type AS ENUM ('video_idea', 'script_outline', 'series_idea', 'collaboration_idea', 'tutorial_idea');
    END IF;
    
    -- Create idea source enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'idea_source') THEN
        CREATE TYPE idea_source AS ENUM ('ai_generated', 'user_created', 'imported');
    END IF;
END $$;

-- Drop existing table if it exists
DROP TABLE IF EXISTS content_ideas;

-- Create content ideas table
CREATE TABLE content_ideas (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_ideas_user_id ON content_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_type ON content_ideas(type);
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON content_ideas(status);

-- Enable Row Level Security
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own content ideas" ON content_ideas;
CREATE POLICY "Users can view their own content ideas"
    ON content_ideas FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own content ideas" ON content_ideas;
CREATE POLICY "Users can insert their own content ideas"
    ON content_ideas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own content ideas" ON content_ideas;
CREATE POLICY "Users can update their own content ideas"
    ON content_ideas FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own content ideas" ON content_ideas;
CREATE POLICY "Users can delete their own content ideas"
    ON content_ideas FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_content_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_content_ideas_updated_at ON content_ideas;
CREATE TRIGGER update_content_ideas_updated_at
    BEFORE UPDATE ON content_ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_content_ideas_updated_at();