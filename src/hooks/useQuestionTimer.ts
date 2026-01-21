import { useRef, useEffect, useCallback } from 'react';

/**
 * Hook for tracking time spent on a question.
 *
 * Automatically resets the timer when the question ID changes,
 * providing accurate per-question timing data for analytics.
 *
 * @param questionId - The current question's ID (changes trigger timer reset)
 * @returns Object with getElapsedMs function to retrieve elapsed time
 *
 * @example
 * const { getElapsedMs } = useQuestionTimer(question.id);
 *
 * const handleAnswer = async (answer: string) => {
 *   const timeSpent = getElapsedMs();
 *   await saveAttempt(question, answer, timeSpent);
 * };
 */
export function useQuestionTimer(questionId: string | undefined) {
  const startTimeRef = useRef<number>(Date.now());

  // Reset timer when question changes
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [questionId]);

  /**
   * Get the elapsed time since the question was shown.
   * Call this when the user submits their answer.
   */
  const getElapsedMs = useCallback((): number => {
    return Date.now() - startTimeRef.current;
  }, []);

  /**
   * Manually reset the timer.
   * Useful when a question is skipped and shown again later.
   */
  const resetTimer = useCallback((): void => {
    startTimeRef.current = Date.now();
  }, []);

  return { getElapsedMs, resetTimer };
}
