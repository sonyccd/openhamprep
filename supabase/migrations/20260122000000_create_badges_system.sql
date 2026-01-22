-- =============================================================================
-- Badges & Achievements System Migration
-- Gamification system to reward user progress and engagement
-- =============================================================================

-- =============================================================================
-- PART 1: Create badge_definitions table (static, seeded)
-- =============================================================================

CREATE TABLE public.badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- e.g., 'streak-7', 'ready-technician'
  name TEXT NOT NULL,                  -- Display name
  description TEXT NOT NULL,           -- How to earn
  category TEXT NOT NULL,              -- activity, achievement, mastery, engagement, milestone
  icon_name TEXT NOT NULL,             -- Lucide icon (flame, trophy, target, etc.)
  tier TEXT DEFAULT 'bronze',          -- bronze, silver, gold, platinum
  points INTEGER DEFAULT 10,           -- Gamification points
  criteria JSONB NOT NULL,             -- Unlock logic: {"type": "streak", "threshold": 7}
  display_order INTEGER DEFAULT 0,     -- For sorting in UI
  is_active BOOLEAN DEFAULT true,      -- Can disable without deleting
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE public.badge_definitions IS 'Static definitions of all available badges';
COMMENT ON COLUMN public.badge_definitions.slug IS 'Unique identifier used in code';
COMMENT ON COLUMN public.badge_definitions.category IS 'activity, achievement, mastery, engagement, or milestone';
COMMENT ON COLUMN public.badge_definitions.tier IS 'bronze, silver, gold, or platinum';
COMMENT ON COLUMN public.badge_definitions.criteria IS 'JSON object defining unlock conditions: {"type": "...", "threshold": ...}';

-- Index for efficient queries
CREATE INDEX idx_badge_definitions_category ON public.badge_definitions(category);
CREATE INDEX idx_badge_definitions_is_active ON public.badge_definitions(is_active) WHERE is_active = true;

-- =============================================================================
-- PART 2: Create user_badges table (per-user unlocks)
-- =============================================================================

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  unlock_context JSONB DEFAULT '{}',   -- e.g., {"streak_value": 7}
  is_seen BOOLEAN DEFAULT false,       -- For "new badge" notification

  CONSTRAINT unique_user_badge UNIQUE(user_id, badge_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.user_badges IS 'Badges earned by each user';
COMMENT ON COLUMN public.user_badges.unlock_context IS 'Context about when/how badge was earned';
COMMENT ON COLUMN public.user_badges.is_seen IS 'Whether user has seen the badge unlock notification';

-- Indexes for efficient queries
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_user_unseen ON public.user_badges(user_id) WHERE is_seen = false;
CREATE INDEX idx_user_badges_unlocked_at ON public.user_badges(user_id, unlocked_at DESC);

-- =============================================================================
-- PART 3: RLS Policies
-- =============================================================================

-- Enable RLS on both tables
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- badge_definitions: Anyone can view (public data)
CREATE POLICY "Anyone can view badge definitions"
  ON public.badge_definitions FOR SELECT
  USING (true);

-- user_badges: Users can only view/update their own badges
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own badges"
  ON public.user_badges FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- PART 4: RPC function to check and award badges for a user
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_badges_for_user(p_user_id UUID)
RETURNS TABLE (
  badge_id UUID,
  badge_slug TEXT,
  badge_name TEXT,
  badge_tier TEXT,
  badge_points INTEGER,
  badge_icon TEXT
) AS $$
DECLARE
  v_badge RECORD;
  v_criteria_type TEXT;
  v_threshold INTEGER;
  v_license_type TEXT;
  v_current_value INTEGER;
  v_is_qualified BOOLEAN;
  v_context JSONB;
BEGIN
  -- Loop through all active badges user hasn't earned yet
  FOR v_badge IN
    SELECT bd.*
    FROM public.badge_definitions bd
    WHERE bd.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.user_badges ub
        WHERE ub.user_id = p_user_id AND ub.badge_id = bd.id
      )
    ORDER BY bd.display_order
  LOOP
    v_criteria_type := v_badge.criteria->>'type';
    v_threshold := (v_badge.criteria->>'threshold')::INTEGER;
    v_license_type := v_badge.criteria->>'license_type';
    v_is_qualified := false;
    v_context := '{}'::JSONB;

    -- Check different badge criteria types
    CASE v_criteria_type
      -- Streak badges
      WHEN 'streak' THEN
        SELECT current_streak INTO v_current_value
        FROM public.daily_streaks
        WHERE user_id = p_user_id;

        IF COALESCE(v_current_value, 0) >= v_threshold THEN
          v_is_qualified := true;
          v_context := jsonb_build_object('streak_value', v_current_value);
        END IF;

      -- Questions answered badges
      WHEN 'questions_answered' THEN
        SELECT COUNT(*)::INTEGER INTO v_current_value
        FROM public.question_attempts
        WHERE user_id = p_user_id;

        IF COALESCE(v_current_value, 0) >= v_threshold THEN
          v_is_qualified := true;
          v_context := jsonb_build_object('questions_answered', v_current_value);
        END IF;

      -- Tests passed badges
      WHEN 'tests_passed' THEN
        SELECT COUNT(*)::INTEGER INTO v_current_value
        FROM public.practice_test_results
        WHERE user_id = p_user_id AND passed = true;

        IF COALESCE(v_current_value, 0) >= v_threshold THEN
          v_is_qualified := true;
          v_context := jsonb_build_object('tests_passed', v_current_value);
        END IF;

      -- Perfect test score badge
      WHEN 'perfect_test' THEN
        SELECT COUNT(*)::INTEGER INTO v_current_value
        FROM public.practice_test_results
        WHERE user_id = p_user_id AND percentage = 100;

        IF COALESCE(v_current_value, 0) >= COALESCE(v_threshold, 1) THEN
          v_is_qualified := true;
          v_context := jsonb_build_object('perfect_tests', v_current_value);
        END IF;

      -- Consecutive passes badge
      WHEN 'consecutive_passes' THEN
        -- Find longest streak of consecutive passes
        WITH ordered_tests AS (
          SELECT
            passed,
            ROW_NUMBER() OVER (ORDER BY completed_at) as rn
          FROM public.practice_test_results
          WHERE user_id = p_user_id
        ),
        streaks AS (
          SELECT
            passed,
            rn - ROW_NUMBER() OVER (PARTITION BY passed ORDER BY rn) as grp
          FROM ordered_tests
        ),
        streak_lengths AS (
          SELECT COUNT(*) as streak_len
          FROM streaks
          WHERE passed = true
          GROUP BY grp
        )
        SELECT COALESCE(MAX(streak_len), 0)::INTEGER INTO v_current_value
        FROM streak_lengths;

        IF COALESCE(v_current_value, 0) >= v_threshold THEN
          v_is_qualified := true;
          v_context := jsonb_build_object('consecutive_passes', v_current_value);
        END IF;

      -- Readiness score badge (per license type)
      WHEN 'readiness_score' THEN
        SELECT readiness_score::INTEGER INTO v_current_value
        FROM public.user_readiness_cache
        WHERE user_id = p_user_id AND exam_type = v_license_type;

        IF COALESCE(v_current_value, 0) >= v_threshold THEN
          v_is_qualified := true;
          v_context := jsonb_build_object('readiness_score', v_current_value, 'license_type', v_license_type);
        END IF;

      -- Overall accuracy badge (requires minimum questions)
      WHEN 'accuracy' THEN
        DECLARE
          v_min_questions INTEGER := COALESCE((v_badge.criteria->>'min_questions')::INTEGER, 50);
          v_total_questions INTEGER;
          v_accuracy INTEGER;
        BEGIN
          SELECT
            COUNT(*)::INTEGER,
            CASE WHEN COUNT(*) > 0
              THEN (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100 / COUNT(*))::INTEGER
              ELSE 0
            END
          INTO v_total_questions, v_accuracy
          FROM public.question_attempts
          WHERE user_id = p_user_id;

          -- Must meet both minimum questions AND accuracy threshold
          IF v_total_questions >= v_min_questions AND v_accuracy >= v_threshold THEN
            v_is_qualified := true;
            v_context := jsonb_build_object('accuracy', v_accuracy, 'total_questions', v_total_questions);
          END IF;
        END;

      -- Glossary terms mastered badge
      WHEN 'glossary_mastered' THEN
        SELECT COUNT(*)::INTEGER INTO v_current_value
        FROM public.glossary_progress
        WHERE user_id = p_user_id AND mastered = true;

        IF COALESCE(v_current_value, 0) >= v_threshold THEN
          v_is_qualified := true;
          v_context := jsonb_build_object('glossary_mastered', v_current_value);
        END IF;

      -- First question badge
      WHEN 'first_question' THEN
        SELECT COUNT(*)::INTEGER INTO v_current_value
        FROM public.question_attempts
        WHERE user_id = p_user_id
        LIMIT 1;

        IF COALESCE(v_current_value, 0) >= 1 THEN
          v_is_qualified := true;
        END IF;

      -- First test badge
      WHEN 'first_test' THEN
        SELECT COUNT(*)::INTEGER INTO v_current_value
        FROM public.practice_test_results
        WHERE user_id = p_user_id
        LIMIT 1;

        IF COALESCE(v_current_value, 0) >= 1 THEN
          v_is_qualified := true;
        END IF;

      -- Subelement coverage badge (answered from every subelement)
      WHEN 'full_coverage' THEN
        DECLARE
          v_user_subelements INTEGER;
          v_total_subelements INTEGER;
        BEGIN
          -- Count distinct subelements user has answered questions from
          SELECT COUNT(DISTINCT q.subelement)::INTEGER INTO v_user_subelements
          FROM public.question_attempts qa
          JOIN public.questions q ON qa.question_id = q.id
          WHERE qa.user_id = p_user_id;

          -- Count total distinct subelements
          SELECT COUNT(DISTINCT subelement)::INTEGER INTO v_total_subelements
          FROM public.questions;

          IF v_user_subelements >= v_total_subelements AND v_total_subelements > 0 THEN
            v_is_qualified := true;
            v_context := jsonb_build_object('subelements_covered', v_user_subelements);
          END IF;
        END;

      -- Triple threat badge (90%+ on all 3 licenses)
      WHEN 'triple_threat' THEN
        DECLARE
          v_tech_ready INTEGER;
          v_general_ready INTEGER;
          v_extra_ready INTEGER;
        BEGIN
          SELECT readiness_score::INTEGER INTO v_tech_ready
          FROM public.user_readiness_cache
          WHERE user_id = p_user_id AND exam_type = 'technician';

          SELECT readiness_score::INTEGER INTO v_general_ready
          FROM public.user_readiness_cache
          WHERE user_id = p_user_id AND exam_type = 'general';

          SELECT readiness_score::INTEGER INTO v_extra_ready
          FROM public.user_readiness_cache
          WHERE user_id = p_user_id AND exam_type = 'extra';

          IF COALESCE(v_tech_ready, 0) >= v_threshold
             AND COALESCE(v_general_ready, 0) >= v_threshold
             AND COALESCE(v_extra_ready, 0) >= v_threshold THEN
            v_is_qualified := true;
            v_context := jsonb_build_object(
              'technician_readiness', v_tech_ready,
              'general_readiness', v_general_ready,
              'extra_readiness', v_extra_ready
            );
          END IF;
        END;

      ELSE
        -- Unknown criteria type, skip
        CONTINUE;
    END CASE;

    -- If qualified, award the badge and return it
    IF v_is_qualified THEN
      INSERT INTO public.user_badges (user_id, badge_id, unlock_context)
      VALUES (p_user_id, v_badge.id, v_context)
      ON CONFLICT ON CONSTRAINT unique_user_badge DO NOTHING;

      -- Only return if we actually inserted (not already exists)
      IF FOUND THEN
        -- Assign to output columns using table alias to avoid ambiguity
        check_badges_for_user.badge_id := v_badge.id;
        check_badges_for_user.badge_slug := v_badge.slug;
        check_badges_for_user.badge_name := v_badge.name;
        check_badges_for_user.badge_tier := v_badge.tier;
        check_badges_for_user.badge_points := v_badge.points;
        check_badges_for_user.badge_icon := v_badge.icon_name;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_badges_for_user TO authenticated;

-- =============================================================================
-- PART 5: RPC function to get user's badge summary
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_badges(p_user_id UUID)
RETURNS TABLE (
  badge_id UUID,
  slug TEXT,
  name TEXT,
  description TEXT,
  category TEXT,
  icon_name TEXT,
  tier TEXT,
  points INTEGER,
  display_order INTEGER,
  unlocked_at TIMESTAMPTZ,
  is_seen BOOLEAN,
  is_unlocked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bd.id as badge_id,
    bd.slug,
    bd.name,
    bd.description,
    bd.category,
    bd.icon_name,
    bd.tier,
    bd.points,
    bd.display_order,
    ub.unlocked_at,
    COALESCE(ub.is_seen, false) as is_seen,
    (ub.id IS NOT NULL) as is_unlocked
  FROM public.badge_definitions bd
  LEFT JOIN public.user_badges ub ON ub.badge_id = bd.id AND ub.user_id = p_user_id
  WHERE bd.is_active = true
  ORDER BY
    (ub.id IS NOT NULL) DESC,  -- Unlocked first
    bd.display_order,
    bd.tier DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_badges TO authenticated;

-- =============================================================================
-- PART 6: RPC function to mark badges as seen
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mark_badges_seen(p_user_id UUID, p_badge_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE public.user_badges
  SET is_seen = true
  WHERE user_id = p_user_id
    AND badge_id = ANY(p_badge_ids)
    AND is_seen = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.mark_badges_seen TO authenticated;

-- =============================================================================
-- PART 7: Seed badge definitions (25 badges across 5 categories)
-- =============================================================================

INSERT INTO public.badge_definitions (slug, name, description, category, icon_name, tier, points, criteria, display_order) VALUES
  -- Activity Badges (short streaks + first actions)
  ('first-question', 'First Steps', 'Answer your first question', 'activity', 'play', 'bronze', 5, '{"type": "first_question"}'::jsonb, 1),
  ('first-test', 'Test Pilot', 'Complete your first practice test', 'activity', 'file-check', 'bronze', 10, '{"type": "first_test"}'::jsonb, 2),
  ('streak-3', 'Getting Started', 'Achieve a 3-day study streak', 'activity', 'flame', 'bronze', 15, '{"type": "streak", "threshold": 3}'::jsonb, 3),
  ('streak-7', 'Week Warrior', 'Achieve a 7-day study streak', 'activity', 'flame', 'silver', 25, '{"type": "streak", "threshold": 7}'::jsonb, 4),
  ('streak-14', 'Two-Week Champion', 'Achieve a 14-day study streak', 'activity', 'flame', 'gold', 50, '{"type": "streak", "threshold": 14}'::jsonb, 5),

  -- Achievement Badges (tests & scores)
  ('tests-5', 'Regular Tester', 'Pass 5 practice tests', 'achievement', 'award', 'bronze', 20, '{"type": "tests_passed", "threshold": 5}'::jsonb, 10),
  ('tests-10', 'Exam Veteran', 'Pass 10 practice tests', 'achievement', 'award', 'silver', 35, '{"type": "tests_passed", "threshold": 10}'::jsonb, 11),
  ('tests-25', 'Test Master', 'Pass 25 practice tests', 'achievement', 'award', 'gold', 75, '{"type": "tests_passed", "threshold": 25}'::jsonb, 12),
  ('first-perfect', 'Flawless', 'Score 100% on any practice test', 'achievement', 'star', 'gold', 50, '{"type": "perfect_test", "threshold": 1}'::jsonb, 13),
  ('consecutive-3', 'Hat Trick', 'Pass 3 tests in a row', 'achievement', 'trending-up', 'silver', 30, '{"type": "consecutive_passes", "threshold": 3}'::jsonb, 14),
  ('consecutive-5', 'On a Roll', 'Pass 5 tests in a row', 'achievement', 'trending-up', 'gold', 60, '{"type": "consecutive_passes", "threshold": 5}'::jsonb, 15),

  -- Mastery Badges (license readiness)
  ('ready-technician', 'Tech Ready', 'Reach 90% readiness for Technician', 'mastery', 'radio', 'gold', 100, '{"type": "readiness_score", "threshold": 90, "license_type": "technician"}'::jsonb, 20),
  ('ready-general', 'General Ready', 'Reach 90% readiness for General', 'mastery', 'radio', 'gold', 100, '{"type": "readiness_score", "threshold": 90, "license_type": "general"}'::jsonb, 21),
  ('ready-extra', 'Extra Ready', 'Reach 90% readiness for Extra', 'mastery', 'radio', 'platinum', 150, '{"type": "readiness_score", "threshold": 90, "license_type": "extra"}'::jsonb, 22),
  ('triple-threat', 'Triple Threat', 'Reach 90%+ readiness on all 3 licenses', 'mastery', 'crown', 'platinum', 300, '{"type": "triple_threat", "threshold": 90}'::jsonb, 23),
  ('accuracy-80', 'Sharp Eye', 'Achieve 80% accuracy over 100+ questions', 'mastery', 'target', 'silver', 40, '{"type": "accuracy", "threshold": 80, "min_questions": 100}'::jsonb, 24),
  ('accuracy-90', 'Sharpshooter', 'Achieve 90% accuracy over 200+ questions', 'mastery', 'target', 'gold', 75, '{"type": "accuracy", "threshold": 90, "min_questions": 200}'::jsonb, 25),
  ('full-coverage', 'Explorer', 'Answer questions from every subelement', 'mastery', 'compass', 'silver', 50, '{"type": "full_coverage"}'::jsonb, 26),

  -- Engagement Badges (learning activities)
  ('glossary-25', 'Vocab Builder', 'Master 25 glossary terms', 'engagement', 'book-open', 'bronze', 20, '{"type": "glossary_mastered", "threshold": 25}'::jsonb, 30),
  ('glossary-50', 'Word Wizard', 'Master 50 glossary terms', 'engagement', 'book-open', 'silver', 40, '{"type": "glossary_mastered", "threshold": 50}'::jsonb, 31),
  ('glossary-100', 'Lexicon Master', 'Master 100 glossary terms', 'engagement', 'book-open', 'gold', 80, '{"type": "glossary_mastered", "threshold": 100}'::jsonb, 32),

  -- Milestone Badges (totals)
  ('questions-100', 'Century', 'Answer 100 questions', 'milestone', 'hash', 'bronze', 25, '{"type": "questions_answered", "threshold": 100}'::jsonb, 40),
  ('questions-500', 'Dedicated Student', 'Answer 500 questions', 'milestone', 'hash', 'silver', 50, '{"type": "questions_answered", "threshold": 500}'::jsonb, 41),
  ('questions-1000', 'Question Machine', 'Answer 1000 questions', 'milestone', 'hash', 'gold', 100, '{"type": "questions_answered", "threshold": 1000}'::jsonb, 42);
