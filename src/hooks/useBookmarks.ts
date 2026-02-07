import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { trackBookmarkAdded, trackBookmarkRemoved } from '@/lib/amplitude';
import { queryKeys, unwrapOrThrow } from '@/services';
import { bookmarkService } from '@/services/bookmarks/bookmarkService';

export function useBookmarks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: queryKeys.bookmarks.all(user?.id ?? ''),
    queryFn: async () => unwrapOrThrow(await bookmarkService.getAll(user!.id)),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });

  const addBookmark = useMutation({
    mutationFn: async ({ questionId, note }: { questionId: string; note?: string }) => {
      if (!user) throw new Error('Not authenticated');
      return unwrapOrThrow(await bookmarkService.add(user.id, questionId, note));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all(user?.id ?? '') });
      toast.success('Question bookmarked!');
      trackBookmarkAdded(variables.questionId);
    },
    onError: (error) => {
      toast.error('Failed to bookmark question');
      console.error('Failed to add bookmark:', error);
    },
  });

  const removeBookmark = useMutation({
    mutationFn: async (questionId: string) => {
      if (!user) throw new Error('Not authenticated');
      return unwrapOrThrow(await bookmarkService.remove(user.id, questionId));
    },
    onSuccess: (_data, questionId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all(user?.id ?? '') });
      toast.success('Bookmark removed');
      trackBookmarkRemoved(questionId);
    },
    onError: (error) => {
      toast.error('Failed to remove bookmark');
      console.error('Failed to remove bookmark:', error);
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ questionId, note }: { questionId: string; note: string }) => {
      if (!user) throw new Error('Not authenticated');
      return unwrapOrThrow(await bookmarkService.updateNote(user.id, questionId, note));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all(user?.id ?? '') });
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
