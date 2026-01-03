-- Migration: Add efficient chapter question counts function
-- This replaces fetching all questions and counting client-side with a server-side aggregation
--
-- Rollback instructions:
-- DROP FUNCTION IF EXISTS public.get_chapter_question_counts(text);

-- Create function to get question counts per chapter efficiently
-- Input validation restricts license_prefix to valid values (T, G, E) to prevent SQL injection
CREATE OR REPLACE FUNCTION public.get_chapter_question_counts(license_prefix text DEFAULT NULL)
RETURNS TABLE(chapter_id uuid, question_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Validate license_prefix to prevent SQL injection
  IF license_prefix IS NOT NULL AND license_prefix NOT IN ('T', 'G', 'E') THEN
    RAISE EXCEPTION 'Invalid license_prefix: must be T, G, E, or NULL';
  END IF;

  IF license_prefix IS NULL THEN
    RETURN QUERY
    SELECT q.arrl_chapter_id as chapter_id, COUNT(*) as question_count
    FROM public.questions q
    WHERE q.arrl_chapter_id IS NOT NULL
    GROUP BY q.arrl_chapter_id;
  ELSE
    RETURN QUERY
    SELECT q.arrl_chapter_id as chapter_id, COUNT(*) as question_count
    FROM public.questions q
    WHERE q.arrl_chapter_id IS NOT NULL
      AND q.display_name LIKE (license_prefix || '%')
    GROUP BY q.arrl_chapter_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION public.get_chapter_question_counts(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chapter_question_counts(text) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_chapter_question_counts IS 'Returns question counts per chapter, optionally filtered by license prefix (T, G, E)';
