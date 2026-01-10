-- Readiness Scoring Model Tables and Functions
-- This migration creates the infrastructure for tracking and calculating user readiness scores

-- ============================================================
-- 1. READINESS CONFIG TABLE
-- Stores tunable formula parameters for easy updates without code deploys
-- ============================================================

CREATE TABLE IF NOT EXISTS public.readiness_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.readiness_config ENABLE ROW LEVEL SECURITY;

-- Public read access (config is not sensitive)
CREATE POLICY "Public read access for readiness_config"
  ON public.readiness_config FOR SELECT
  USING (true);

-- Admin write access
CREATE POLICY "Admin write access for readiness_config"
  ON public.readiness_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default configuration values
INSERT INTO public.readiness_config (key, value, description) VALUES
  ('formula_weights', '{"recent_accuracy": 35, "overall_accuracy": 20, "coverage": 15, "mastery": 15, "test_rate": 15}', 'Weights for readiness score components (must sum to 100)'),
  ('pass_probability', '{"k": 0.15, "r0": 65}', 'Logistic curve parameters: k=steepness, r0=inflection point'),
  ('recency_penalty', '{"max_penalty": 10, "decay_rate": 0.5}', 'Days-since-study penalty: penalty = min(max_penalty, decay_rate * days)'),
  ('coverage_beta', '{"low": 1.2, "mid": 1.0, "high": 0.9, "low_threshold": 0.3, "high_threshold": 0.7}', 'Coverage modifier for subelement risk score'),
  ('thresholds', '{"min_attempts": 50, "min_per_subelement": 2, "recent_window": 50, "subelement_recent_window": 20}', 'Sample size thresholds for confidence'),
  ('version', '"v1.0.0"', 'Current formula version for audit trail')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.readiness_config IS 'Configuration parameters for readiness score calculations. Modify these to tune the algorithm without code changes.';

-- ============================================================
-- 2. QUESTION MASTERY TABLE
-- Tracks per-question correct/incorrect counts for efficient mastery calculation
-- ============================================================

CREATE TABLE IF NOT EXISTS public.question_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,

  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  incorrect_attempts INTEGER NOT NULL DEFAULT 0,

  -- Computed flags for fast filtering (PostgreSQL generated columns)
  is_mastered BOOLEAN GENERATED ALWAYS AS (correct_attempts >= 2) STORED,
  is_weak BOOLEAN GENERATED ALWAYS AS (incorrect_attempts >= 2 AND incorrect_attempts > correct_attempts) STORED,

  first_attempt_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_question_mastery UNIQUE (user_id, question_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_question_mastery_user ON public.question_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_question_mastery_mastered ON public.question_mastery(user_id) WHERE is_mastered = TRUE;
CREATE INDEX IF NOT EXISTS idx_question_mastery_weak ON public.question_mastery(user_id) WHERE is_weak = TRUE;

-- Enable RLS
ALTER TABLE public.question_mastery ENABLE ROW LEVEL SECURITY;

-- Users can only view their own mastery data
CREATE POLICY "Users can view their own question mastery"
  ON public.question_mastery FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own mastery data (via trigger)
CREATE POLICY "Users can insert their own question mastery"
  ON public.question_mastery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question mastery"
  ON public.question_mastery FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.question_mastery IS 'Per-question mastery tracking with computed is_mastered and is_weak flags. Updated automatically by trigger on question_attempts.';

-- ============================================================
-- 3. USER READINESS CACHE TABLE
-- Stores current readiness state per user per exam type
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_readiness_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('technician', 'general', 'extra')),

  -- Input Metrics (stored for debugging/display)
  recent_accuracy DECIMAL(5,4),           -- A_r: accuracy on last N questions (0.0000-1.0000)
  overall_accuracy DECIMAL(5,4),          -- A_o: lifetime accuracy
  coverage DECIMAL(5,4),                  -- C: fraction of unique questions seen
  mastery DECIMAL(5,4),                   -- M: fraction correct 2+ times
  tests_passed INTEGER NOT NULL DEFAULT 0,   -- T_p: count of practice exams >= 74%
  tests_taken INTEGER NOT NULL DEFAULT 0,    -- T_t: total practice exams attempted
  last_study_at TIMESTAMPTZ,              -- For calculating recency penalty

  -- Calculated Outputs
  readiness_score DECIMAL(5,2),           -- R: 0-100 composite score
  pass_probability DECIMAL(5,4),          -- P(pass): logistic output 0-1
  expected_exam_score DECIMAL(5,2),       -- E_total: expected correct answers

  -- Per-Subelement Metrics (JSONB for flexibility)
  -- Structure: { "T1": { accuracy, recent_accuracy, coverage, mastery, risk_score, expected_score, weight }, ... }
  subelement_metrics JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Metadata
  total_attempts INTEGER NOT NULL DEFAULT 0,
  unique_questions_seen INTEGER NOT NULL DEFAULT 0,
  config_version TEXT,                    -- Track which formula version was used
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_exam_cache UNIQUE (user_id, exam_type)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_readiness_cache_user ON public.user_readiness_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_readiness_cache_exam ON public.user_readiness_cache(exam_type);

-- Enable RLS
ALTER TABLE public.user_readiness_cache ENABLE ROW LEVEL SECURITY;

-- Users can only view their own readiness data
CREATE POLICY "Users can view their own readiness cache"
  ON public.user_readiness_cache FOR SELECT
  USING (auth.uid() = user_id);

-- Edge function uses service role, but users can also trigger via authenticated requests
CREATE POLICY "Users can insert their own readiness cache"
  ON public.user_readiness_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own readiness cache"
  ON public.user_readiness_cache FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_readiness_cache IS 'Cached readiness scores per user per exam type. Updated by edge function after tests or batched questions.';

-- ============================================================
-- 4. USER READINESS SNAPSHOTS TABLE
-- Daily snapshots for trend analysis and historical charts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_readiness_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('technician', 'general', 'extra')),
  snapshot_date DATE NOT NULL,

  -- Core metrics for trend display
  readiness_score DECIMAL(5,2),
  pass_probability DECIMAL(5,4),
  recent_accuracy DECIMAL(5,4),
  overall_accuracy DECIMAL(5,4),
  coverage DECIMAL(5,4),
  mastery DECIMAL(5,4),
  tests_passed INTEGER NOT NULL DEFAULT 0,
  tests_taken INTEGER NOT NULL DEFAULT 0,

  -- Activity metrics for the day
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_exam_date_snapshot UNIQUE (user_id, exam_type, snapshot_date)
);

-- Indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON public.user_readiness_snapshots(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_exam_date ON public.user_readiness_snapshots(exam_type, snapshot_date DESC);

-- Enable RLS
ALTER TABLE public.user_readiness_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only view their own snapshots
CREATE POLICY "Users can view their own readiness snapshots"
  ON public.user_readiness_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own readiness snapshots"
  ON public.user_readiness_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own readiness snapshots"
  ON public.user_readiness_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_readiness_snapshots IS 'Daily readiness snapshots for trend charts. One row per user per exam type per day.';

-- ============================================================
-- 5. QUESTION MASTERY TRIGGER
-- Automatically maintains question_mastery when question_attempts are inserted
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_question_mastery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.question_mastery (
    user_id,
    question_id,
    total_attempts,
    correct_attempts,
    incorrect_attempts,
    first_attempt_at,
    last_attempt_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.question_id,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    CASE WHEN NEW.is_correct THEN 0 ELSE 1 END,
    NEW.attempted_at,
    NEW.attempted_at,
    now()
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    total_attempts = question_mastery.total_attempts + 1,
    correct_attempts = question_mastery.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    incorrect_attempts = question_mastery.incorrect_attempts + CASE WHEN NEW.is_correct THEN 0 ELSE 1 END,
    last_attempt_at = NEW.attempted_at,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create trigger on question_attempts
DROP TRIGGER IF EXISTS trg_update_question_mastery ON public.question_attempts;
CREATE TRIGGER trg_update_question_mastery
  AFTER INSERT ON public.question_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_question_mastery();

COMMENT ON FUNCTION public.update_question_mastery() IS 'Maintains question_mastery table incrementally when question_attempts are inserted.';

-- ============================================================
-- 6. BACKFILL QUESTION MASTERY FROM EXISTING DATA
-- Populate question_mastery for all existing question_attempts
-- ============================================================

INSERT INTO public.question_mastery (
  user_id,
  question_id,
  total_attempts,
  correct_attempts,
  incorrect_attempts,
  first_attempt_at,
  last_attempt_at,
  created_at,
  updated_at
)
SELECT
  user_id,
  question_id,
  COUNT(*) AS total_attempts,
  COUNT(*) FILTER (WHERE is_correct) AS correct_attempts,
  COUNT(*) FILTER (WHERE NOT is_correct) AS incorrect_attempts,
  MIN(attempted_at) AS first_attempt_at,
  MAX(attempted_at) AS last_attempt_at,
  now() AS created_at,
  now() AS updated_at
FROM public.question_attempts
GROUP BY user_id, question_id
ON CONFLICT (user_id, question_id) DO UPDATE SET
  total_attempts = EXCLUDED.total_attempts,
  correct_attempts = EXCLUDED.correct_attempts,
  incorrect_attempts = EXCLUDED.incorrect_attempts,
  first_attempt_at = EXCLUDED.first_attempt_at,
  last_attempt_at = EXCLUDED.last_attempt_at,
  updated_at = now();

-- ============================================================
-- 7. ADMIN ACCESS POLICIES
-- Allow admins to view all data for analytics
-- ============================================================

CREATE POLICY "Admins can view all question mastery"
  ON public.question_mastery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all readiness cache"
  ON public.user_readiness_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all readiness snapshots"
  ON public.user_readiness_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
