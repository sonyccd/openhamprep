-- Add a view for efficient sync status queries in admin dashboard
-- This aggregates sync status by license type for quick overview

-- Drop first for idempotency (in case migration needs to be re-run)
DROP VIEW IF EXISTS public.discourse_sync_overview;

CREATE OR REPLACE VIEW public.discourse_sync_overview AS
SELECT
  CASE
    WHEN display_name LIKE 'T%' THEN 'Technician'
    WHEN display_name LIKE 'G%' THEN 'General'
    WHEN display_name LIKE 'E%' THEN 'Extra'
  END as license_type,
  COUNT(*) as total_questions,
  COUNT(forum_url) as with_forum_url,
  COUNT(*) - COUNT(forum_url) as without_forum_url,
  COUNT(CASE WHEN discourse_sync_status = 'synced' THEN 1 END) as synced,
  COUNT(CASE WHEN discourse_sync_status = 'error' THEN 1 END) as errors,
  COUNT(CASE WHEN discourse_sync_status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN forum_url IS NOT NULL AND discourse_sync_status IS NULL THEN 1 END) as needs_verification
FROM public.questions
GROUP BY 1;

-- Add comment for documentation
COMMENT ON VIEW public.discourse_sync_overview IS 'Aggregated view of Discourse sync status by license type for admin dashboard';

-- Grant access to authenticated users (admin check happens in application layer)
GRANT SELECT ON public.discourse_sync_overview TO authenticated;
