import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ensure we test the real implementation, not the global mock from setup.ts
vi.unmock('@/lib/rudderstack');

// vi.hoisted runs before imports — set env vars and create mock
const { mockTrack } = vi.hoisted(() => {
  import.meta.env.VITE_RUDDERSTACK_WRITE_KEY = 'test-write-key';
  import.meta.env.VITE_RUDDERSTACK_DATA_PLANE_URL = 'https://test.dataplane.rudderstack.com';
  const _mockTrack = vi.fn();

  // Set up window.rudderanalytics mock
  (globalThis as any).window = globalThis.window || {};
  (window as any).rudderanalytics = { track: _mockTrack };

  return { mockTrack: _mockTrack };
});

import {
  rsTrackSignUp,
  rsTrackSignIn,
  rsTrackSignOut,
  rsTrackPracticeTestStarted,
  rsTrackPracticeTestCompleted,
  rsTrackQuestionAnswered,
  rsTrackQuizStarted,
  rsTrackQuizCompleted,
  rsTrackLicenseTypeChanged,
  rsTrackStudyModeSelected,
  rsTrackBookmarkAdded,
  rsTrackBookmarkRemoved,
  rsTrackTopicViewed,
  rsTrackLessonViewed,
  rsTrackGlossarySearched,
  rsTrackAiPromptCopied,
} from './rudderstack';

describe('RudderStack tracking utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auth events', () => {
    it('tracks sign_up', () => {
      rsTrackSignUp();
      expect(mockTrack).toHaveBeenCalledWith('sign_up', undefined);
    });

    it('tracks sign_in with method', () => {
      rsTrackSignIn('email');
      expect(mockTrack).toHaveBeenCalledWith('sign_in', { method: 'email' });
    });

    it('tracks sign_out', () => {
      rsTrackSignOut();
      expect(mockTrack).toHaveBeenCalledWith('sign_out', undefined);
    });
  });

  describe('study events', () => {
    it('tracks practice_test_started', () => {
      rsTrackPracticeTestStarted({ test_type: 'technician', question_count: 35 });
      expect(mockTrack).toHaveBeenCalledWith('practice_test_started', {
        test_type: 'technician',
        question_count: 35,
      });
    });

    it('tracks practice_test_completed', () => {
      const props = {
        score: 30,
        total_questions: 35,
        percentage: 86,
        passed: true,
        test_type: 'technician',
      };
      rsTrackPracticeTestCompleted(props);
      expect(mockTrack).toHaveBeenCalledWith('practice_test_completed', props);
    });

    it('tracks question_answered', () => {
      const props = {
        question_id: 'T1A01',
        is_correct: true,
        attempt_type: 'random_practice',
      };
      rsTrackQuestionAnswered(props);
      expect(mockTrack).toHaveBeenCalledWith('question_answered', props);
    });

    it('tracks quiz_started', () => {
      rsTrackQuizStarted({ topic_slug: 'ohms-law', question_count: 5 });
      expect(mockTrack).toHaveBeenCalledWith('quiz_started', {
        topic_slug: 'ohms-law',
        question_count: 5,
      });
    });

    it('tracks quiz_completed', () => {
      const props = {
        total_questions: 10,
        correct_count: 8,
        percentage: 80,
        passed: true,
        attempt_type: 'topic_quiz',
      };
      rsTrackQuizCompleted(props);
      expect(mockTrack).toHaveBeenCalledWith('quiz_completed', props);
    });
  });

  describe('navigation events', () => {
    it('tracks license_type_changed', () => {
      rsTrackLicenseTypeChanged({ new_type: 'general', previous_type: 'technician' });
      expect(mockTrack).toHaveBeenCalledWith('license_type_changed', {
        new_type: 'general',
        previous_type: 'technician',
      });
    });

    it('tracks study_mode_selected', () => {
      rsTrackStudyModeSelected('random-practice');
      expect(mockTrack).toHaveBeenCalledWith('study_mode_selected', { mode: 'random-practice' });
    });
  });

  describe('content events', () => {
    it('tracks bookmark_added', () => {
      rsTrackBookmarkAdded('T1A01');
      expect(mockTrack).toHaveBeenCalledWith('bookmark_added', { question_id: 'T1A01' });
    });

    it('tracks bookmark_removed', () => {
      rsTrackBookmarkRemoved('T1A01');
      expect(mockTrack).toHaveBeenCalledWith('bookmark_removed', { question_id: 'T1A01' });
    });

    it('tracks topic_viewed', () => {
      rsTrackTopicViewed('ohms-law');
      expect(mockTrack).toHaveBeenCalledWith('topic_viewed', { topic_slug: 'ohms-law' });
    });

    it('tracks lesson_viewed', () => {
      rsTrackLessonViewed('basic-electronics');
      expect(mockTrack).toHaveBeenCalledWith('lesson_viewed', { lesson_slug: 'basic-electronics' });
    });

    it('tracks glossary_searched', () => {
      rsTrackGlossarySearched('impedance');
      expect(mockTrack).toHaveBeenCalledWith('glossary_searched', { query: 'impedance' });
    });
  });

  describe('AI prompt events', () => {
    it('tracks ai_prompt_copied', () => {
      rsTrackAiPromptCopied({
        question_id: 'T1A01',
        is_correct: true,
        license_class: 'technician',
      });
      expect(mockTrack).toHaveBeenCalledWith('ai_prompt_copied', {
        question_id: 'T1A01',
        is_correct: true,
        license_class: 'technician',
      });
    });
  });

  describe('error handling', () => {
    it('catches and warns on track errors without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockTrack.mockImplementation(() => {
        throw new Error('SDK error');
      });

      expect(() => rsTrackSignUp()).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'RudderStack tracking failed for "sign_up":',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});

describe('RudderStack tracking without config', () => {
  it('does not call track when rudderanalytics is not on window', () => {
    const savedAnalytics = (window as any).rudderanalytics;
    delete (window as any).rudderanalytics;

    // Re-import won't help since safeTrack checks at call time
    // Just verify it doesn't throw
    expect(() => rsTrackSignUp()).not.toThrow();

    // Restore
    (window as any).rudderanalytics = savedAnalytics;
  });
});
