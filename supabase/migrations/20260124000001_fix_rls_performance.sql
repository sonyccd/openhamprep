-- Migration: Fix RLS policy performance issues
-- 1. Wrap auth.uid() calls in (select ...) to avoid per-row evaluation
-- 2. Consolidate multiple permissive policies into single policies with OR conditions
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

-- ============================================================================
-- ALERT_RULES TABLE - Consolidate admin + service_role policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all alert rules" ON public.alert_rules;
DROP POLICY IF EXISTS "Admins can insert alert rules" ON public.alert_rules;
DROP POLICY IF EXISTS "Admins can update alert rules" ON public.alert_rules;
DROP POLICY IF EXISTS "Admins can delete alert rules" ON public.alert_rules;
DROP POLICY IF EXISTS "Service role can view all alert rules" ON public.alert_rules;

-- Recreate with optimized auth function calls and consolidated policies
CREATE POLICY "Admin or service role can view alert rules"
  ON public.alert_rules FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert alert rules"
  ON public.alert_rules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update alert rules"
  ON public.alert_rules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete alert rules"
  ON public.alert_rules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- ALERTS TABLE - Consolidate admin + service_role policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can delete alerts" ON public.alerts;
DROP POLICY IF EXISTS "Service role can view all alerts" ON public.alerts;
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Service role can update alerts" ON public.alerts;

-- Recreate with consolidated policies
CREATE POLICY "Admin or service role can view alerts"
  ON public.alerts FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admin or service role can insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admin or service role can update alerts"
  ON public.alerts FOR UPDATE
  USING (
    (select auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete alerts"
  ON public.alerts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- SYSTEM_MONITOR_RUNS TABLE - Consolidate admin + service_role policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view monitor runs" ON public.system_monitor_runs;
DROP POLICY IF EXISTS "Service role can manage monitor runs" ON public.system_monitor_runs;

-- Recreate with consolidated policy for SELECT, keep service_role for ALL
CREATE POLICY "Admin or service role can view monitor runs"
  ON public.system_monitor_runs FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Service role needs INSERT/UPDATE/DELETE for the cron job
CREATE POLICY "Service role can manage monitor runs"
  ON public.system_monitor_runs FOR ALL
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- EVENTS TABLE - Fix auth.uid() calls
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users insert own events" ON public.events;
DROP POLICY IF EXISTS "Users read own events" ON public.events;

-- Recreate with optimized auth function calls
CREATE POLICY "Users insert own events"
  ON public.events FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users read own events"
  ON public.events FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- DAILY_ACTIVITY TABLE - Fix auth.uid() calls
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own daily_activity" ON public.daily_activity;
DROP POLICY IF EXISTS "Users can insert own daily_activity" ON public.daily_activity;
DROP POLICY IF EXISTS "Users can update own daily_activity" ON public.daily_activity;

-- Recreate with optimized auth function calls
CREATE POLICY "Users can view own daily_activity"
  ON public.daily_activity FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own daily_activity"
  ON public.daily_activity FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own daily_activity"
  ON public.daily_activity FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- DAILY_STREAKS TABLE - Fix auth.uid() calls
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own daily_streaks" ON public.daily_streaks;

-- Recreate with optimized auth function call
CREATE POLICY "Users can view own daily_streaks"
  ON public.daily_streaks FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- Add comments documenting the optimization
-- ============================================================================

COMMENT ON POLICY "Admin or service role can view alert rules" ON public.alert_rules IS
  'Consolidated policy for admin and service_role SELECT. Uses (select auth.uid()) for performance.';

COMMENT ON POLICY "Admin or service role can view alerts" ON public.alerts IS
  'Consolidated policy for admin and service_role SELECT. Uses (select auth.uid()) for performance.';

COMMENT ON POLICY "Admin or service role can view monitor runs" ON public.system_monitor_runs IS
  'Consolidated policy for admin and service_role SELECT. Uses (select auth.uid()) for performance.';
