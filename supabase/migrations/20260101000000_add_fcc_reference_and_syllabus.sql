-- Add fcc_reference and figure_reference columns to questions table
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS fcc_reference TEXT;

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS figure_reference TEXT;

-- Create syllabus table for subelement/group descriptions
CREATE TABLE IF NOT EXISTS public.syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,           -- "T1", "T1A", "G2B", etc.
  title TEXT NOT NULL,                  -- Description text
  license_type TEXT NOT NULL,           -- "T", "G", "E"
  type TEXT NOT NULL,                   -- "subelement" or "group"
  exam_questions INTEGER,               -- Number of exam questions (subelements only)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.syllabus ENABLE ROW LEVEL SECURITY;

-- Public read access for syllabus
CREATE POLICY "Public read access for syllabus"
  ON public.syllabus FOR SELECT
  USING (true);

-- Admin write access for syllabus
CREATE POLICY "Admin write access for syllabus"
  ON public.syllabus FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.syllabus IS 'Stores NCVEC syllabus information including subelement and group descriptions';
COMMENT ON COLUMN public.questions.fcc_reference IS 'FCC Part 97 rule reference, e.g., "97.1", "97.3(a)(22)"';
COMMENT ON COLUMN public.questions.figure_reference IS 'Figure reference for questions with diagrams, e.g., "T-1", "G7-1"';
