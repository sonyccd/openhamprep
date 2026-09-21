import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/services/queryKeys";

export interface LinkableQuestion {
  id: string;
  display_name: string;
  question: string;
}

const PAGE_SIZE = 1000;

/**
 * Every question in the bank, paged past PostgREST's row cap. The admin
 * picker filters client-side, so it needs them all.
 */
export function useAllQuestionsForLinking() {
  return useQuery({
    queryKey: queryKeys.questions.forLinking(),
    queryFn: async () => {
      const all: LinkableQuestion[] = [];
      for (let page = 0; ; page++) {
        const from = page * PAGE_SIZE;
        const { data, error } = await supabase
          .from("questions")
          .select("id, display_name, question")
          .order("display_name", { ascending: true })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        all.push(...((data ?? []) as LinkableQuestion[]));
        if (!data || data.length < PAGE_SIZE) return all;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** The ids of the questions linked to one topic. */
export function useTopicLinkedQuestionIds(topicId: string) {
  return useQuery({
    queryKey: queryKeys.topics.linkedQuestionIds(topicId),
    queryFn: async () => {
      const { data, error } = await supabase.from("topic_questions").select("question_id").eq("topic_id", topicId);
      if (error) throw error;
      return data.map((d) => d.question_id);
    },
  });
}

/** Link and unlink one question at a time, refreshing everything that lists the topic's questions. */
export function useTopicQuestionLinkMutations(topicId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.topics.linkedQuestionIds(topicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.topics.questions(topicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.questions.admin() });
  };

  const linkQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase.from("topic_questions").insert({ topic_id: topicId, question_id: questionId });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Question linked");
    },
    onError: (error) => toast.error("Failed to link question: " + error.message),
  });

  const unlinkQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase.from("topic_questions").delete().eq("topic_id", topicId).eq("question_id", questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Question unlinked");
    },
    onError: (error) => toast.error("Failed to unlink question: " + error.message),
  });

  return { linkQuestion, unlinkQuestion };
}
