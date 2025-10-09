-- Create content ideas table
CREATE TABLE IF NOT EXISTS content_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'saved', -- saved, in_progress, completed, archived
    metrics JSONB,
    metadata JSONB, -- For storing additional data like script outlines, research notes, etc.
    source TEXT NOT NULL DEFAULT 'ai_generated', -- ai_generated, user_created, imported
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content ideas"
    ON content_ideas
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content ideas"
    ON content_ideas
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content ideas"
    ON content_ideas
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content ideas"
    ON content_ideas
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_content_ideas_user_id ON content_ideas(user_id);
CREATE INDEX idx_content_ideas_type ON content_ideas(type);
CREATE INDEX idx_content_ideas_status ON content_ideas(status);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_ideas_updated_at
    BEFORE UPDATE ON content_ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();