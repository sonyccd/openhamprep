import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Question } from '@/hooks/useQuestions';
import { TestType, testConfig } from '@/types/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { recalculateReadiness } from '@/hooks/useReadinessScore';
import { recordQuestionAttempt, recordPracticeTestCompleted, recordTopicQuizCompleted } from '@/lib/events';
import { incrementDailyActivity } from '@/hooks/useDailyStreak';

/** Number of questions to batch before triggering a readiness recalculation */
const RECALC_QUESTION_THRESHOLD = 10;

/** Minimum time between recalculations (debounce) in ms */
const RECALC_DEBOUNCE_MS = 5000;

/** Valid exam type prefixes */
const EXAM_TYPE_PREFIXES = {
  T: 'technician',
  G: 'general',
  E: 'extra',
} as const;

type ExamPrefix = keyof typeof EXAM_TYPE_PREFIXES;

/**
 * Check if a character is a valid exam type prefix
 */
function isValidExamPrefix(char: string): char is ExamPrefix {
  return char in EXAM_TYPE_PREFIXES;
}

/**
 * Determine the exam type from a question's display_name or id.
 * Question IDs start with T (Technician), G (General), or E (Extra).
 * Falls back to 'technician' for invalid or unexpected formats.
 */
function getExamTypeFromQuestion(question: Question): TestType {
  const displayName = question.displayName || question.id;

  if (!displayName || displayName.length === 0) {
    console.warn('Question missing displayName and id, defaulting to technician');
    return 'technician';
  }

  const prefix = displayName.charAt(0).toUpperCase();

  if (isValidExamPrefix(prefix)) {
    return EXAM_TYPE_PREFIXES[prefix];
  }

  console.warn(`Unexpected question prefix "${prefix}" in "${displayName}", defaulting to technician`);
  return 'technician';
}

export function useProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Track pending question attempts for batched readiness recalculation
  const pendingRecalcCount = useRef(0);

  // Track last recalculation time for debouncing
  const lastRecalcTime = useRef<number>(0);

  // Track if a recalculation is in progress
  const recalcInProgress = useRef(false);

  const invalidateProgressQueries = useCallback(() => {
    if (!user) return;

    // Invalidate all queries that depend on user progress data
    // Note: daily-streak is invalidated separately after successful activity increment
    // to avoid race conditions with the RPC call
    queryClient.invalidateQueries({ queryKey: ['test-results', user.id] });
    queryClient.invalidateQueries({ queryKey: ['question-attempts', user.id] });
    queryClient.invalidateQueries({ queryKey: ['profile-stats', user.id] });
    queryClient.invalidateQueries({ queryKey: ['weekly-goals', user.id] });
  }, [queryClient, user]);

  /**
   * Invalidate readiness queries after recalculation
   */
  const invalidateReadinessQueries = useCallback(() => {
    if (!user) return;
    queryClient.invalidateQueries({ queryKey: ['readiness', user.id] });
    queryClient.invalidateQueries({ queryKey: ['readiness-snapshots', user.id] });
  }, [queryClient, user]);

  /**
   * Trigger readiness recalculation and invalidate cache.
   * Includes debouncing to prevent concurrent recalculations.
   */
  const triggerReadinessRecalc = useCallback(async (testType: TestType): Promise<boolean> => {
    const now = Date.now();

    // Skip if recalculation is already in progress
    if (recalcInProgress.current) {
      console.debug('Skipping recalc: already in progress');
      return false;
    }

    // Skip if we recalculated recently (debounce)
    if (now - lastRecalcTime.current < RECALC_DEBOUNCE_MS) {
      console.debug('Skipping recalc: debounced');
      // Invalidate queries even when debounced - the edge function may have completed
      // from a previous call, or the database may have been updated by another source.
      // This ensures the UI shows the latest cached data without triggering another
      // expensive edge function call.
      invalidateReadinessQueries();
      return false;
    }

    try {
      recalcInProgress.current = true;
      lastRecalcTime.current = now;

      const success = await recalculateReadiness(testType);

      if (!success) {
        // Log failed recalculations for monitoring - the edge function may have
        // partial failures but still update the cache, so we don't throw here
        console.warn('Readiness recalculation returned unsuccessful status');
      }

      // Always invalidate queries after recalculation attempt. The database cache
      // may have been updated even if the edge function reports an issue (e.g.,
      // partial success, timeout after write, etc.)
      invalidateReadinessQueries();
      return success;
    } finally {
      recalcInProgress.current = false;
    }
  }, [invalidateReadinessQueries]);

  const saveTestResult = async (
    questions: Question[],
    answers: Record<string, 'A' | 'B' | 'C' | 'D'>,
    testType: TestType = 'technician'
  ) => {
    if (!user) return null;

    const correctCount = questions.filter(
      (q) => answers[q.id] === q.correctAnswer
    ).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const { passingScore } = testConfig[testType];
    const passed = correctCount >= passingScore;

    // Save test result
    const { data: testResult, error: testError } = await supabase
      .from('practice_test_results')
      .insert({
        user_id: user.id,
        score: correctCount,
        total_questions: totalQuestions,
        percentage,
        passed,
        test_type: testType
      })
      .select()
      .single();

    if (testError) {
      console.error('Error saving test result:', testError);
      return null;
    }

    // Save individual question attempts
    const answerToIndex: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

    const attempts = questions.map((q) => ({
      user_id: user.id,
      question_id: q.id,
      selected_answer: answerToIndex[answers[q.id]] ?? 0,
      is_correct: answers[q.id] === q.correctAnswer,
      test_result_id: testResult.id,
      attempt_type: 'practice_test'
    }));

    const { error: attemptsError } = await supabase
      .from('question_attempts')
      .insert(attempts);

    if (attemptsError) {
      console.error('Error saving question attempts:', attemptsError);
    }

    // Record individual question attempt events (fire-and-forget)
    for (const question of questions) {
      recordQuestionAttempt({
        question,
        answerSelected: answerToIndex[answers[question.id]] ?? 0,
        timeElapsedMs: 0, // Per-question timing not tracked in practice tests
        mode: 'practice_test',
        practiceTestId: testResult.id,
        userId: user.id
      }).catch(err => console.error('Event recording failed:', err));
    }

    // Compute subelement breakdown for event recording
    const subelementBreakdown: Record<string, { correct: number; total: number }> = {};
    for (const question of questions) {
      // Extract subelement from question display name (e.g., 'T1' from 'T1A01')
      // Fall back to question.id if displayName is not available
      const displayName = question.displayName || question.id || '';
      const subelement = displayName.slice(0, 2);
      if (subelement && !subelementBreakdown[subelement]) {
        subelementBreakdown[subelement] = { correct: 0, total: 0 };
      }
      if (subelement) {
        subelementBreakdown[subelement].total++;
        if (answers[question.id] === question.correctAnswer) {
          subelementBreakdown[subelement].correct++;
        }
      }
    }

    // Record practice test completed event (fire-and-forget)
    recordPracticeTestCompleted({
      practiceTestId: testResult.id,
      testResultId: testResult.id,
      examType: testType,
      totalQuestions,
      score: correctCount,
      percentage,
      durationSeconds: 0, // Total time not tracked at test level yet
      subelementBreakdown,
      userId: user.id
    }).catch(err => console.error('Event recording failed:', err));

    // Track test completion event in Pendo
    if (window.pendo?.track) {
      window.pendo.track('Test Completed', {
        score: correctCount,
        total_questions: totalQuestions,
        percentage: percentage,
        passed: passed,
        test_type: testType
      });
    }

    // Track daily activity for streaks
    // Invalidate streak cache only after successful increment to avoid stale data race
    incrementDailyActivity(user.id, {
      questions: totalQuestions,
      correct: correctCount,
      tests: 1,
      testsPassed: passed ? 1 : 0,
    }).then(success => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['daily-streak', user.id] });
      }
    }).catch(err => console.error('Daily activity tracking failed:', err));

    // Invalidate cached queries so UI updates immediately
    invalidateProgressQueries();

    // Recalculate readiness score after completing a test
    // This is done in the background - don't block the UI
    triggerReadinessRecalc(testType).catch((err) => {
      console.error('Failed to recalculate readiness after test:', err);
    });

    // Reset pending count since we just recalculated
    pendingRecalcCount.current = 0;

    return testResult;
  };

  const saveRandomAttempt = async (
    question: Question,
    selectedAnswer: 'A' | 'B' | 'C' | 'D',
    attemptType: 'random_practice' | 'weak_questions' | 'subelement_practice' | 'chapter_practice' | 'topic_quiz' = 'random_practice',
    timeElapsedMs?: number
  ) => {
    if (!user) return;

    const answerToIndex: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

    const { error } = await supabase
      .from('question_attempts')
      .insert({
        user_id: user.id,
        question_id: question.id,
        selected_answer: answerToIndex[selectedAnswer],
        is_correct: selectedAnswer === question.correctAnswer,
        attempt_type: attemptType
      });

    if (error) {
      console.error('Error saving attempt:', error);
    }

    // Record event (fire-and-forget, doesn't block UI)
    recordQuestionAttempt({
      question,
      answerSelected: answerToIndex[selectedAnswer],
      timeElapsedMs: timeElapsedMs ?? 0,
      mode: attemptType,
      userId: user.id
    }).catch(err => console.error('Event recording failed:', err));

    // Track question answered event in Pendo
    if (window.pendo?.track) {
      window.pendo.track('Question Answered', {
        question_id: question.id,
        is_correct: selectedAnswer === question.correctAnswer
      });
    }

    // Track daily activity for streaks
    // Invalidate streak cache only after successful increment to avoid stale data race
    incrementDailyActivity(user.id, {
      questions: 1,
      correct: selectedAnswer === question.correctAnswer ? 1 : 0,
    }).then(success => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['daily-streak', user.id] });
      }
    }).catch(err => console.error('Daily activity tracking failed:', err));

    // Invalidate cached queries so UI updates immediately
    invalidateProgressQueries();

    // Batch readiness recalculation - only trigger after N questions
    pendingRecalcCount.current++;
    if (pendingRecalcCount.current >= RECALC_QUESTION_THRESHOLD) {
      const examType = getExamTypeFromQuestion(question);
      triggerReadinessRecalc(examType).catch((err) => {
        console.error('Failed to recalculate readiness after batch:', err);
      });
      pendingRecalcCount.current = 0;
    }
  };

  /**
   * Save multiple quiz attempts in a single bulk insert.
   * More efficient than individual saves and avoids thundering herd issues.
   */
  const saveQuizAttempts = async (
    attempts: Array<{ question: Question; selectedAnswer: 'A' | 'B' | 'C' | 'D'; timeElapsedMs?: number }>,
    attemptType: 'topic_quiz' | 'chapter_practice' = 'topic_quiz',
    topicInfo?: { topicId: string; topicSlug: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (attempts.length === 0) return { success: true };

    const answerToIndex: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

    const attemptRecords = attempts.map(({ question, selectedAnswer }) => ({
      user_id: user.id,
      question_id: question.id,
      selected_answer: answerToIndex[selectedAnswer],
      is_correct: selectedAnswer === question.correctAnswer,
      attempt_type: attemptType
    }));

    const { error } = await supabase
      .from('question_attempts')
      .insert(attemptRecords);

    if (error) {
      console.error('Error saving quiz attempts:', error);
      return { success: false, error: error.message };
    }

    // Record events for each question attempt (fire-and-forget)
    for (const attempt of attempts) {
      recordQuestionAttempt({
        question: attempt.question,
        answerSelected: answerToIndex[attempt.selectedAnswer],
        timeElapsedMs: attempt.timeElapsedMs ?? 0,
        mode: attemptType,
        userId: user.id
      }).catch(err => console.error('Event recording failed:', err));
    }

    // Record quiz completion event if topic info provided
    const correctCount = attempts.filter(a => a.selectedAnswer === a.question.correctAnswer).length;
    const percentage = Math.round((correctCount / attempts.length) * 100);
    const passed = percentage >= 80; // Topic quizzes require 80% to pass

    if (topicInfo && attemptType === 'topic_quiz') {
      recordTopicQuizCompleted({
        topicId: topicInfo.topicId,
        topicSlug: topicInfo.topicSlug,
        totalQuestions: attempts.length,
        correctCount,
        percentage,
        passed,
        userId: user.id
      }).catch(err => console.error('Event recording failed:', err));
    }

    // Track quiz completion event in Pendo
    if (window.pendo?.track) {
      window.pendo.track('Quiz Completed', {
        total_questions: attempts.length,
        correct_count: correctCount,
        percentage,
        attempt_type: attemptType
      });
    }

    // Track daily activity for streaks
    // Invalidate streak cache only after successful increment to avoid stale data race
    incrementDailyActivity(user.id, {
      questions: attempts.length,
      correct: correctCount,
    }).then(success => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['daily-streak', user.id] });
      }
    }).catch(err => console.error('Daily activity tracking failed:', err));

    // Invalidate cached queries so UI updates immediately
    invalidateProgressQueries();

    // Trigger readiness recalculation after quiz completion
    // Quiz attempts are typically 5-10 questions, so always recalculate
    if (attempts.length > 0) {
      const examType = getExamTypeFromQuestion(attempts[0].question);
      triggerReadinessRecalc(examType).catch((err) => {
        console.error('Failed to recalculate readiness after quiz:', err);
      });
      pendingRecalcCount.current = 0;
    }

    return { success: true };
  };

  return { saveTestResult, saveRandomAttempt, saveQuizAttempts, invalidateProgressQueries };
}
