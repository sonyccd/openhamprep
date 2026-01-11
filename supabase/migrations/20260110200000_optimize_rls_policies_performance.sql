-- Optimize RLS Policies for Performance
-- This migration addresses two performance issues:
-- 1. Auth RLS Initialization Plan: Wrapping auth.uid() in (SELECT ...) to avoid re-evaluation per row
-- 2. Multiple Permissive Policies: Consolidating duplicate SELECT policies

-- ============================================================
-- 1. FIX: readiness_config - Admin write access policy
-- ============================================================

DROP POLICY IF EXISTS "Admin write access for readiness_config" ON public.readiness_config;

CREATE POLICY "Admin write access for readiness_config"
  ON public.readiness_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================
-- 2. FIX: question_mastery - Optimize all policies
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own question mastery" ON public.question_mastery;
DROP POLICY IF EXISTS "Users can insert their own question mastery" ON public.question_mastery;
DROP POLICY IF EXISTS "Users can update their own question mastery" ON public.question_mastery;
DROP POLICY IF EXISTS "Admins can view all question mastery" ON public.question_mastery;

-- Create optimized user policies
CREATE POLICY "Users can view their own question mastery"
  ON public.question_mastery FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own question mastery"
  ON public.question_mastery FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own question mastery"
  ON public.question_mastery FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- Combine admin SELECT with user SELECT to avoid multiple permissive policies
-- Note: We remove the separate admin policy and modify the user SELECT to include admin check
DROP POLICY IF EXISTS "Users can view their own question mastery" ON public.question_mastery;

CREATE POLICY "Users and admins can view question mastery"
  ON public.question_mastery FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================
-- 3. FIX: user_readiness_cache - Optimize all policies
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own readiness cache" ON public.user_readiness_cache;
DROP POLICY IF EXISTS "Users can insert their own readiness cache" ON public.user_readiness_cache;
DROP POLICY IF EXISTS "Users can update their own readiness cache" ON public.user_readiness_cache;
DROP POLICY IF EXISTS "Admins can view all readiness cache" ON public.user_readiness_cache;

-- Create combined SELECT policy for users and admins
CREATE POLICY "Users and admins can view readiness cache"
  ON public.user_readiness_cache FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own readiness cache"
  ON public.user_readiness_cache FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own readiness cache"
  ON public.user_readiness_cache FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 4. FIX: user_readiness_snapshots - Optimize all policies
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own readiness snapshots" ON public.user_readiness_snapshots;
DROP POLICY IF EXISTS "Users can insert their own readiness snapshots" ON public.user_readiness_snapshots;
DROP POLICY IF EXISTS "Users can update their own readiness snapshots" ON public.user_readiness_snapshots;
DROP POLICY IF EXISTS "Admins can view all readiness snapshots" ON public.user_readiness_snapshots;

-- Create combined SELECT policy for users and admins
CREATE POLICY "Users and admins can view readiness snapshots"
  ON public.user_readiness_snapshots FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own readiness snapshots"
  ON public.user_readiness_snapshots FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own readiness snapshots"
  ON public.user_readiness_snapshots FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 5. FIX: ham_radio_tool_categories - Optimize admin policies
-- ============================================================

DROP POLICY IF EXISTS "Admins can insert ham radio tool categories" ON public.ham_radio_tool_categories;
DROP POLICY IF EXISTS "Admins can update ham radio tool categories" ON public.ham_radio_tool_categories;
DROP POLICY IF EXISTS "Admins can delete ham radio tool categories" ON public.ham_radio_tool_categories;

CREATE POLICY "Admins can insert ham radio tool categories"
  ON public.ham_radio_tool_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update ham radio tool categories"
  ON public.ham_radio_tool_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete ham radio tool categories"
  ON public.ham_radio_tool_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================
-- 6. FIX: ham_radio_tools - Optimize all policies and consolidate SELECT
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view published ham radio tools" ON public.ham_radio_tools;
DROP POLICY IF EXISTS "Admins can view all ham radio tools" ON public.ham_radio_tools;
DROP POLICY IF EXISTS "Admins can insert ham radio tools" ON public.ham_radio_tools;
DROP POLICY IF EXISTS "Admins can update ham radio tools" ON public.ham_radio_tools;
DROP POLICY IF EXISTS "Admins can delete ham radio tools" ON public.ham_radio_tools;

-- Create single SELECT policy that handles both public and admin access
CREATE POLICY "Public and admin can view ham radio tools"
  ON public.ham_radio_tools FOR SELECT
  USING (
    is_published = true
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert ham radio tools"
  ON public.ham_radio_tools FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update ham radio tools"
  ON public.ham_radio_tools FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete ham radio tools"
  ON public.ham_radio_tools FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================
-- 7. FIX: readiness_config - Consolidate duplicate SELECT policies
-- ============================================================

DROP POLICY IF EXISTS "Public read access for readiness_config" ON public.readiness_config;
-- The "Admin write access for readiness_config" already handles SELECT for admins via FOR ALL
-- We just need a public read policy that doesn't conflict

CREATE POLICY "Public read access for readiness_config"
  ON public.readiness_config FOR SELECT
  USING (true);

-- Note: The "Admin write access for readiness_config" policy uses FOR ALL which includes SELECT.
-- This creates a duplicate SELECT path. Let's fix by changing admin policy to specific operations.

DROP POLICY IF EXISTS "Admin write access for readiness_config" ON public.readiness_config;

-- Create separate admin policies for INSERT, UPDATE, DELETE only
CREATE POLICY "Admin insert access for readiness_config"
  ON public.readiness_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admin update access for readiness_config"
  ON public.readiness_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admin delete access for readiness_config"
  ON public.readiness_config FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );
