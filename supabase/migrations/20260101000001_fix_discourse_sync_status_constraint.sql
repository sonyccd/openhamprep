-- Fix discourse_sync_status constraint to match actual usage
-- NULL is used as the pending state, so 'pending' is not needed

-- Drop the old constraint
ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS discourse_sync_status_check;

-- Add updated constraint (NULL = pending, so we only need synced/error)
ALTER TABLE public.questions
  ADD CONSTRAINT discourse_sync_status_check
  CHECK (discourse_sync_status IN ('synced', 'error') OR discourse_sync_status IS NULL);

-- Update comment to clarify NULL = pending
COMMENT ON COLUMN public.questions.discourse_sync_status IS 'Discourse sync status: synced, error, or null (pending/never synced)';
