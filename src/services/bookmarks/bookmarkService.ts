import { supabase } from '@/integrations/supabase/client';
import { ServiceBase } from '../shared/serviceBase';
import { ServiceResult } from '../types';

export interface BookmarkRow {
  id: string;
  user_id: string;
  question_id: string;
  note: string | null;
  created_at: string;
  display_name?: string;
}

class BookmarkService extends ServiceBase {
  async getAll(userId: string): Promise<ServiceResult<BookmarkRow[]>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleQueryAllowEmpty(
      async () => {
        const { data, error } = await supabase
          .from('bookmarked_questions')
          .select('*, questions!inner(display_name)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        // Flatten the joined display_name from the !inner join to the top level
        const flattened = data?.map(bookmark => ({
          ...bookmark,
          display_name: bookmark.questions?.display_name ?? 'Unknown',
        })) ?? null;

        return { data: flattened, error };
      },
      [],
      'Failed to fetch bookmarks'
    );
  }

  async add(
    userId: string,
    questionId: string,
    note?: string
  ): Promise<ServiceResult<BookmarkRow>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleMutation(
      () =>
        supabase
          .from('bookmarked_questions')
          .insert({
            user_id: userId,
            question_id: questionId,
            note: note || null,
          })
          .select()
          .single(),
      'Failed to add bookmark'
    );
  }

  async remove(userId: string, questionId: string): Promise<ServiceResult<void>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleVoidMutation(
      () =>
        supabase
          .from('bookmarked_questions')
          .delete()
          .eq('user_id', userId)
          .eq('question_id', questionId),
      'Failed to remove bookmark'
    );
  }

  async updateNote(
    userId: string,
    questionId: string,
    note: string
  ): Promise<ServiceResult<void>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleVoidMutation(
      () =>
        supabase
          .from('bookmarked_questions')
          .update({ note })
          .eq('user_id', userId)
          .eq('question_id', questionId),
      'Failed to update bookmark note'
    );
  }
}

export const bookmarkService = new BookmarkService();
