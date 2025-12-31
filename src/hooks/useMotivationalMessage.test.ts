import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMotivationalMessage } from './useMotivationalMessage';

describe('useMotivationalMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Ready State Messages', () => {
    it('returns a ready message when readiness level is ready', () => {
      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'ready',
          weakQuestionCount: 0,
          totalTests: 10,
        })
      );

      const readyMessages = [
        "You've put in the work. Time to get that license!",
        "Your practice has paid off. You're exam ready!",
        'Confidence earned through preparation. Go get it!',
      ];

      expect(readyMessages).toContain(result.current);
    });
  });

  describe('Getting Close Messages', () => {
    it('returns a getting-close message', () => {
      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'getting-close',
          weakQuestionCount: 5,
          totalTests: 5,
        })
      );

      const closeMessages = [
        "Almost there! A few more sessions and you'll be ready.",
        'Great progress! Keep pushing through the finish line.',
        "You're in the home stretch. Stay focused!",
      ];

      expect(closeMessages).toContain(result.current);
    });
  });

  describe('Weak Questions Message', () => {
    it('returns weak areas message when many weak questions', () => {
      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'needs-work',
          weakQuestionCount: 15,
          totalTests: 5,
        })
      );

      expect(result.current).toBe('Focus on your weak areas today. Small improvements add up!');
    });

    it('does not show weak areas message for 10 or fewer questions', () => {
      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'needs-work',
          weakQuestionCount: 10,
          totalTests: 5,
        })
      );

      expect(result.current).not.toBe('Focus on your weak areas today. Small improvements add up!');
    });
  });

  describe('New User Messages', () => {
    it('returns morning message for new users in the morning', () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00'));

      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'not-started',
          weakQuestionCount: 0,
          totalTests: 0,
        })
      );

      expect(result.current).toBe('Good morning! Ready to start your ham radio journey?');
    });

    it('returns afternoon message for new users in the afternoon', () => {
      vi.setSystemTime(new Date('2024-01-15T14:00:00'));

      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'not-started',
          weakQuestionCount: 0,
          totalTests: 0,
        })
      );

      expect(result.current).toBe('Great time to begin studying. Take your first practice test!');
    });

    it('returns evening message for new users in the evening', () => {
      vi.setSystemTime(new Date('2024-01-15T19:00:00'));

      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'not-started',
          weakQuestionCount: 0,
          totalTests: 0,
        })
      );

      expect(result.current).toBe("Evening study sessions can be very effective. Let's go!");
    });

    it('returns night message for new users at night', () => {
      vi.setSystemTime(new Date('2024-01-15T22:00:00'));

      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'not-started',
          weakQuestionCount: 0,
          totalTests: 0,
        })
      );

      expect(result.current).toBe("Night owl studying? Let's make some progress!");
    });
  });

  describe('Time-Based Messages for Regular Users', () => {
    it('returns a morning message for regular users', () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00'));

      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'needs-work',
          weakQuestionCount: 5,
          totalTests: 3,
        })
      );

      const morningMessages = [
        'Morning studies stick best. Great time to learn!',
        "Early bird catches the license! Let's study.",
        'Fresh mind, fresh start. Ready to practice?',
      ];

      expect(morningMessages).toContain(result.current);
    });

    it('returns an afternoon message for regular users', () => {
      vi.setSystemTime(new Date('2024-01-15T14:00:00'));

      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'needs-work',
          weakQuestionCount: 5,
          totalTests: 3,
        })
      );

      const afternoonMessages = [
        'Afternoon study break? Perfect timing!',
        'Keep the momentum going this afternoon.',
        'A little progress each day leads to big results.',
      ];

      expect(afternoonMessages).toContain(result.current);
    });

    it('returns an evening message for regular users', () => {
      vi.setSystemTime(new Date('2024-01-15T19:00:00'));

      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'needs-work',
          weakQuestionCount: 5,
          totalTests: 3,
        })
      );

      const eveningMessages = [
        'Wind down with some practice questions.',
        "Evening review helps lock in what you've learned.",
        'Consistent evening practice builds lasting knowledge.',
      ];

      expect(eveningMessages).toContain(result.current);
    });

    it('returns a night message for regular users', () => {
      vi.setSystemTime(new Date('2024-01-15T22:00:00'));

      const { result } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'needs-work',
          weakQuestionCount: 5,
          totalTests: 3,
        })
      );

      const nightMessages = [
        'Late night study session? Your dedication is inspiring!',
        'Burning the midnight oil? Every bit of practice counts.',
        'Night study can be peaceful and productive.',
      ];

      expect(nightMessages).toContain(result.current);
    });
  });

  describe('Memoization', () => {
    it('returns the same message for the same inputs', () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00'));

      const { result, rerender } = renderHook(() =>
        useMotivationalMessage({
          readinessLevel: 'ready',
          weakQuestionCount: 0,
          totalTests: 10,
        })
      );

      const firstMessage = result.current;
      rerender();

      expect(result.current).toBe(firstMessage);
    });
  });
});
