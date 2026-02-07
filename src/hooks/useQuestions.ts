import { useQuery } from "@tanstack/react-query";
import { TestType } from "@/types/navigation";
import { queryKeys, unwrapOrThrow } from "@/services";
import { questionService } from "@/services/questions/questionService";

// Re-export domain types for backward compatibility
export type { Question, LinkData, QuestionTopic } from "@/services/questions/questionService";

import type { Question } from "@/services/questions/questionService";

export function useQuestions(testType?: TestType) {
  return useQuery({
    queryKey: queryKeys.questions.all(testType),
    queryFn: async () => unwrapOrThrow(await questionService.getAll(testType)),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

export function useRandomQuestion(excludeIds: string[] = []) {
  const { data: allQuestions, isLoading, error } = useQuestions();

  const getRandomQuestion = (): Question | null => {
    if (!allQuestions || allQuestions.length === 0) return null;

    const available = allQuestions.filter(q => !excludeIds.includes(q.id));
    if (available.length === 0) {
      // Reset if all questions have been asked
      return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  };

  return { getRandomQuestion, isLoading, error, allQuestions };
}

export function useQuestion(questionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.questions.detail(questionId ?? ''),
    queryFn: async () => {
      if (!questionId) throw new Error('Question ID is required');
      return unwrapOrThrow(await questionService.getById(questionId));
    },
    enabled: !!questionId,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}

/**
 * Fetch multiple questions by their UUIDs.
 * Useful for fetching bookmarked questions without loading all questions.
 */
export function useQuestionsByIds(questionIds: string[]) {
  // Sort IDs for consistent cache key regardless of bookmark order
  const sortedIds = [...questionIds].sort();
  return useQuery({
    queryKey: queryKeys.questions.byIds(sortedIds),
    queryFn: async () => unwrapOrThrow(await questionService.getByIds(questionIds)),
    enabled: questionIds.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}
