-- Create pg_cron job to invoke system-monitor Edge Function every 5 minutes
-- This migration depends on pg_cron and pg_net extensions being enabled
--
-- ============================================================
-- REQUIRED CONFIGURATION (per environment):
-- ============================================================
-- These settings must be configured for each environment after migration:
--
-- Production:
--   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://wghfvormohhmqijcxbzq.supabase.co';
--   ALTER DATABASE postgres SET app.settings.service_role_key = '<your-service-role-key>';
--
-- Preview branches: Set automatically by Supabase preview infrastructure
-- Local development: Set in local Supabase config or via SQL
--
-- To verify settings:
--   SELECT current_setting('app.settings.supabase_url', true);
--   SELECT current_setting('app.settings.service_role_key', true);
-- ============================================================

-- ============================================================
-- 1. CREATE THE CRON JOB
-- ============================================================

-- First, remove any existing job with the same name (idempotent)
SELECT cron.unschedule('system-monitor-check')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'system-monitor-check'
);

-- Schedule the system-monitor function to run every 5 minutes
-- Uses pg_net to make HTTP request to the Edge Function
-- NOTE: Will fail loudly if app.settings.supabase_url is not configured
SELECT cron.schedule(
  'system-monitor-check',  -- job name
  '*/5 * * * *',           -- every 5 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/system-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- ============================================================
-- 2. HELPER FUNCTION FOR MANUAL TRIGGER
-- ============================================================

-- Create a function that admins can call to manually trigger the monitor
-- This is useful for testing or when you want an immediate check
-- Includes rate limiting to prevent abuse
CREATE OR REPLACE FUNCTION public.trigger_system_monitor()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Rate limiting: prevent triggering if a monitor run started within the last minute
  IF EXISTS (
    SELECT 1 FROM public.system_monitor_runs
    WHERE started_at > now() - interval '1 minute'
      AND status = 'running'
  ) THEN
    RAISE EXCEPTION 'Monitor already running. Please wait for it to complete.';
  END IF;

  -- Make HTTP request to the Edge Function
  -- NOTE: Requires app.settings.supabase_url and app.settings.service_role_key to be configured
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/system-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )::TEXT::JSONB INTO result;

  RETURN result;
END;
$$;

-- Grant execute to authenticated users (admin check is inside the function)
GRANT EXECUTE ON FUNCTION public.trigger_system_monitor() TO authenticated;

-- ============================================================
-- 3. MONITORING METADATA TABLE
-- ============================================================

-- Track the last successful monitor run for observability
CREATE TABLE IF NOT EXISTS public.system_monitor_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  rules_evaluated INTEGER,
  alerts_created INTEGER,
  alerts_auto_resolved INTEGER,
  logs_analyzed INTEGER,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keep only last 100 runs to avoid unbounded growth
CREATE INDEX IF NOT EXISTS idx_monitor_runs_started ON public.system_monitor_runs(started_at DESC);

-- Enable RLS
ALTER TABLE public.system_monitor_runs ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can view monitor runs"
  ON public.system_monitor_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can insert/update
CREATE POLICY "Service role can manage monitor runs"
  ON public.system_monitor_runs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 4. CLEANUP OLD RUNS (keep last 100)
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_monitor_runs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete runs older than the 100 most recent
  DELETE FROM public.system_monitor_runs
  WHERE id NOT IN (
    SELECT id FROM public.system_monitor_runs
    ORDER BY started_at DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_monitor_runs ON public.system_monitor_runs;
CREATE TRIGGER trg_cleanup_monitor_runs
  AFTER INSERT ON public.system_monitor_runs
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_monitor_runs();

-- ============================================================
-- 5. DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.system_monitor_runs IS 'Tracks execution history of the system-monitor Edge Function for observability.';
COMMENT ON FUNCTION public.trigger_system_monitor() IS 'Manually triggers the system-monitor Edge Function. Admin access required.';
