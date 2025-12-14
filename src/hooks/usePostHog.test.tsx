import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

// Mock posthog-js before importing the hook
const mockInit = vi.fn();
const mockIdentify = vi.fn();
const mockCapture = vi.fn();
const mockReset = vi.fn();

vi.mock('posthog-js', () => ({
  default: {
    init: (...args: unknown[]) => mockInit(...args),
    identify: (...args: unknown[]) => mockIdentify(...args),
    capture: (...args: unknown[]) => mockCapture(...args),
    reset: () => mockReset(),
  },
}));

// Mock useAuth
const mockUser = vi.fn();
vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: mockUser() }),
}));

// Unmock the usePostHog module (it's mocked globally in test/setup.ts)
vi.unmock('@/hooks/usePostHog');

// Import after mocks are set up
import { PostHogProvider, usePostHog, ANALYTICS_EVENTS } from './usePostHog';

describe('usePostHog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.mockReturnValue(null);
  });

  describe('usePostHog hook', () => {
    it('throws error when used outside PostHogProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePostHog());
      }).toThrow('usePostHog must be used within a PostHogProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('PostHogProvider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PostHogProvider>{children}</PostHogProvider>
    );

    it('provides capture function', () => {
      const { result } = renderHook(() => usePostHog(), { wrapper });

      expect(typeof result.current.capture).toBe('function');
    });

    it('provides isReady state', () => {
      const { result } = renderHook(() => usePostHog(), { wrapper });

      expect(typeof result.current.isReady).toBe('boolean');
    });

    it('does not initialize PostHog when no API key is set', () => {
      mockUser.mockReturnValue({ id: 'user-1', email: 'test@example.com' });

      renderHook(() => usePostHog(), { wrapper });

      // Without VITE_POSTHOG_KEY set, init should not be called
      expect(mockInit).not.toHaveBeenCalled();
    });

    it('does not initialize PostHog when user is not authenticated', () => {
      mockUser.mockReturnValue(null);

      renderHook(() => usePostHog(), { wrapper });

      expect(mockInit).not.toHaveBeenCalled();
    });

    it('capture function is safe to call when not initialized', () => {
      mockUser.mockReturnValue(null);

      const { result } = renderHook(() => usePostHog(), { wrapper });

      // Should not throw
      expect(() => {
        result.current.capture('test_event', { property: 'value' });
      }).not.toThrow();

      // PostHog capture should not be called
      expect(mockCapture).not.toHaveBeenCalled();
    });

    it('isReady is false when user is not authenticated', () => {
      mockUser.mockReturnValue(null);

      const { result } = renderHook(() => usePostHog(), { wrapper });

      expect(result.current.isReady).toBe(false);
    });
  });

  describe('ANALYTICS_EVENTS', () => {
    it('exports practice test events', () => {
      expect(ANALYTICS_EVENTS.PRACTICE_TEST_STARTED).toBe('practice_test_started');
      expect(ANALYTICS_EVENTS.PRACTICE_TEST_COMPLETED).toBe('practice_test_completed');
      expect(ANALYTICS_EVENTS.PRACTICE_TEST_PASSED).toBe('practice_test_passed');
      expect(ANALYTICS_EVENTS.PRACTICE_TEST_FAILED).toBe('practice_test_failed');
    });

    it('exports random practice events', () => {
      expect(ANALYTICS_EVENTS.RANDOM_PRACTICE_STARTED).toBe('random_practice_started');
      expect(ANALYTICS_EVENTS.QUESTION_ANSWERED).toBe('question_answered');
      expect(ANALYTICS_EVENTS.STREAK_MILESTONE).toBe('streak_milestone_reached');
      expect(ANALYTICS_EVENTS.NEW_BEST_STREAK).toBe('new_best_streak');
    });

    it('exports subelement practice events', () => {
      expect(ANALYTICS_EVENTS.SUBELEMENT_PRACTICE_STARTED).toBe('subelement_practice_started');
      expect(ANALYTICS_EVENTS.TOPIC_SELECTED).toBe('topic_selected');
    });

    it('exports bookmark events', () => {
      expect(ANALYTICS_EVENTS.QUESTION_BOOKMARKED).toBe('question_bookmarked');
      expect(ANALYTICS_EVENTS.BOOKMARK_REMOVED).toBe('bookmark_removed');
      expect(ANALYTICS_EVENTS.BOOKMARKED_QUESTION_REVIEWED).toBe('bookmarked_question_reviewed');
    });

    it('exports glossary events', () => {
      expect(ANALYTICS_EVENTS.FLASHCARD_SESSION_STARTED).toBe('flashcard_session_started');
      expect(ANALYTICS_EVENTS.FLASHCARD_REVIEWED).toBe('flashcard_reviewed');
      expect(ANALYTICS_EVENTS.TERM_MARKED_KNOWN).toBe('term_marked_known');
      expect(ANALYTICS_EVENTS.TERM_MARKED_UNKNOWN).toBe('term_marked_unknown');
    });

    it('exports calculator events', () => {
      expect(ANALYTICS_EVENTS.CALCULATOR_OPENED).toBe('calculator_opened');
      expect(ANALYTICS_EVENTS.CALCULATOR_USED).toBe('calculator_used');
    });

    it('exports other events', () => {
      expect(ANALYTICS_EVENTS.WEAK_QUESTIONS_REVIEWED).toBe('weak_questions_reviewed');
      expect(ANALYTICS_EVENTS.TEST_RESULT_REVIEWED).toBe('test_result_reviewed');
    });
  });
});
