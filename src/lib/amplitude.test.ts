import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ensure we test the real implementation, not the global mock from setup.ts
vi.unmock('@/lib/amplitude');

// vi.hoisted runs before imports — set env var and create mock fns
const { mockTrack } = vi.hoisted(() => {
  import.meta.env.VITE_AMPLITUDE_API_KEY = 'test-api-key';
  return {
    mockTrack: vi.fn(),
  };
});

vi.mock('@amplitude/analytics-browser', () => ({
  track: mockTrack,
}));

import {
  trackSignUp,
  trackSignIn,
  trackSignOut,
  trackPracticeTestStarted,
  trackPracticeTestCompleted,
  trackQuestionAnswered,
  trackQuizCompleted,
  trackLicenseTypeChanged,
  trackStudyModeSelected,
  trackBookmarkAdded,
  trackBookmarkRemoved,
  trackTopicViewed,
  trackLessonViewed,
  trackGlossarySearched,
} from './amplitude';

describe('Amplitude tracking utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auth events', () => {
    it('tracks sign_up', () => {
      trackSignUp();
      expect(mockTrack).toHaveBeenCalledWith('sign_up', undefined);
    });

    it('tracks sign_in with method', () => {
      trackSignIn('email');
      expect(mockTrack).toHaveBeenCalledWith('sign_in', { method: 'email' });

      trackSignIn('google');
      expect(mockTrack).toHaveBeenCalledWith('sign_in', { method: 'google' });
    });

    it('tracks sign_out', () => {
      trackSignOut();
      expect(mockTrack).toHaveBeenCalledWith('sign_out', undefined);
    });
  });

  describe('study events', () => {
    it('tracks practice_test_started', () => {
      trackPracticeTestStarted({ test_type: 'technician', question_count: 35 });
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
      trackPracticeTestCompleted(props);
      expect(mockTrack).toHaveBeenCalledWith('practice_test_completed', props);
    });

    it('tracks question_answered', () => {
      const props = {
        question_id: 'T1A01',
        is_correct: true,
        attempt_type: 'random_practice',
      };
      trackQuestionAnswered(props);
      expect(mockTrack).toHaveBeenCalledWith('question_answered', props);
    });

    it('tracks quiz_completed', () => {
      const props = {
        total_questions: 10,
        correct_count: 8,
        percentage: 80,
        passed: true,
        attempt_type: 'topic_quiz',
      };
      trackQuizCompleted(props);
      expect(mockTrack).toHaveBeenCalledWith('quiz_completed', props);
    });
  });

  describe('navigation events', () => {
    it('tracks license_type_changed', () => {
      trackLicenseTypeChanged({ new_type: 'general', previous_type: 'technician' });
      expect(mockTrack).toHaveBeenCalledWith('license_type_changed', {
        new_type: 'general',
        previous_type: 'technician',
      });
    });

    it('tracks study_mode_selected', () => {
      trackStudyModeSelected('random-practice');
      expect(mockTrack).toHaveBeenCalledWith('study_mode_selected', { mode: 'random-practice' });
    });
  });

  describe('content events', () => {
    it('tracks bookmark_added', () => {
      trackBookmarkAdded('T1A01');
      expect(mockTrack).toHaveBeenCalledWith('bookmark_added', { question_id: 'T1A01' });
    });

    it('tracks bookmark_removed', () => {
      trackBookmarkRemoved('T1A01');
      expect(mockTrack).toHaveBeenCalledWith('bookmark_removed', { question_id: 'T1A01' });
    });

    it('tracks topic_viewed', () => {
      trackTopicViewed('ohms-law');
      expect(mockTrack).toHaveBeenCalledWith('topic_viewed', { topic_slug: 'ohms-law' });
    });

    it('tracks lesson_viewed', () => {
      trackLessonViewed('basic-electronics');
      expect(mockTrack).toHaveBeenCalledWith('lesson_viewed', { lesson_slug: 'basic-electronics' });
    });

    it('tracks glossary_searched', () => {
      trackGlossarySearched('impedance');
      expect(mockTrack).toHaveBeenCalledWith('glossary_searched', { query: 'impedance' });
    });
  });

  describe('error handling', () => {
    it('catches and warns on track errors without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockTrack.mockImplementation(() => {
        throw new Error('SDK error');
      });

      // Should not throw
      expect(() => trackSignUp()).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Amplitude tracking failed for "sign_up":',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});

describe('Amplitude tracking without API key', () => {
  it('does not call track when API key is missing', async () => {
    vi.resetModules();

    const savedKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
    import.meta.env.VITE_AMPLITUDE_API_KEY = '';

    const localTrack = vi.fn();
    vi.doMock('@amplitude/analytics-browser', () => ({
      track: localTrack,
    }));

    const { trackSignUp: noKeyTrackSignUp } = await import('./amplitude');
    noKeyTrackSignUp();

    expect(localTrack).not.toHaveBeenCalled();

    // Restore
    import.meta.env.VITE_AMPLITUDE_API_KEY = savedKey;
  });
});
