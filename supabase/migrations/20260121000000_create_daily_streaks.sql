-- =============================================================================
-- Daily Streak System Migration
-- Transforms in-session streaks into true daily practice streaks
-- =============================================================================

-- =============================================================================
-- PART 1: Create daily_activity table for per-day aggregation
-- =============================================================================

CREATE TABLE public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Activity counts
  questions_answered INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  tests_taken INTEGER NOT NULL DEFAULT 0,
  tests_passed INTEGER NOT NULL DEFAULT 0,
  glossary_terms_studied INTEGER NOT NULL DEFAULT 0,

  -- Computed qualification: 5+ questions OR 1+ tests OR 10+ glossary terms
  qualifies_for_streak BOOLEAN GENERATED ALWAYS AS (
    questions_answered >= 5 OR tests_taken >= 1 OR glossary_terms_studied >= 10
  ) STORED,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_activity_date UNIQUE (user_id, activity_date)
);

-- Add comments for documentation
COMMENT ON TABLE public.daily_activity IS 'Per-day activity aggregation for streak tracking';
COMMENT ON COLUMN public.daily_activity.user_id IS 'User who performed the activity';
COMMENT ON COLUMN public.daily_activity.activity_date IS 'Date of activity (user local date)';
COMMENT ON COLUMN public.daily_activity.questions_answered IS 'Total questions answered on this date';
COMMENT ON COLUMN public.daily_activity.questions_correct IS 'Total correct answers on this date';
COMMENT ON COLUMN public.daily_activity.tests_taken IS 'Number of practice tests completed';
COMMENT ON COLUMN public.daily_activity.tests_passed IS 'Number of practice tests passed';
COMMENT ON COLUMN public.daily_activity.glossary_terms_studied IS 'Number of glossary flashcards studied';
COMMENT ON COLUMN public.daily_activity.qualifies_for_streak IS 'Whether this day counts toward the streak';

-- Indexes for efficient queries
CREATE INDEX idx_daily_activity_user_date ON public.daily_activity(user_id, activity_date DESC);
CREATE INDEX idx_daily_activity_qualifies ON public.daily_activity(user_id, activity_date) WHERE qualifies_for_streak = true;

-- =============================================================================
-- PART 2: Create daily_streaks table for streak state
-- =============================================================================

CREATE TABLE public.daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,

  -- Optional: streak freeze feature for future use
  streak_freezes_available INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_streak UNIQUE (user_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.daily_streaks IS 'Running streak state per user';
COMMENT ON COLUMN public.daily_streaks.current_streak IS 'Current consecutive days with qualifying activity';
COMMENT ON COLUMN public.daily_streaks.longest_streak IS 'All-time best streak';
COMMENT ON COLUMN public.daily_streaks.last_activity_date IS 'Date of last qualifying activity';
COMMENT ON COLUMN public.daily_streaks.streak_freezes_available IS 'Banked streak freezes (future feature)';

-- Index for efficient user lookups
CREATE INDEX idx_daily_streaks_user ON public.daily_streaks(user_id);

-- =============================================================================
-- PART 3: RLS Policies
-- =============================================================================

-- Enable RLS on both tables
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;

-- daily_activity policies: Users can view and modify only their own records
CREATE POLICY "Users can view own daily_activity"
  ON public.daily_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily_activity"
  ON public.daily_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_activity"
  ON public.daily_activity FOR UPDATE
  USING (auth.uid() = user_id);

-- daily_streaks policies: Users can only view their streaks (updates via trigger)
CREATE POLICY "Users can view own daily_streaks"
  ON public.daily_streaks FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- PART 4: Trigger function to auto-update streaks
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_daily_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_yesterday DATE := NEW.activity_date - 1;
  v_had_activity_yesterday BOOLEAN;
  v_current_streak INTEGER;
BEGIN
  -- Only process when activity qualifies for streak
  IF NOT NEW.qualifies_for_streak THEN
    RETURN NEW;
  END IF;

  -- Check if yesterday had qualifying activity
  SELECT qualifies_for_streak INTO v_had_activity_yesterday
  FROM public.daily_activity
  WHERE user_id = NEW.user_id AND activity_date = v_yesterday;

  -- Upsert streak record
  INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, last_activity_date)
  VALUES (
    NEW.user_id,
    1, -- Starting a new streak
    1,
    NEW.activity_date
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE
      -- Already recorded today, no change
      WHEN daily_streaks.last_activity_date = NEW.activity_date THEN daily_streaks.current_streak
      -- Continued from yesterday, increment
      WHEN daily_streaks.last_activity_date = v_yesterday THEN daily_streaks.current_streak + 1
      -- Gap in activity, reset to 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      daily_streaks.longest_streak,
      CASE
        WHEN daily_streaks.last_activity_date = NEW.activity_date THEN daily_streaks.current_streak
        WHEN daily_streaks.last_activity_date = v_yesterday THEN daily_streaks.current_streak + 1
        ELSE 1
      END
    ),
    last_activity_date = NEW.activity_date,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic streak updates
CREATE TRIGGER trg_update_daily_streak
AFTER INSERT OR UPDATE ON public.daily_activity
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_streak();

-- =============================================================================
-- PART 5: RPC function to increment daily activity (upsert)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_daily_activity(
  p_user_id UUID,
  p_date DATE,
  p_questions INTEGER DEFAULT 0,
  p_correct INTEGER DEFAULT 0,
  p_tests INTEGER DEFAULT 0,
  p_tests_passed INTEGER DEFAULT 0,
  p_glossary INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_activity (
    user_id,
    activity_date,
    questions_answered,
    questions_correct,
    tests_taken,
    tests_passed,
    glossary_terms_studied
  )
  VALUES (
    p_user_id,
    p_date,
    p_questions,
    p_correct,
    p_tests,
    p_tests_passed,
    p_glossary
  )
  ON CONFLICT (user_id, activity_date) DO UPDATE SET
    questions_answered = daily_activity.questions_answered + EXCLUDED.questions_answered,
    questions_correct = daily_activity.questions_correct + EXCLUDED.questions_correct,
    tests_taken = daily_activity.tests_taken + EXCLUDED.tests_taken,
    tests_passed = daily_activity.tests_passed + EXCLUDED.tests_passed,
    glossary_terms_studied = daily_activity.glossary_terms_studied + EXCLUDED.glossary_terms_studied,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_daily_activity TO authenticated;

-- =============================================================================
-- PART 6: Helper function to get current streak info
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_streak_info(p_user_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_activity_date DATE,
  today_qualifies BOOLEAN,
  questions_today INTEGER,
  questions_needed INTEGER,
  streak_at_risk BOOLEAN
) AS $$
DECLARE
  v_streak RECORD;
  v_today_activity RECORD;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get streak record
  SELECT ds.current_streak, ds.longest_streak, ds.last_activity_date
  INTO v_streak
  FROM public.daily_streaks ds
  WHERE ds.user_id = p_user_id;

  -- Get today's activity
  SELECT da.qualifies_for_streak, da.questions_answered
  INTO v_today_activity
  FROM public.daily_activity da
  WHERE da.user_id = p_user_id AND da.activity_date = v_today;

  -- Return computed values
  RETURN QUERY SELECT
    COALESCE(v_streak.current_streak, 0)::INTEGER,
    COALESCE(v_streak.longest_streak, 0)::INTEGER,
    v_streak.last_activity_date,
    COALESCE(v_today_activity.qualifies_for_streak, false),
    COALESCE(v_today_activity.questions_answered, 0)::INTEGER,
    GREATEST(0, 5 - COALESCE(v_today_activity.questions_answered, 0))::INTEGER,
    -- Streak at risk: has a streak but hasn't qualified today
    (COALESCE(v_streak.current_streak, 0) > 0 AND NOT COALESCE(v_today_activity.qualifies_for_streak, false))::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_streak_info TO authenticated;
