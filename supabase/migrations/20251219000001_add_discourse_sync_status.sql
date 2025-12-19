-- Add sync status columns to questions table for tracking Discourse sync state
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS discourse_sync_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discourse_sync_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discourse_sync_error TEXT DEFAULT NULL;

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'discourse_sync_status_check'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT discourse_sync_status_check
      CHECK (discourse_sync_status IN ('synced', 'error', 'pending') OR discourse_sync_status IS NULL);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.questions.discourse_sync_status IS 'Discourse sync status: synced, error, pending, or null if never synced';
COMMENT ON COLUMN public.questions.discourse_sync_at IS 'Timestamp of last Discourse sync attempt';
COMMENT ON COLUMN public.questions.discourse_sync_error IS 'Error message from last failed sync attempt';

-- Create index for filtering by sync status (useful for admin views)
CREATE INDEX IF NOT EXISTS idx_questions_discourse_sync_status
  ON public.questions(discourse_sync_status)
  WHERE discourse_sync_status IS NOT NULL;
