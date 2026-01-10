import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Question } from '@/hooks/useQuestions';
import { TestType, testConfig } from '@/types/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { recalculateReadiness } from '@/hooks/useReadinessScore';

/** Number of questions to batch before triggering a readiness recalculation */
const RECALC_QUESTION_THRESHOLD = 10;

/**
 * Determine the exam type from a question's display_name or id
 */
function getExamTypeFromQuestion(question: Question): TestType {
  // Question display_name starts with T (Technician), G (General), or E (Extra)
  const displayName = question.displayName || question.id;
  const prefix = displayName.charAt(0).toUpperCase();
  if (prefix === 'G') return 'general';
  if (prefix === 'E') return 'extra';
  return 'technician';
}

export function useProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Track pending question attempts for batched readiness recalculation
  const pendingRecalcCount = useRef(0);

  const invalidateProgressQueries = useCallback(() => {
    if (!user) return;

    // Invalidate all queries that depend on user progress data
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
   * Trigger readiness recalculation and invalidate cache
   */
  const triggerReadinessRecalc = useCallback(async (testType: TestType) => {
    const success = await recalculateReadiness(testType);
    if (success) {
      invalidateReadinessQueries();
    }
    return success;
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
    attemptType: 'random_practice' | 'weak_questions' | 'subelement_practice' | 'chapter_practice' | 'topic_quiz' = 'random_practice'
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

    // Track question answered event in Pendo
    if (window.pendo?.track) {
      window.pendo.track('Question Answered', {
        question_id: question.id,
        is_correct: selectedAnswer === question.correctAnswer
      });
    }

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
    attempts: Array<{ question: Question; selectedAnswer: 'A' | 'B' | 'C' | 'D' }>,
    attemptType: 'topic_quiz' | 'chapter_practice' = 'topic_quiz'
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

    // Track quiz completion event in Pendo
    if (window.pendo?.track) {
      const correctCount = attempts.filter(a => a.selectedAnswer === a.question.correctAnswer).length;
      window.pendo.track('Quiz Completed', {
        total_questions: attempts.length,
        correct_count: correctCount,
        percentage: Math.round((correctCount / attempts.length) * 100),
        attempt_type: attemptType
      });
    }

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
