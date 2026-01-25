import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/services/queryKeys";

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
      
      const { data, error } = await supabase
        .from('explanation_feedback')
        .select('is_helpful')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!questionId && !!user,
  });

  const submitFeedback = useMutation({
    mutationFn: async ({ question_id, is_helpful }: Feedback) => {
      if (!user) throw new Error("Must be logged in");

      // Upsert the feedback
      const { error } = await supabase
        .from('explanation_feedback')
        .upsert({
          question_id,
          user_id: user.id,
          is_helpful,
        }, {
          onConflict: 'question_id,user_id'
        });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.forQuestion(variables.question_id, user?.id ?? '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.adminStats() });
    },
  });

  const removeFeedback = useMutation({
    mutationFn: async (question_id: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from('explanation_feedback')
        .delete()
        .eq('question_id', question_id)
        .eq('user_id', user.id);
      
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('explanation_feedback')
        .select('question_id, is_helpful');
      
      if (error) throw error;
      
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
