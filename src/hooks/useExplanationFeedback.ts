import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/services/queryKeys";
import { feedbackService } from "@/services/feedback/feedbackService";
import { unwrapOrThrow } from "@/services/types";

interface Feedback {
  question_id: string;
  is_helpful: boolean;
}

export function useExplanationFeedback(questionId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's feedback for a specific question
  const { data: userFeedback } = useQuery({
    queryKey: queryKeys.feedback.forQuestion(questionId ?? '', user?.id ?? ''),
    queryFn: async () => {
      if (!questionId || !user) return null;
      return unwrapOrThrow(await feedbackService.getUserFeedback(questionId, user.id));
    },
    enabled: !!questionId && !!user,
  });

  const submitFeedback = useMutation({
    mutationFn: async ({ question_id, is_helpful }: Feedback) => {
      if (!user) throw new Error("Must be logged in");
      unwrapOrThrow(await feedbackService.submitFeedback(question_id, user.id, is_helpful));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.forQuestion(variables.question_id, user?.id ?? '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.adminStats() });
    },
  });

  const removeFeedback = useMutation({
    mutationFn: async (question_id: string) => {
      if (!user) throw new Error("Must be logged in");
      unwrapOrThrow(await feedbackService.removeFeedback(question_id, user.id));
    },
    onSuccess: (_, question_id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.forQuestion(question_id, user?.id ?? '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.adminStats() });
    },
  });

  return {
    userFeedback,
    submitFeedback,
    removeFeedback,
  };
}

// Hook for admins to get feedback stats
export function useExplanationFeedbackStats() {
  return useQuery({
    queryKey: queryKeys.feedback.adminStats(),
    queryFn: async () => {
      const data = unwrapOrThrow(await feedbackService.getAllFeedback());

      // Aggregate feedback by question
      const stats: Record<string, { helpful: number; notHelpful: number }> = {};

      data.forEach((feedback) => {
        if (!stats[feedback.question_id]) {
          stats[feedback.question_id] = { helpful: 0, notHelpful: 0 };
        }
        if (feedback.is_helpful) {
          stats[feedback.question_id].helpful++;
        } else {
          stats[feedback.question_id].notHelpful++;
        }
      });

      return stats;
    },
  });
}
