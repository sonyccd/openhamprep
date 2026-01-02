-- =============================================================================
-- Fix Database Security Issues
--
-- 1. Replace discourse_sync_overview view with admin-only RPC function
--    (fixes security_definer_view warning)
-- 2. Add search_path to update_topics_updated_at function
--    (fixes function_search_path_mutable warning)
-- =============================================================================

-- =============================================================================
-- Fix 1: Replace discourse_sync_overview view with admin-only RPC function
-- =============================================================================

-- Drop the insecure view
DROP VIEW IF EXISTS public.discourse_sync_overview;

-- Create admin-only RPC function with proper security
CREATE OR REPLACE FUNCTION public.get_discourse_sync_overview()
RETURNS TABLE (
  license_type text,
  total_questions bigint,
  with_forum_url bigint,
  without_forum_url bigint,
  synced bigint,
  errors bigint,
  pending bigint,
  needs_verification bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Explicit admin check - raises error for non-admins
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    CASE
      WHEN display_name LIKE 'T%' THEN 'Technician'
      WHEN display_name LIKE 'G%' THEN 'General'
      WHEN display_name LIKE 'E%' THEN 'Extra'
    END::text as license_type,
    COUNT(*)::bigint as total_questions,
    COUNT(forum_url)::bigint as with_forum_url,
    (COUNT(*) - COUNT(forum_url))::bigint as without_forum_url,
    COUNT(CASE WHEN discourse_sync_status = 'synced' THEN 1 END)::bigint as synced,
    COUNT(CASE WHEN discourse_sync_status = 'error' THEN 1 END)::bigint as errors,
    COUNT(CASE WHEN discourse_sync_status = 'pending' THEN 1 END)::bigint as pending,
    COUNT(CASE WHEN forum_url IS NOT NULL AND discourse_sync_status IS NULL THEN 1 END)::bigint as needs_verification
  FROM public.questions
  GROUP BY 1;
END;
$$;

-- Grant execute to authenticated (admin check is inside the function)
GRANT EXECUTE ON FUNCTION public.get_discourse_sync_overview() TO authenticated;

COMMENT ON FUNCTION public.get_discourse_sync_overview() IS
  'Admin-only RPC: Returns aggregated Discourse sync status by license type';

-- =============================================================================
-- Fix 2: Add search_path to update_topics_updated_at function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_topics_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- Fix 3: Add search_path to increment_mapbox_usage function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_mapbox_usage(p_year_month TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.mapbox_usage (year_month, request_count, last_updated_at)
  VALUES (p_year_month, 1, pg_catalog.now())
  ON CONFLICT (year_month)
  DO UPDATE SET
    request_count = public.mapbox_usage.request_count + 1,
    last_updated_at = pg_catalog.now()
  RETURNING request_count INTO new_count;

  RETURN new_count;
END;
$$;
