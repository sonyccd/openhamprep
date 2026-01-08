-- Add content column to topics table for storing markdown content directly
-- This replaces the previous approach of storing content in Supabase Storage

ALTER TABLE public.topics
ADD COLUMN content TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.topics.content IS 'Markdown content for the topic article. Replaces content_path storage approach.';
