-- Migration: Add exam_attempts table and target_license to user_target_exam
-- Enables tracking historical exam outcomes and knowing which license level users are studying for

-- Create enum for exam outcomes
CREATE TYPE exam_outcome AS ENUM ('passed', 'failed', 'skipped');

-- Create enum for license types (reusable across tables)
CREATE TYPE license_type AS ENUM ('technician', 'general', 'extra');

-- Create exam_attempts table for historical tracking
CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  target_license license_type NOT NULL,
  outcome exam_outcome,
  -- Optional reference to the exam session (may be null if session was deleted or custom date was used)
  exam_session_id UUID REFERENCES public.exam_sessions(id) ON DELETE SET NULL,
  -- Optional user notes about their attempt
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for querying user's exam history
CREATE INDEX idx_exam_attempts_user_id ON public.exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_exam_date ON public.exam_attempts(exam_date);

-- Prevent duplicate attempts for same user/date/license combination
-- This ensures users can't accidentally record multiple attempts for the same exam
CREATE UNIQUE INDEX idx_exam_attempts_unique_user_date_license
  ON public.exam_attempts(user_id, exam_date, target_license);

-- Add target_license to user_target_exam
ALTER TABLE public.user_target_exam
  ADD COLUMN target_license license_type;

-- Set up RLS for exam_attempts
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own exam attempts
CREATE POLICY "Users can view own exam attempts"
  ON public.exam_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own exam attempts
CREATE POLICY "Users can insert own exam attempts"
  ON public.exam_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own exam attempts
CREATE POLICY "Users can update own exam attempts"
  ON public.exam_attempts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own exam attempts
CREATE POLICY "Users can delete own exam attempts"
  ON public.exam_attempts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at on exam_attempts
CREATE TRIGGER update_exam_attempts_updated_at
  BEFORE UPDATE ON public.exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment on tables and columns for documentation
COMMENT ON TABLE public.exam_attempts IS 'Historical record of user exam attempts with outcomes';
COMMENT ON COLUMN public.exam_attempts.outcome IS 'Result of the exam attempt - null if not yet recorded';
COMMENT ON COLUMN public.exam_attempts.target_license IS 'The license level the user was attempting';
COMMENT ON COLUMN public.user_target_exam.target_license IS 'The license level the user is currently studying for';
