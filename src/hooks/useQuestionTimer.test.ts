import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuestionTimer } from './useQuestionTimer';

describe('useQuestionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns getElapsedMs and resetTimer functions', () => {
    const { result } = renderHook(() => useQuestionTimer('question-1'));

    expect(typeof result.current.getElapsedMs).toBe('function');
    expect(typeof result.current.resetTimer).toBe('function');
  });

  it('tracks elapsed time correctly', () => {
    const { result } = renderHook(() => useQuestionTimer('question-1'));

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const elapsed = result.current.getElapsedMs();
    expect(elapsed).toBe(5000);
  });

  it('resets timer when questionId changes', () => {
    const { result, rerender } = renderHook(
      ({ questionId }) => useQuestionTimer(questionId),
      { initialProps: { questionId: 'question-1' } }
    );

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.getElapsedMs()).toBe(5000);

    // Change question ID
    rerender({ questionId: 'question-2' });

    // Timer should have reset
    expect(result.current.getElapsedMs()).toBe(0);

    // Advance time by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.getElapsedMs()).toBe(2000);
  });

  it('resetTimer function resets the timer manually', () => {
    const { result } = renderHook(() => useQuestionTimer('question-1'));

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.getElapsedMs()).toBe(5000);

    // Reset timer manually
    act(() => {
      result.current.resetTimer();
    });

    // Timer should be reset
    expect(result.current.getElapsedMs()).toBe(0);
  });

  it('handles undefined questionId', () => {
    const { result } = renderHook(() => useQuestionTimer(undefined));

    // Should not throw
    expect(typeof result.current.getElapsedMs()).toBe('number');
  });

  it('timer continues to track after getting elapsed time', () => {
    const { result } = renderHook(() => useQuestionTimer('question-1'));

    // Advance time
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Get elapsed (should not reset)
    expect(result.current.getElapsedMs()).toBe(3000);

    // Advance more time
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should show cumulative time
    expect(result.current.getElapsedMs()).toBe(5000);
  });
});
