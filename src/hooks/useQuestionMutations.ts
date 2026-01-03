import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { EditHistoryEntry } from '@/components/admin/EditHistoryViewer';
import type { Question, LinkData } from '@/components/admin/questions/types';

type NewQuestionData = Omit<Question, 'edit_history'> & {
  links: LinkData[];
  explanation?: string;
  figure_url?: string | null;
};

interface UpdateQuestionParams {
  question: Question & {
    explanation?: string | null;
    figure_url?: string | null;
    forum_url?: string | null;
    arrl_chapter_id?: string | null;
    arrl_page_reference?: string | null;
  };
  originalQuestion: Question;
}

export function useQuestionMutations(testType: 'technician' | 'general' | 'extra') {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-questions-full'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats-questions'] });
    queryClient.invalidateQueries({ queryKey: ['questions'] });
    queryClient.invalidateQueries({ queryKey: ['admin-questions', testType] });
  };

  const addQuestion = useMutation({
    mutationFn: async (question: NewQuestionData) => {
      const historyEntry: EditHistoryEntry = {
        user_id: user?.id || '',
        user_email: user?.email || 'Unknown',
        action: 'created',
        changes: {},
        timestamp: new Date().toISOString(),
      };

      const displayName = question.display_name.trim().toUpperCase();
      const { error } = await supabase.from('questions').insert({
        display_name: displayName,
        question: question.question.trim(),
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation?.trim() || null,
        links: [],
        edit_history: JSON.parse(JSON.stringify([historyEntry])),
        figure_url: question.figure_url || null,
      });
      if (error) throw error;

      // Extract links from explanation and unfurl them
      if (question.explanation?.trim()) {
        try {
          await supabase.functions.invoke('manage-question-links', {
            body: {
              action: 'extract-from-explanation',
              questionId: displayName,
            },
          });
        } catch (linkError) {
          console.warn('Failed to extract links from explanation:', linkError);
        }
      }
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success('Question added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add question: ' + error.message);
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async ({ question, originalQuestion }: UpdateQuestionParams) => {
      // Build changes object
      const changes: Record<string, { from: unknown; to: unknown }> = {};
      if (originalQuestion.question !== question.question.trim()) {
        changes.question = { from: originalQuestion.question, to: question.question.trim() };
      }
      if (JSON.stringify(originalQuestion.options) !== JSON.stringify(question.options)) {
        changes.options = { from: originalQuestion.options, to: question.options };
      }
      if (originalQuestion.correct_answer !== question.correct_answer) {
        changes.correct_answer = {
          from: originalQuestion.correct_answer,
          to: question.correct_answer,
        };
      }
      if (
        (originalQuestion.explanation || '') !== (question.explanation?.trim() || '')
      ) {
        changes.explanation = {
          from: originalQuestion.explanation || '',
          to: question.explanation?.trim() || '',
        };
      }
      if ((originalQuestion.figure_url || '') !== (question.figure_url || '')) {
        changes.figure_url = {
          from: originalQuestion.figure_url || '',
          to: question.figure_url || '',
        };
      }
      if ((originalQuestion.forum_url || '') !== (question.forum_url || '')) {
        changes.forum_url = {
          from: originalQuestion.forum_url || '',
          to: question.forum_url || '',
        };
      }
      if ((originalQuestion.arrl_chapter_id || '') !== (question.arrl_chapter_id || '')) {
        changes.arrl_chapter_id = {
          from: originalQuestion.arrl_chapter_id || '',
          to: question.arrl_chapter_id || '',
        };
      }
      if ((originalQuestion.arrl_page_reference || '') !== (question.arrl_page_reference || '')) {
        changes.arrl_page_reference = {
          from: originalQuestion.arrl_page_reference || '',
          to: question.arrl_page_reference || '',
        };
      }

      const historyEntry: EditHistoryEntry = {
        user_id: user?.id || '',
        user_email: user?.email || 'Unknown',
        action: 'updated',
        changes,
        timestamp: new Date().toISOString(),
      };

      const existingHistory = originalQuestion.edit_history || [];

      const { error } = await supabase
        .from('questions')
        .update({
          question: question.question.trim(),
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation?.trim() || null,
          figure_url: question.figure_url || null,
          forum_url: question.forum_url || null,
          arrl_chapter_id: question.arrl_chapter_id || null,
          arrl_page_reference: question.arrl_page_reference || null,
          edit_history: JSON.parse(JSON.stringify([...existingHistory, historyEntry])),
        })
        .eq('id', question.id);
      if (error) throw error;

      // If explanation changed and question has forum_url, sync to Discourse
      const explanationChanged =
        (originalQuestion.explanation || '') !== (question.explanation?.trim() || '');
      const effectiveForumUrl = question.forum_url || originalQuestion.forum_url;
      if (explanationChanged && effectiveForumUrl) {
        try {
          await supabase
            .from('questions')
            .update({
              discourse_sync_status: 'pending',
              discourse_sync_at: new Date().toISOString(),
            })
            .eq('id', question.id);

          const response = await supabase.functions.invoke('update-discourse-post', {
            body: {
              questionId: question.id,
              explanation: question.explanation?.trim() || '',
            },
          });

          if (response.error) {
            console.error('Discourse sync failed:', response.error);
            const errorMessage = response.error.message || 'Sync failed';
            await supabase
              .from('questions')
              .update({
                discourse_sync_status: 'error',
                discourse_sync_at: new Date().toISOString(),
                discourse_sync_error: errorMessage,
              })
              .eq('id', question.id);
          }
        } catch (syncError) {
          console.error('Failed to sync to Discourse:', syncError);
          const errorMessage =
            syncError instanceof Error ? syncError.message : 'Sync failed';
          await supabase
            .from('questions')
            .update({
              discourse_sync_status: 'error',
              discourse_sync_at: new Date().toISOString(),
              discourse_sync_error: errorMessage,
            })
            .eq('id', question.id);
        }
      }

      // Extract links from explanation and unfurl them
      if (explanationChanged || !originalQuestion.explanation) {
        try {
          await supabase.functions.invoke('manage-question-links', {
            body: {
              action: 'extract-from-explanation',
              questionId: question.id,
            },
          });
        } catch (linkError) {
          console.warn('Failed to extract links from explanation:', linkError);
        }
      }
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success('Question updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update question: ' + error.message);
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success('Question deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete question: ' + error.message);
    },
  });

  const retrySync = async (question: Question) => {
    if (!question.forum_url) {
      toast.error('Question has no Discourse topic');
      return;
    }

    try {
      await supabase
        .from('questions')
        .update({
          discourse_sync_status: 'pending',
          discourse_sync_at: new Date().toISOString(),
        })
        .eq('id', question.id);

      invalidateQueries();

      const response = await supabase.functions.invoke('update-discourse-post', {
        body: {
          questionId: question.display_name,
          explanation: question.explanation || '',
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast.success('Synced to Discourse successfully');
      invalidateQueries();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Sync failed: ' + errorMessage);

      await supabase
        .from('questions')
        .update({
          discourse_sync_status: 'error',
          discourse_sync_at: new Date().toISOString(),
          discourse_sync_error: errorMessage,
        })
        .eq('id', question.id);

      invalidateQueries();
    }
  };

  return {
    addQuestion,
    updateQuestion,
    deleteQuestion,
    retrySync,
  };
}
