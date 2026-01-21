/**
 * Event recording library for event-sourcing user actions.
 *
 * This library provides functions to record events to the events table,
 * which runs in parallel with the existing question_attempts system.
 * Events are recorded in a fire-and-forget pattern to avoid blocking UI.
 */

import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/hooks/useQuestions';
import { FEATURE_FLAGS } from './featureFlags';
import { POOL_CONFIG, getPoolVersionForExamType } from './poolConfig';

/** Maximum time we'll record for time_spent_ms (3 minutes per documentation) */
const TIME_CAP_MS = 180000;

/** Event types supported by the system (section 6 of documentation) */
export type EventType =
  | 'question_attempt'        // 6.1 - Every question answered
  | 'practice_test_completed' // 6.2 - Full practice exam completions
  | 'exam_outcome'            // 6.3 - Real exam results for model calibration
  | 'topic_quiz_completed';   // Additional: topic mastery quizzes

/** Base event structure */
interface BaseEvent {
  eventType: EventType;
  payload: Record<string, unknown>;
}

/** Question attempt event payload (per documentation section 6.1) */
export interface QuestionAttemptPayload {
  question_id: string;
  question_code: string; // Display name (T1A01, etc.)
  content_hash: string | null;
  pool_version: string | null;
  topic_code: string; // Topic/group code (e.g., 'T5A')
  answer_selected: number; // 0-3
  correct_answer: number; // 0-3
  is_correct: boolean;
  time_spent_ms: number; // Capped at 180000 (3 min)
  time_raw_ms: number; // Actual uncapped elapsed time
  mode: string; // practice_test, random_practice, etc.
  practice_test_id?: string | null; // UUID if part of a practice test
}

/** Practice test completed event payload (per documentation section 6.2) */
export interface PracticeTestCompletedPayload {
  practice_test_id: string; // Unique identifier for this test
  test_result_id: string | null; // FK to practice_test_results if exists
  exam_type: string; // e.g., 'technician'
  pool_version: string; // Which question pool was used
  score: number; // Number answered correctly
  total_questions: number; // Total questions (e.g., 35)
  passing_threshold: number; // Required to pass (e.g., 0.74)
  percentage: number; // Score as percentage
  duration_seconds: number; // Time to complete
  subelement_breakdown: Record<string, { correct: number; total: number }>; // Results by subelement
  // Note: No 'passed' boolean - derive it as (score / total_questions >= passing_threshold)
}

/** Exam outcome event payload (per documentation section 6.3) */
export interface ExamOutcomePayload {
  source: 'user_reported' | 'system_calculated' | 'imported';
  exam_type: string; // Which exam was taken
  pool_version: string; // Which pool the exam used
  score: number | null; // Their score if known
  total_questions: number; // Questions on the exam
  passing_threshold: number; // Required to pass (e.g., 0.74)
  attempt_number: number; // Which attempt (1st, 2nd, etc.)
  exam_date: string; // When they took the exam (ISO date)
  confidence_level: string | null; // How confident they felt
  state_snapshot: {
    readiness_score: number;
    pass_probability: number;
    coverage: number;
    recent_accuracy: number;
    practice_tests_passed: number;
    practice_tests_taken: number;
  } | null; // User's readiness state at exam time
}

/** Topic quiz completed event payload */
export interface TopicQuizCompletedPayload {
  topic_id: string;
  topic_slug: string;
  total_questions: number;
  correct_count: number;
  percentage: number;
  passed: boolean;
}

/**
 * Record a generic event to the events table.
 * This is the base function used by specialized event recorders.
 *
 * @param event - The event to record
 * @returns Promise that resolves when the event is recorded
 */
async function recordEvent(event: BaseEvent): Promise<void> {
  // Check feature flag
  if (!FEATURE_FLAGS.enableEventRecording) {
    return;
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.debug('Event recording skipped: no authenticated user');
    return;
  }

  const { error } = await supabase
    .from('events')
    .insert({
      event_type: event.eventType,
      user_id: user.id,
      payload: event.payload,
      timestamp: new Date().toISOString()
    });

  if (error) {
    // Log but don't throw - events are supplementary to main functionality
    console.error('Failed to record event:', error.message);
  }
}

/**
 * Record a question attempt event.
 *
 * @param params - Question attempt details
 */
export async function recordQuestionAttempt(params: {
  question: Question;
  answerSelected: number;
  timeElapsedMs: number;
  mode: string;
  practiceTestId?: string;
}): Promise<void> {
  const { question, answerSelected, timeElapsedMs, mode, practiceTestId } = params;

  // Map letter answers to index (0-3)
  const answerToIndex: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  const correctAnswerIdx = answerToIndex[question.correctAnswer] ?? 0;

  const payload: QuestionAttemptPayload = {
    question_id: question.id,
    question_code: question.displayName,
    content_hash: question.contentHash ?? null,
    pool_version: question.poolVersion ?? getPoolVersionFromDisplayName(question.displayName),
    topic_code: question.group || question.displayName.slice(0, 3), // e.g., 'T5A' from 'T5A03'
    answer_selected: answerSelected,
    correct_answer: correctAnswerIdx,
    is_correct: answerSelected === correctAnswerIdx,
    time_spent_ms: Math.min(timeElapsedMs, TIME_CAP_MS), // Capped at 3 minutes
    time_raw_ms: timeElapsedMs, // Actual uncapped time
    mode,
    practice_test_id: practiceTestId || null
  };

  await recordEvent({
    eventType: 'question_attempt',
    payload: payload as unknown as Record<string, unknown>
  });
}

/**
 * Record a practice test completion event (per documentation section 6.2).
 *
 * @param params - Test completion details
 */
export async function recordPracticeTestCompleted(params: {
  practiceTestId: string;
  testResultId?: string;
  examType: string;
  totalQuestions: number;
  score: number;
  percentage: number;
  durationSeconds: number;
  subelementBreakdown?: Record<string, { correct: number; total: number }>;
}): Promise<void> {
  const {
    practiceTestId,
    testResultId,
    examType,
    totalQuestions,
    score,
    percentage,
    durationSeconds,
    subelementBreakdown
  } = params;

  const poolVersion = getPoolVersionForExamType(examType as 'technician' | 'general' | 'extra');
  const passingThreshold = POOL_CONFIG[examType as keyof typeof POOL_CONFIG]?.passingThreshold ?? 0.74;

  const payload: PracticeTestCompletedPayload = {
    practice_test_id: practiceTestId,
    test_result_id: testResultId || null,
    exam_type: examType,
    pool_version: poolVersion,
    score,
    total_questions: totalQuestions,
    passing_threshold: passingThreshold,
    percentage,
    duration_seconds: durationSeconds,
    subelement_breakdown: subelementBreakdown || {}
  };

  await recordEvent({
    eventType: 'practice_test_completed',
    payload: payload as unknown as Record<string, unknown>
  });
}

/**
 * Record an exam outcome event (per documentation section 6.3).
 * Used when a real exam result is recorded - most valuable for model calibration.
 *
 * @param params - Exam outcome details
 */
export async function recordExamOutcome(params: {
  source: 'user_reported' | 'system_calculated' | 'imported';
  examType: string;
  score: number | null;
  totalQuestions: number;
  attemptNumber: number;
  examDate: string;
  confidenceLevel?: string;
  stateSnapshot?: ExamOutcomePayload['state_snapshot'];
}): Promise<void> {
  const {
    source,
    examType,
    score,
    totalQuestions,
    attemptNumber,
    examDate,
    confidenceLevel,
    stateSnapshot
  } = params;

  const poolVersion = getPoolVersionForExamType(examType as 'technician' | 'general' | 'extra');
  const passingThreshold = POOL_CONFIG[examType as keyof typeof POOL_CONFIG]?.passingThreshold ?? 0.74;

  const payload: ExamOutcomePayload = {
    source,
    exam_type: examType,
    pool_version: poolVersion,
    score,
    total_questions: totalQuestions,
    passing_threshold: passingThreshold,
    attempt_number: attemptNumber,
    exam_date: examDate,
    confidence_level: confidenceLevel || null,
    state_snapshot: stateSnapshot || null
  };

  await recordEvent({
    eventType: 'exam_outcome',
    payload: payload as unknown as Record<string, unknown>
  });
}

/**
 * Record a topic quiz completion event.
 *
 * @param params - Quiz completion details
 */
export async function recordTopicQuizCompleted(params: {
  topicId: string;
  topicSlug: string;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  passed: boolean;
}): Promise<void> {
  const { topicId, topicSlug, totalQuestions, correctCount, percentage, passed } = params;

  const payload: TopicQuizCompletedPayload = {
    topic_id: topicId,
    topic_slug: topicSlug,
    total_questions: totalQuestions,
    correct_count: correctCount,
    percentage,
    passed
  };

  await recordEvent({
    eventType: 'topic_quiz_completed',
    payload: payload as unknown as Record<string, unknown>
  });
}

/**
 * Helper to derive pool version from question display name prefix.
 * Used as fallback when question doesn't have poolVersion field set.
 */
function getPoolVersionFromDisplayName(displayName: string): string {
  const prefix = displayName.charAt(0).toUpperCase();

  switch (prefix) {
    case 'T':
      return POOL_CONFIG.technician.currentVersion;
    case 'G':
      return POOL_CONFIG.general.currentVersion;
    case 'E':
      return POOL_CONFIG.extra.currentVersion;
    default:
      return POOL_CONFIG.technician.currentVersion;
  }
}
