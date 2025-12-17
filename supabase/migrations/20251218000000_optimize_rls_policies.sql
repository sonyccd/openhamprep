-- Migration to optimize RLS policies by wrapping auth.uid() in subqueries
-- This prevents re-evaluation of auth.uid() for each row, improving query performance
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================
-- PROFILES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = (select auth.uid()));

-- ============================================
-- PRACTICE_TEST_RESULTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view their own test results" ON public.practice_test_results;
DROP POLICY IF EXISTS "Users can insert their own test results" ON public.practice_test_results;

CREATE POLICY "Users can view their own test results"
  ON public.practice_test_results FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own test results"
  ON public.practice_test_results FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================
-- QUESTION_ATTEMPTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.question_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.question_attempts;

CREATE POLICY "Users can view their own attempts"
  ON public.question_attempts FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own attempts"
  ON public.question_attempts FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================
-- BOOKMARKED_QUESTIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarked_questions;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.bookmarked_questions;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarked_questions;
DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.bookmarked_questions;

CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarked_questions FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarked_questions FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarked_questions FOR DELETE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own bookmarks"
  ON public.bookmarked_questions FOR UPDATE
  USING (user_id = (select auth.uid()));

-- ============================================
-- GLOSSARY_PROGRESS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view their own progress" ON public.glossary_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.glossary_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.glossary_progress;
DROP POLICY IF EXISTS "Users can delete their own progress" ON public.glossary_progress;

CREATE POLICY "Users can view their own progress"
  ON public.glossary_progress FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own progress"
  ON public.glossary_progress FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own progress"
  ON public.glossary_progress FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own progress"
  ON public.glossary_progress FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================
-- GLOSSARY_STUDY_SESSIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view their own study sessions" ON public.glossary_study_sessions;
DROP POLICY IF EXISTS "Users can insert their own study sessions" ON public.glossary_study_sessions;
DROP POLICY IF EXISTS "Users can update their own study sessions" ON public.glossary_study_sessions;

CREATE POLICY "Users can view their own study sessions"
  ON public.glossary_study_sessions FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own study sessions"
  ON public.glossary_study_sessions FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own study sessions"
  ON public.glossary_study_sessions FOR UPDATE
  USING (user_id = (select auth.uid()));

-- ============================================
-- WEEKLY_STUDY_GOALS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view their own goals" ON public.weekly_study_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.weekly_study_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.weekly_study_goals;

CREATE POLICY "Users can view their own goals"
  ON public.weekly_study_goals FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own goals"
  ON public.weekly_study_goals FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own goals"
  ON public.weekly_study_goals FOR UPDATE
  USING (user_id = (select auth.uid()));

-- ============================================
-- USER_ROLES TABLE
-- Note: Admin policies use the has_role() security definer function to avoid recursive RLS
-- ============================================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- GLOSSARY_TERMS TABLE (Admin policies)
-- Note: Uses has_role() security definer function to match original implementation
-- ============================================
DROP POLICY IF EXISTS "Admins can insert glossary terms" ON public.glossary_terms;
DROP POLICY IF EXISTS "Admins can update glossary terms" ON public.glossary_terms;
DROP POLICY IF EXISTS "Admins can delete glossary terms" ON public.glossary_terms;

CREATE POLICY "Admins can insert glossary terms"
  ON public.glossary_terms FOR INSERT
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update glossary terms"
  ON public.glossary_terms FOR UPDATE
  USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete glossary terms"
  ON public.glossary_terms FOR DELETE
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- QUESTIONS TABLE (Admin policies)
-- Note: Uses has_role() security definer function to match original implementation
-- ============================================
DROP POLICY IF EXISTS "Admins can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can update questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON public.questions;

CREATE POLICY "Admins can insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- EXPLANATION_FEEDBACK TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.explanation_feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.explanation_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.explanation_feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.explanation_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.explanation_feedback;

CREATE POLICY "Users can view their own feedback"
  ON public.explanation_feedback FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own feedback"
  ON public.explanation_feedback FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own feedback"
  ON public.explanation_feedback FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own feedback"
  ON public.explanation_feedback FOR DELETE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all feedback"
  ON public.explanation_feedback FOR SELECT
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- EXAM_SESSIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage exam sessions" ON public.exam_sessions;

CREATE POLICY "Admins can manage exam sessions"
  ON public.exam_sessions FOR ALL
  USING (has_role((select auth.uid()), 'admin'::app_role));

-- ============================================
-- USER_TARGET_EXAM TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view their own target exam" ON public.user_target_exam;
DROP POLICY IF EXISTS "Users can insert their own target exam" ON public.user_target_exam;
DROP POLICY IF EXISTS "Users can update their own target exam" ON public.user_target_exam;
DROP POLICY IF EXISTS "Users can delete their own target exam" ON public.user_target_exam;

CREATE POLICY "Users can view their own target exam"
  ON public.user_target_exam FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own target exam"
  ON public.user_target_exam FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own target exam"
  ON public.user_target_exam FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own target exam"
  ON public.user_target_exam FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================
-- OAUTH_CONSENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own consents" ON public.oauth_consents;
DROP POLICY IF EXISTS "Users can insert own consents" ON public.oauth_consents;
DROP POLICY IF EXISTS "Users can delete own consents" ON public.oauth_consents;

CREATE POLICY "Users can view own consents"
  ON public.oauth_consents FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own consents"
  ON public.oauth_consents FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own consents"
  ON public.oauth_consents FOR DELETE
  USING (user_id = (select auth.uid()));
