-- =============================================================================
-- Event System Migration
-- Adds event-sourcing alongside existing question tracking
-- =============================================================================

-- =============================================================================
-- PART 1: Add columns to questions table for pool versioning
-- =============================================================================

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS pool_version TEXT DEFAULT '2022-2026';

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_questions_content_hash ON questions (content_hash);
CREATE INDEX IF NOT EXISTS idx_questions_pool_version ON questions (pool_version);

COMMENT ON COLUMN questions.content_hash IS 'SHA-256 hash of normalized question content for change detection';
COMMENT ON COLUMN questions.pool_version IS 'Question pool version (e.g., 2022-2026 for Technician)';

-- =============================================================================
-- PART 2: Create question_pools reference table
-- =============================================================================

CREATE TABLE IF NOT EXISTS question_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_version TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  question_count INT NOT NULL,
  passing_threshold NUMERIC NOT NULL DEFAULT 0.74,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pool_version, exam_type)
);

-- Add comments for documentation
COMMENT ON TABLE question_pools IS 'Reference table for question pool metadata by exam type';
COMMENT ON COLUMN question_pools.pool_version IS 'Version identifier (e.g., 2022-2026)';
COMMENT ON COLUMN question_pools.exam_type IS 'Exam type: technician, general, or extra';
COMMENT ON COLUMN question_pools.effective_date IS 'Date this pool became active';
COMMENT ON COLUMN question_pools.expiration_date IS 'Date this pool expires (null if current)';
COMMENT ON COLUMN question_pools.question_count IS 'Total number of questions in the pool';
COMMENT ON COLUMN question_pools.passing_threshold IS 'Minimum percentage to pass (0.74 = 74%)';
COMMENT ON COLUMN question_pools.is_current IS 'Whether this is the currently active pool';

-- Enable RLS but allow public read access (pool info is public knowledge)
ALTER TABLE question_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read question pools" ON question_pools FOR SELECT TO public USING (true);

-- Seed with current pool data
INSERT INTO question_pools (pool_version, exam_type, effective_date, expiration_date, question_count, passing_threshold, is_current)
VALUES
  ('2022-2026', 'technician', '2022-07-01', '2026-06-30', 411, 0.74, true),
  ('2023-2027', 'general', '2023-07-01', '2027-06-30', 456, 0.74, true),
  ('2024-2028', 'extra', '2024-07-01', '2028-06-30', 622, 0.74, true)
ON CONFLICT (pool_version, exam_type) DO NOTHING;

-- =============================================================================
-- PART 3: Create events table for event sourcing
-- =============================================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE events IS 'Event store for user actions (question attempts, test completions, etc.)';
COMMENT ON COLUMN events.event_type IS 'Type of event: question_attempt, practice_test_completed, etc.';
COMMENT ON COLUMN events.timestamp IS 'When the event occurred (user''s perspective)';
COMMENT ON COLUMN events.user_id IS 'User who generated the event';
COMMENT ON COLUMN events.payload IS 'Event-specific data as JSON';

-- Primary access pattern indexes
CREATE INDEX IF NOT EXISTS idx_events_user_time ON events (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_time ON events (event_type, timestamp DESC);

-- Partial indexes for question_attempt event lookups
-- These are more efficient than indexing the entire JSONB payload
CREATE INDEX IF NOT EXISTS idx_events_question_id
  ON events ((payload->>'question_id'))
  WHERE event_type = 'question_attempt';

CREATE INDEX IF NOT EXISTS idx_events_content_hash
  ON events ((payload->>'content_hash'))
  WHERE event_type = 'question_attempt';

CREATE INDEX IF NOT EXISTS idx_events_is_correct
  ON events ((payload->>'is_correct'))
  WHERE event_type = 'question_attempt';

-- RLS: Users can only insert/read their own events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own events"
  ON events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own events"
  ON events
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- PART 4: Update existing questions with default pool_version based on prefix
-- =============================================================================

-- Set pool_version based on question prefix
UPDATE questions
SET pool_version = '2022-2026'
WHERE display_name LIKE 'T%' AND pool_version IS NULL;

UPDATE questions
SET pool_version = '2023-2027'
WHERE display_name LIKE 'G%' AND pool_version IS NULL;

UPDATE questions
SET pool_version = '2024-2028'
WHERE display_name LIKE 'E%' AND pool_version IS NULL;
