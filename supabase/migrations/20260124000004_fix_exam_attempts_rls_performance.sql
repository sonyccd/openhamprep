-- Migration: Fix RLS performance on exam_attempts table
-- Prerequisite: 20260122000000_add_exam_attempts_and_target_license.sql
--
-- Issue: The original RLS policies use auth.uid() directly, which causes
-- per-row evaluation. Wrapping in (select ...) allows the planner to
-- evaluate once and use as a constant.
--
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Users can insert own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Users can update own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Users can delete own exam attempts" ON public.exam_attempts;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own exam attempts"
  ON public.exam_attempts
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own exam attempts"
  ON public.exam_attempts
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own exam attempts"
  ON public.exam_attempts
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own exam attempts"
  ON public.exam_attempts
  FOR DELETE
  USING ((select auth.uid()) = user_id);
