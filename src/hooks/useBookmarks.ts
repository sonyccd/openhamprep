import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useBookmarks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookmarked_questions')
        .select('*, questions!inner(display_name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Flatten the joined data to include display_name at the top level
      return data?.map(bookmark => ({
        ...bookmark,
        display_name: bookmark.questions?.display_name
      })) || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });

  const addBookmark = useMutation({
    mutationFn: async ({ questionId, note }: { questionId: string; note?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('bookmarked_questions')
        .insert({
          user_id: user.id,
          question_id: questionId,
          note: note || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', user?.id] });
      toast.success('Question bookmarked!');
    },
    onError: (error) => {
      toast.error('Failed to bookmark question');
      console.error('Failed to add bookmark:', error);
    },
  });

  const removeBookmark = useMutation({
    mutationFn: async (questionId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('bookmarked_questions')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId);
      
      if (error) throw error;
      return questionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', user?.id] });
      toast.success('Bookmark removed');
    },
    onError: (error) => {
      toast.error('Failed to remove bookmark');
      console.error('Failed to remove bookmark:', error);
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ questionId, note }: { questionId: string; note: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('bookmarked_questions')
        .update({ note })
        .eq('user_id', user.id)
        .eq('question_id', questionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', user?.id] });
      toast.success('Note updated');
    },
    onError: (error) => {
      toast.error('Failed to update note');
      console.error('Failed to update bookmark note:', error);
    },
  });

  const isBookmarked = (questionId: string) => {
    return bookmarks?.some(b => b.question_id === questionId) ?? false;
  };

  const getBookmarkNote = (questionId: string) => {
    return bookmarks?.find(b => b.question_id === questionId)?.note ?? null;
  };

  return {
    bookmarks,
    isLoading,
    addBookmark,
    removeBookmark,
    updateNote,
    isBookmarked,
    getBookmarkNote,
  };
}
