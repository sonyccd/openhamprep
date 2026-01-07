import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Question } from '@/hooks/useQuestions';
import { TestType, testConfig } from '@/types/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateProgressQueries = useCallback(() => {
    if (!user) return;

    // Invalidate all queries that depend on user progress data
    queryClient.invalidateQueries({ queryKey: ['test-results', user.id] });
    queryClient.invalidateQueries({ queryKey: ['question-attempts', user.id] });
    queryClient.invalidateQueries({ queryKey: ['profile-stats', user.id] });
    queryClient.invalidateQueries({ queryKey: ['weekly-goals', user.id] });
  }, [queryClient, user]);

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
  };

  return { saveTestResult, saveRandomAttempt, invalidateProgressQueries };
}
