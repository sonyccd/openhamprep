-- Migration: Add ARRL textbook chapters and question references
-- This enables admins to assign ARRL book chapter and page references to questions,
-- and allows users to study by book chapter.

-- Create arrl_chapters table for textbook chapter definitions
CREATE TABLE IF NOT EXISTS public.arrl_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_type TEXT NOT NULL CHECK (license_type IN ('T', 'G', 'E')),
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(license_type, chapter_number)
);

-- Add columns to questions table for ARRL textbook references
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS arrl_chapter_id UUID REFERENCES public.arrl_chapters(id) ON DELETE SET NULL;

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS arrl_page_reference TEXT;

-- Enable RLS on arrl_chapters
ALTER TABLE public.arrl_chapters ENABLE ROW LEVEL SECURITY;

-- Public read access for chapters (anyone can view chapters)
CREATE POLICY "Public read access for arrl_chapters"
  ON public.arrl_chapters FOR SELECT
  USING (true);

-- Admin write access for chapters (only admins can create/update/delete)
-- Using (select auth.uid()) for optimal query performance per Supabase docs
CREATE POLICY "Admin insert access for arrl_chapters"
  ON public.arrl_chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admin update access for arrl_chapters"
  ON public.arrl_chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admin delete access for arrl_chapters"
  ON public.arrl_chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_questions_arrl_chapter_id
  ON public.questions(arrl_chapter_id);

CREATE INDEX IF NOT EXISTS idx_arrl_chapters_license_type
  ON public.arrl_chapters(license_type);

CREATE INDEX IF NOT EXISTS idx_arrl_chapters_display_order
  ON public.arrl_chapters(license_type, display_order);

-- Add comments for documentation
COMMENT ON TABLE public.arrl_chapters IS 'ARRL textbook chapters for each license type (Technician, General, Extra)';
COMMENT ON COLUMN public.arrl_chapters.license_type IS 'License type: T (Technician), G (General), E (Extra)';
COMMENT ON COLUMN public.arrl_chapters.chapter_number IS 'Chapter number in the ARRL textbook';
COMMENT ON COLUMN public.arrl_chapters.title IS 'Chapter title from the ARRL textbook';
COMMENT ON COLUMN public.arrl_chapters.description IS 'Optional description of what this chapter covers';
COMMENT ON COLUMN public.arrl_chapters.display_order IS 'Order for displaying chapters (allows custom ordering)';
COMMENT ON COLUMN public.questions.arrl_chapter_id IS 'Reference to ARRL textbook chapter this question appears in';
COMMENT ON COLUMN public.questions.arrl_page_reference IS 'Page reference in ARRL textbook (e.g., "45", "45-48", "45, 52")';
