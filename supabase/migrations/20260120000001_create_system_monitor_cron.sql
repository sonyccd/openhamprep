-- System monitor runs table for tracking edge function execution history
-- The actual cron job is configured in Supabase Dashboard (Cron Jobs > system-monitor-check)
-- which directly invokes the system-monitor edge function every 5 minutes

-- ============================================================
-- 0. CLEANUP OLD FUNCTIONS
-- ============================================================
-- Remove the old RPC trigger function (no longer needed - cron is in Supabase Dashboard)
DROP FUNCTION IF EXISTS public.trigger_system_monitor();

-- ============================================================
-- 1. MONITORING METADATA TABLE
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
-- 2. CLEANUP OLD RUNS (keep last 100)
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_monitor_runs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  cutoff_time TIMESTAMPTZ;
BEGIN
  -- Find the timestamp of the 100th most recent run (more efficient than NOT IN)
  SELECT started_at INTO cutoff_time
  FROM public.system_monitor_runs
  ORDER BY started_at DESC
  OFFSET 100
  LIMIT 1;

  -- Delete runs older than the cutoff (if we have more than 100)
  IF cutoff_time IS NOT NULL THEN
    DELETE FROM public.system_monitor_runs
    WHERE started_at < cutoff_time;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_monitor_runs ON public.system_monitor_runs;
CREATE TRIGGER trg_cleanup_monitor_runs
  AFTER INSERT ON public.system_monitor_runs
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_monitor_runs();

-- ============================================================
-- 3. DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.system_monitor_runs IS 'Tracks execution history of the system-monitor Edge Function for observability.';
