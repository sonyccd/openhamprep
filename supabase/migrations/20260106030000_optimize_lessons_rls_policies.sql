-- Migration to optimize RLS policies for lessons-related tables
-- Fixes auth_rls_initplan warnings by using has_role() function with subqueries
-- Fixes multiple_permissive_policies warnings by consolidating overlapping SELECT policies
-- Follows pattern established in 20260102164536_optimize_topic_rls_policies.sql

-- ============================================
-- LESSONS TABLE
-- Issues: auth_rls_initplan (4 policies), multiple_permissive_policies (SELECT)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can view all lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can delete lessons" ON public.lessons;

-- Consolidated SELECT policy: published lessons OR admin
CREATE POLICY "Anyone can view published lessons or admins can view all"
  ON public.lessons FOR SELECT
  USING (
    is_published = true
    OR has_role((select auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Admins can insert lessons"
  ON public.lessons FOR INSERT
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update lessons"
  ON public.lessons FOR UPDATE
  USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete lessons"
  ON public.lessons FOR DELETE
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- LESSON_TOPICS TABLE
-- Issues: auth_rls_initplan (4 policies)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view lesson topics" ON public.lesson_topics;
DROP POLICY IF EXISTS "Admins can insert lesson topics" ON public.lesson_topics;
DROP POLICY IF EXISTS "Admins can update lesson topics" ON public.lesson_topics;
DROP POLICY IF EXISTS "Admins can delete lesson topics" ON public.lesson_topics;

-- View policy: published lessons OR admin
CREATE POLICY "Anyone can view lesson topics"
  ON public.lesson_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_topics.lesson_id AND lessons.is_published = true
    )
    OR has_role((select auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Admins can insert lesson topics"
  ON public.lesson_topics FOR INSERT
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update lesson topics"
  ON public.lesson_topics FOR UPDATE
  USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete lesson topics"
  ON public.lesson_topics FOR DELETE
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- LESSON_PROGRESS TABLE
-- Issues: auth_rls_initplan (5 policies), multiple_permissive_policies (SELECT)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can insert their own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can update their own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can delete their own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Admins can view all lesson progress" ON public.lesson_progress;

-- Consolidated SELECT policy: own progress OR admin
CREATE POLICY "Users can view own lesson progress or admins can view all"
  ON public.lesson_progress FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR has_role((select auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Users can insert their own lesson progress"
  ON public.lesson_progress FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own lesson progress"
  ON public.lesson_progress FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own lesson progress"
  ON public.lesson_progress FOR DELETE
  USING (user_id = (select auth.uid()));
