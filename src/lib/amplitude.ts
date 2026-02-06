/**
 * Centralized Amplitude custom event tracking utility.
 *
 * All Amplitude track() calls go through this module so there is a single
 * auditable source of truth for analytics events. The safeTrack helper
 * gracefully degrades when the API key is missing or the SDK throws.
 */

import * as amplitude from '@amplitude/analytics-browser';
import type { TestType } from '@/types/navigation';

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY || '';

// ── Helpers ──────────────────────────────────────────────────────────

function safeTrack(eventName: string, properties?: Record<string, unknown>): void {
  if (!AMPLITUDE_API_KEY) return;

  try {
    amplitude.track(eventName, properties);
  } catch (error) {
    console.warn(`Amplitude tracking failed for "${eventName}":`, error);
  }
}

// ── Types ────────────────────────────────────────────────────────────

/** Mirrors the attempt_type values used in the question_attempts table. */
export type AttemptType =
  | 'practice_test'
  | 'random_practice'
  | 'subelement_practice'
  | 'chapter_practice'
  | 'weak_questions'
  | 'topic_quiz';

// ── Event property interfaces ────────────────────────────────────────
// Convention: event names and property keys use snake_case to match
// Amplitude's standard naming and keep the dashboard consistent.

export interface PracticeTestStartedProps {
  test_type: TestType;
  question_count: number;
}

export interface PracticeTestCompletedProps {
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  test_type: TestType;
}

export interface QuizStartedProps {
  topic_slug: string;
  question_count: number;
}

export interface QuestionAnsweredProps {
  question_id: string;
  is_correct: boolean;
  attempt_type: AttemptType;
}

export interface QuizCompletedProps {
  total_questions: number;
  correct_count: number;
  percentage: number;
  passed: boolean;
  attempt_type: AttemptType;
}

export interface LicenseTypeChangedProps {
  new_type: string;
  previous_type: string;
}

// ── Auth events ──────────────────────────────────────────────────────

export function trackSignUp(): void {
  safeTrack('sign_up');
}

export function trackSignIn(method: 'email' | 'google'): void {
  safeTrack('sign_in', { method });
}

export function trackSignOut(): void {
  safeTrack('sign_out');
}

// ── Study events ─────────────────────────────────────────────────────

export function trackPracticeTestStarted(props: PracticeTestStartedProps): void {
  safeTrack('practice_test_started', props);
}

export function trackPracticeTestCompleted(props: PracticeTestCompletedProps): void {
  safeTrack('practice_test_completed', props);
}

export function trackQuestionAnswered(props: QuestionAnsweredProps): void {
  safeTrack('question_answered', props);
}

export function trackQuizStarted(props: QuizStartedProps): void {
  safeTrack('quiz_started', props);
}

export function trackQuizCompleted(props: QuizCompletedProps): void {
  safeTrack('quiz_completed', props);
}

// ── Navigation events ────────────────────────────────────────────────

export function trackLicenseTypeChanged(props: LicenseTypeChangedProps): void {
  safeTrack('license_type_changed', props);
}

export function trackStudyModeSelected(mode: string): void {
  safeTrack('study_mode_selected', { mode });
}

// ── Content events ───────────────────────────────────────────────────

export function trackBookmarkAdded(questionId: string): void {
  safeTrack('bookmark_added', { question_id: questionId });
}

export function trackBookmarkRemoved(questionId: string): void {
  safeTrack('bookmark_removed', { question_id: questionId });
}

export function trackTopicViewed(topicSlug: string): void {
  safeTrack('topic_viewed', { topic_slug: topicSlug });
}

export function trackLessonViewed(lessonSlug: string): void {
  safeTrack('lesson_viewed', { lesson_slug: lessonSlug });
}

export function trackGlossarySearched(query: string): void {
  safeTrack('glossary_searched', { query });
}
