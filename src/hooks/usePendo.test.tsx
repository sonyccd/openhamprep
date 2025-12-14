import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

// Mock useAuth
const mockUser = vi.fn();
vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: mockUser() }),
}));

// Import after mocks are set up
import { PendoProvider, usePendo, PENDO_EVENTS } from './usePendo';

describe('usePendo', () => {
  let mockAppendChild: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.mockReturnValue(null);

    // Mock appendChild to prevent actual script loading
    mockAppendChild = vi.fn();
    vi.spyOn(document.head, 'appendChild').mockImplementation(mockAppendChild);

    // Clear any existing window.pendo
    delete (window as { pendo?: unknown }).pendo;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usePendo hook', () => {
    it('throws error when used outside PendoProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePendo());
      }).toThrow('usePendo must be used within a PendoProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('PendoProvider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PendoProvider>{children}</PendoProvider>
    );

    it('provides track function', () => {
      const { result } = renderHook(() => usePendo(), { wrapper });

      expect(typeof result.current.track).toBe('function');
    });

    it('provides isReady state', () => {
      const { result } = renderHook(() => usePendo(), { wrapper });

      expect(typeof result.current.isReady).toBe('boolean');
    });

    it('does not load Pendo script when no API key is set', () => {
      mockUser.mockReturnValue({ id: 'user-1', email: 'test@example.com' });

      renderHook(() => usePendo(), { wrapper });

      // Without VITE_PENDO_API_KEY set, script should not be added
      expect(mockAppendChild).not.toHaveBeenCalled();
    });

    it('does not load Pendo script when user is not authenticated', () => {
      mockUser.mockReturnValue(null);

      renderHook(() => usePendo(), { wrapper });

      expect(mockAppendChild).not.toHaveBeenCalled();
    });

    it('track function is safe to call when not initialized', () => {
      mockUser.mockReturnValue(null);

      const { result } = renderHook(() => usePendo(), { wrapper });

      // Should not throw
      expect(() => {
        result.current.track('test_event', { property: 'value' });
      }).not.toThrow();
    });

    it('isReady is false when user is not authenticated', () => {
      mockUser.mockReturnValue(null);

      const { result } = renderHook(() => usePendo(), { wrapper });

      expect(result.current.isReady).toBe(false);
    });

    it('can be rerendered without error', () => {
      mockUser.mockReturnValue(null);

      const { rerender } = renderHook(() => usePendo(), { wrapper });

      expect(() => {
        rerender();
        rerender();
      }).not.toThrow();
    });
  });

  describe('PENDO_EVENTS', () => {
    it('exports practice test events', () => {
      expect(PENDO_EVENTS.PRACTICE_TEST_STARTED).toBe('practice_test_started');
      expect(PENDO_EVENTS.PRACTICE_TEST_COMPLETED).toBe('practice_test_completed');
      expect(PENDO_EVENTS.PRACTICE_TEST_PASSED).toBe('practice_test_passed');
      expect(PENDO_EVENTS.PRACTICE_TEST_FAILED).toBe('practice_test_failed');
    });

    it('exports random practice events', () => {
      expect(PENDO_EVENTS.RANDOM_PRACTICE_STARTED).toBe('random_practice_started');
      expect(PENDO_EVENTS.QUESTION_ANSWERED).toBe('question_answered');
      expect(PENDO_EVENTS.STREAK_MILESTONE).toBe('streak_milestone_reached');
      expect(PENDO_EVENTS.NEW_BEST_STREAK).toBe('new_best_streak');
    });

    it('exports other events', () => {
      expect(PENDO_EVENTS.WEAK_QUESTIONS_REVIEWED).toBe('weak_questions_reviewed');
      expect(PENDO_EVENTS.TEST_RESULT_REVIEWED).toBe('test_result_reviewed');
    });
  });
});
