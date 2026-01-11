-- Migration: Add custom exam date support
-- Allows users to set a custom exam date when they can't find their session in the ARRL database

-- Add custom_exam_date column for user-specified exam dates
ALTER TABLE public.user_target_exam
  ADD COLUMN custom_exam_date DATE;

-- Make exam_session_id nullable (to allow custom dates without ARRL session)
ALTER TABLE public.user_target_exam
  ALTER COLUMN exam_session_id DROP NOT NULL;

-- Add constraint: must have either exam_session_id OR custom_exam_date (not both, not neither)
ALTER TABLE public.user_target_exam
  ADD CONSTRAINT check_exam_date_source
  CHECK (
    (exam_session_id IS NOT NULL AND custom_exam_date IS NULL) OR
    (exam_session_id IS NULL AND custom_exam_date IS NOT NULL)
  );

-- Update the foreign key to SET NULL on delete
-- This way if an ARRL session is deleted, the user doesn't lose their entire target
-- (though they would need to re-select or set a custom date)
ALTER TABLE public.user_target_exam
  DROP CONSTRAINT user_target_exam_exam_session_id_fkey;

ALTER TABLE public.user_target_exam
  ADD CONSTRAINT user_target_exam_exam_session_id_fkey
  FOREIGN KEY (exam_session_id)
  REFERENCES public.exam_sessions(id)
  ON DELETE SET NULL;
