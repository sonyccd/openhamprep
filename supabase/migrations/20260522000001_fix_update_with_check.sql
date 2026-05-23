-- Security H1: Add WITH CHECK to user-scoped UPDATE policies.
-- Without WITH CHECK, a user who passes the USING clause can change column
-- values arbitrarily — including setting user_id to another user's id.
-- RLS caught mismatches before this fix, but this closes the gap for future
-- permissive INSERT paths that might not constrain user_id.
--
-- Pattern: use (select auth.uid()) for single evaluation (perf-optimized).

-- ============================================================
-- bookmarked_questions
-- ============================================================
ALTER POLICY "Users can update their own bookmarks"
  ON public.bookmarked_questions
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- glossary_progress
-- ============================================================
ALTER POLICY "Users can update their own progress"
  ON public.glossary_progress
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- glossary_study_sessions
-- ============================================================
ALTER POLICY "Users can update their own study sessions"
  ON public.glossary_study_sessions
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- weekly_study_goals
-- ============================================================
ALTER POLICY "Users can update their own goals"
  ON public.weekly_study_goals
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- explanation_feedback
-- ============================================================
ALTER POLICY "Users can update their own feedback"
  ON public.explanation_feedback
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- user_target_exam
-- ============================================================
ALTER POLICY "Users can update their own target exam"
  ON public.user_target_exam
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- profiles (uses id, not user_id)
-- ============================================================
ALTER POLICY "Users can update their own profile"
  ON public.profiles
  WITH CHECK (id = (select auth.uid()));

-- ============================================================
-- question_mastery
-- ============================================================
ALTER POLICY "Users can update their own question mastery"
  ON public.question_mastery
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- user_readiness_cache
-- ============================================================
ALTER POLICY "Users can update their own readiness cache"
  ON public.user_readiness_cache
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- user_readiness_snapshots
-- ============================================================
ALTER POLICY "Users can update their own readiness snapshots"
  ON public.user_readiness_snapshots
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- lesson_progress
-- ============================================================
ALTER POLICY "Users can update their own lesson progress"
  ON public.lesson_progress
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- topic_progress
-- ============================================================
ALTER POLICY "Users can update their own topic progress"
  ON public.topic_progress
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- daily_activity
-- ============================================================
ALTER POLICY "Users can update own daily_activity"
  ON public.daily_activity
  WITH CHECK ((select auth.uid()) = user_id);
