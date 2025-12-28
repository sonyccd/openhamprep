-- ============================================
-- Migration: Convert questions.id from TEXT to UUID
-- ============================================
-- This migration:
-- 1. Adds display_name column (preserves T1A01 format)
-- 2. Converts id from TEXT to UUID
-- 3. Updates all foreign key references
-- ============================================

-- ============================================
-- PHASE 1: Add display_name column to questions
-- ============================================
ALTER TABLE questions ADD COLUMN display_name TEXT;
UPDATE questions SET display_name = id;
ALTER TABLE questions ALTER COLUMN display_name SET NOT NULL;
ALTER TABLE questions ADD CONSTRAINT questions_display_name_unique UNIQUE(display_name);

-- ============================================
-- PHASE 2: Add UUID column to questions
-- ============================================
ALTER TABLE questions ADD COLUMN uuid UUID DEFAULT gen_random_uuid();
UPDATE questions SET uuid = gen_random_uuid() WHERE uuid IS NULL;
ALTER TABLE questions ALTER COLUMN uuid SET NOT NULL;

-- ============================================
-- PHASE 3: Create mapping table for ID transition
-- ============================================
-- This maps old text IDs to new UUIDs for updating foreign keys
CREATE TEMP TABLE question_id_map AS
SELECT id AS old_id, uuid AS new_uuid FROM questions;

-- ============================================
-- PHASE 4: Drop foreign key constraints
-- ============================================
ALTER TABLE question_attempts DROP CONSTRAINT question_attempts_question_id_fkey;
ALTER TABLE bookmarked_questions DROP CONSTRAINT bookmarked_questions_question_id_fkey;
ALTER TABLE explanation_feedback DROP CONSTRAINT explanation_feedback_question_id_fkey;

-- ============================================
-- PHASE 5: Add UUID columns to referencing tables and populate
-- ============================================
ALTER TABLE question_attempts ADD COLUMN question_uuid UUID;
UPDATE question_attempts SET question_uuid = m.new_uuid
FROM question_id_map m WHERE question_attempts.question_id = m.old_id;

ALTER TABLE bookmarked_questions ADD COLUMN question_uuid UUID;
UPDATE bookmarked_questions SET question_uuid = m.new_uuid
FROM question_id_map m WHERE bookmarked_questions.question_id = m.old_id;

ALTER TABLE explanation_feedback ADD COLUMN question_uuid UUID;
UPDATE explanation_feedback SET question_uuid = m.new_uuid
FROM question_id_map m WHERE explanation_feedback.question_id = m.old_id;

-- ============================================
-- PHASE 6: Switch columns in referencing tables
-- ============================================
ALTER TABLE question_attempts DROP COLUMN question_id;
ALTER TABLE question_attempts RENAME COLUMN question_uuid TO question_id;
ALTER TABLE question_attempts ALTER COLUMN question_id SET NOT NULL;

ALTER TABLE bookmarked_questions DROP COLUMN question_id;
ALTER TABLE bookmarked_questions RENAME COLUMN question_uuid TO question_id;
ALTER TABLE bookmarked_questions ALTER COLUMN question_id SET NOT NULL;

ALTER TABLE explanation_feedback DROP COLUMN question_id;
ALTER TABLE explanation_feedback RENAME COLUMN question_uuid TO question_id;
ALTER TABLE explanation_feedback ALTER COLUMN question_id SET NOT NULL;

-- ============================================
-- PHASE 7: Switch primary key in questions table
-- ============================================
ALTER TABLE questions DROP CONSTRAINT questions_pkey;
ALTER TABLE questions DROP COLUMN id;
ALTER TABLE questions RENAME COLUMN uuid TO id;
ALTER TABLE questions ADD PRIMARY KEY (id);

-- ============================================
-- PHASE 8: Re-add foreign keys (now UUID-based)
-- ============================================
ALTER TABLE question_attempts
  ADD CONSTRAINT question_attempts_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

ALTER TABLE bookmarked_questions
  ADD CONSTRAINT bookmarked_questions_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

ALTER TABLE explanation_feedback
  ADD CONSTRAINT explanation_feedback_question_id_fkey
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

-- ============================================
-- PHASE 9: Recreate indexes
-- ============================================
DROP INDEX IF EXISTS idx_question_attempts_user_question;
CREATE INDEX idx_question_attempts_user_question ON question_attempts(user_id, question_id);
CREATE INDEX idx_questions_display_name ON questions(display_name);
