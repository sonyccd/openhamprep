-- Migration to optimize RLS policies for topic-related tables
-- Fixes auth_rls_initplan warnings by wrapping auth.uid() in subqueries
-- Fixes multiple_permissive_policies warnings by consolidating overlapping SELECT policies
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================
-- TOPICS TABLE
-- Issues: auth_rls_initplan (4 policies), multiple_permissive_policies (SELECT)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view published topics" ON public.topics;
DROP POLICY IF EXISTS "Admins can view all topics" ON public.topics;
DROP POLICY IF EXISTS "Admins can insert topics" ON public.topics;
DROP POLICY IF EXISTS "Admins can update topics" ON public.topics;
DROP POLICY IF EXISTS "Admins can delete topics" ON public.topics;

-- Consolidated SELECT policy: published topics OR admin
CREATE POLICY "Anyone can view published topics or admins can view all"
  ON public.topics FOR SELECT
  USING (
    is_published = true
    OR has_role((select auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Admins can insert topics"
  ON public.topics FOR INSERT
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update topics"
  ON public.topics FOR UPDATE
  USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete topics"
  ON public.topics FOR DELETE
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- TOPIC_SUBELEMENTS TABLE
-- Issues: auth_rls_initplan (4 policies)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view topic subelements" ON public.topic_subelements;
DROP POLICY IF EXISTS "Admins can insert topic subelements" ON public.topic_subelements;
DROP POLICY IF EXISTS "Admins can update topic subelements" ON public.topic_subelements;
DROP POLICY IF EXISTS "Admins can delete topic subelements" ON public.topic_subelements;

-- View policy: published topics OR admin
CREATE POLICY "Anyone can view topic subelements"
  ON public.topic_subelements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.topics
      WHERE topics.id = topic_subelements.topic_id AND topics.is_published = true
    )
    OR has_role((select auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Admins can insert topic subelements"
  ON public.topic_subelements FOR INSERT
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update topic subelements"
  ON public.topic_subelements FOR UPDATE
  USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete topic subelements"
  ON public.topic_subelements FOR DELETE
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- TOPIC_RESOURCES TABLE
-- Issues: auth_rls_initplan (4 policies)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view topic resources" ON public.topic_resources;
DROP POLICY IF EXISTS "Admins can insert topic resources" ON public.topic_resources;
DROP POLICY IF EXISTS "Admins can update topic resources" ON public.topic_resources;
DROP POLICY IF EXISTS "Admins can delete topic resources" ON public.topic_resources;

-- View policy: published topics OR admin
CREATE POLICY "Anyone can view topic resources"
  ON public.topic_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.topics
      WHERE topics.id = topic_resources.topic_id AND topics.is_published = true
    )
    OR has_role((select auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Admins can insert topic resources"
  ON public.topic_resources FOR INSERT
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update topic resources"
  ON public.topic_resources FOR UPDATE
  USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete topic resources"
  ON public.topic_resources FOR DELETE
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- TOPIC_PROGRESS TABLE
-- Issues: auth_rls_initplan (5 policies), multiple_permissive_policies (SELECT)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own topic progress" ON public.topic_progress;
DROP POLICY IF EXISTS "Users can insert their own topic progress" ON public.topic_progress;
DROP POLICY IF EXISTS "Users can update their own topic progress" ON public.topic_progress;
DROP POLICY IF EXISTS "Users can delete their own topic progress" ON public.topic_progress;
DROP POLICY IF EXISTS "Admins can view all topic progress" ON public.topic_progress;

-- Consolidated SELECT policy: own progress OR admin
CREATE POLICY "Users can view own progress or admins can view all"
  ON public.topic_progress FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR has_role((select auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Users can insert their own topic progress"
  ON public.topic_progress FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own topic progress"
  ON public.topic_progress FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own topic progress"
  ON public.topic_progress FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================
-- TOPIC_QUESTIONS TABLE
-- Issues: auth_rls_initplan (3 policies)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view topic questions for published topics" ON public.topic_questions;
DROP POLICY IF EXISTS "Admins can insert topic questions" ON public.topic_questions;
DROP POLICY IF EXISTS "Admins can delete topic questions" ON public.topic_questions;

-- View policy: published topics OR admin
CREATE POLICY "Anyone can view topic questions for published topics"
  ON public.topic_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.topics
      WHERE topics.id = topic_questions.topic_id AND topics.is_published = true
    )
    OR has_role((select auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Admins can insert topic questions"
  ON public.topic_questions FOR INSERT
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete topic questions"
  ON public.topic_questions FOR DELETE
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- EXAM_SESSIONS TABLE
-- Issues: multiple_permissive_policies (SELECT)
-- The previous migration (20251218) created "Admins can manage exam sessions" FOR ALL
-- which overlaps with "Exam sessions are publicly readable" FOR SELECT from the original table
-- Solution: Keep public SELECT, split admin FOR ALL into separate INSERT/UPDATE/DELETE
-- ============================================
DROP POLICY IF EXISTS "Exam sessions are publicly readable" ON public.exam_sessions;
DROP POLICY IF EXISTS "Admins can manage exam sessions" ON public.exam_sessions;

-- Public read access (anyone can search for exam locations)
CREATE POLICY "Exam sessions are publicly readable"
  ON public.exam_sessions FOR SELECT
  USING (true);

-- Separate admin policies for write operations only
CREATE POLICY "Admins can insert exam sessions"
  ON public.exam_sessions FOR INSERT
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update exam sessions"
  ON public.exam_sessions FOR UPDATE
  USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete exam sessions"
  ON public.exam_sessions FOR DELETE
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- EXPLANATION_FEEDBACK TABLE
-- Issues: multiple_permissive_policies (SELECT)
-- The previous migration (20251218) created separate user + admin SELECT policies
-- which triggers the multiple_permissive_policies warning
-- Solution: Consolidate into single SELECT policy, keep other user policies intact
-- ============================================
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.explanation_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.explanation_feedback;

-- Consolidated SELECT policy: own feedback OR admin (fixes multiple_permissive_policies)
CREATE POLICY "Users can view own feedback or admins can view all"
  ON public.explanation_feedback FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR has_role((select auth.uid()), 'admin'::app_role)
  );

-- Note: INSERT/UPDATE/DELETE policies remain from 20251218 migration:
-- - "Users can insert their own feedback"
-- - "Users can update their own feedback"
-- - "Users can delete their own feedback"

-- ============================================
-- SYLLABUS TABLE
-- Issues: auth_rls_initplan (1 policy), multiple_permissive_policies (SELECT)
-- The "Admin write access for syllabus" FOR ALL overlaps with public SELECT
-- ============================================
DROP POLICY IF EXISTS "Public read access for syllabus" ON public.syllabus;
DROP POLICY IF EXISTS "Admin write access for syllabus" ON public.syllabus;

-- Public read access
CREATE POLICY "Public read access for syllabus"
  ON public.syllabus FOR SELECT
  USING (true);

-- Separate admin policies for write operations
CREATE POLICY "Admins can insert syllabus"
  ON public.syllabus FOR INSERT
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update syllabus"
  ON public.syllabus FOR UPDATE
  USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete syllabus"
  ON public.syllabus FOR DELETE
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- MAPBOX_USAGE TABLE
-- Issues: auth_rls_initplan (1 policy), multiple_permissive_policies (SELECT)
-- The "Admins can manage mapbox usage" FOR ALL overlaps with authenticated SELECT
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view mapbox usage" ON public.mapbox_usage;
DROP POLICY IF EXISTS "Admins can manage mapbox usage" ON public.mapbox_usage;

-- Authenticated users can view usage (to check quota)
-- Note: TO authenticated preserved from original policy to maintain same access scope
CREATE POLICY "Authenticated users can view mapbox usage"
  ON public.mapbox_usage FOR SELECT
  TO authenticated
  USING (true);

-- Separate admin policies for write operations
-- Note: TO authenticated preserved from original policy
CREATE POLICY "Admins can insert mapbox usage"
  ON public.mapbox_usage FOR INSERT
  TO authenticated
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update mapbox usage"
  ON public.mapbox_usage FOR UPDATE
  TO authenticated
  USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete mapbox usage"
  ON public.mapbox_usage FOR DELETE
  TO authenticated
  USING (has_role((select auth.uid()), 'admin'::app_role));

