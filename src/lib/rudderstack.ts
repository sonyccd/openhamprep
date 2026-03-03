/**
 * Centralized RudderStack event tracking utility.
 *
 * Mirrors the Amplitude tracking module (amplitude.ts) so that all events
 * are sent to both Amplitude (direct SDK) and RudderStack (for routing
 * to downstream destinations). Uses the same event names and property
 * schemas for consistency.
 */

import type {
  PracticeTestStartedProps,
  PracticeTestCompletedProps,
  QuestionAnsweredProps,
  QuizStartedProps,
  QuizCompletedProps,
  LicenseTypeChangedProps,
  AiPromptCopiedProps,
} from './amplitude';

// ── Helpers ──────────────────────────────────────────────────────────

function safeTrack(eventName: string, properties?: Record<string, unknown>): void {
  if (!(window as any).rudderanalytics) return;

  try {
    (window as any).rudderanalytics.track(eventName, properties);
  } catch (error) {
    console.warn(`RudderStack tracking failed for "${eventName}":`, error);
  }
}

// ── Auth events ──────────────────────────────────────────────────────

export function rsTrackSignUp(): void {
  safeTrack('sign_up');
}

export function rsTrackSignIn(method: 'email' | 'google'): void {
  safeTrack('sign_in', { method });
}

export function rsTrackSignOut(): void {
  safeTrack('sign_out');
}

// ── Study events ─────────────────────────────────────────────────────

export function rsTrackPracticeTestStarted(props: PracticeTestStartedProps): void {
  safeTrack('practice_test_started', props);
}

export function rsTrackPracticeTestCompleted(props: PracticeTestCompletedProps): void {
  safeTrack('practice_test_completed', props);
}

export function rsTrackQuestionAnswered(props: QuestionAnsweredProps): void {
  safeTrack('question_answered', props);
}

export function rsTrackQuizStarted(props: QuizStartedProps): void {
  safeTrack('quiz_started', props);
}

export function rsTrackQuizCompleted(props: QuizCompletedProps): void {
  safeTrack('quiz_completed', props);
}

// ── Navigation events ────────────────────────────────────────────────

export function rsTrackLicenseTypeChanged(props: LicenseTypeChangedProps): void {
  safeTrack('license_type_changed', props);
}

export function rsTrackStudyModeSelected(mode: string): void {
  safeTrack('study_mode_selected', { mode });
}

// ── Content events ───────────────────────────────────────────────────

export function rsTrackBookmarkAdded(questionId: string): void {
  safeTrack('bookmark_added', { question_id: questionId });
}

export function rsTrackBookmarkRemoved(questionId: string): void {
  safeTrack('bookmark_removed', { question_id: questionId });
}

export function rsTrackTopicViewed(topicSlug: string): void {
  safeTrack('topic_viewed', { topic_slug: topicSlug });
}

export function rsTrackLessonViewed(lessonSlug: string): void {
  safeTrack('lesson_viewed', { lesson_slug: lessonSlug });
}

export function rsTrackGlossarySearched(query: string): void {
  safeTrack('glossary_searched', { query });
}

// ── AI Prompt events ────────────────────────────────────────────────

export function rsTrackAiPromptCopied(props: AiPromptCopiedProps): void {
  safeTrack('ai_prompt_copied', props);
}
