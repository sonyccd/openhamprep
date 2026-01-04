-- NOTE: This migration was recorded as 'optimize_rls_policies' in production
-- but actually adds the figure_url column. Keeping production name for consistency.

-- Add figure_url column to questions table for storing Supabase Storage URLs
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS figure_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.questions.figure_url IS 'URL to a figure image in Supabase Storage (optional, for questions that reference figures like diagrams or schematics)';
