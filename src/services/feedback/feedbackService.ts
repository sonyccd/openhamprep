import { supabase } from '@/integrations/supabase/client';
import { ServiceBase } from '../shared/serviceBase';
import { ServiceResult } from '../types';

/** Feedback record shape returned from queries */
export interface FeedbackRecord {
  question_id: string;
  is_helpful: boolean;
}

class FeedbackService extends ServiceBase {
  /**
   * Get a user's feedback for a specific question.
   * Returns null if no feedback exists (maybeSingle).
   */
  async getUserFeedback(
    questionId: string,
    userId: string
  ): Promise<ServiceResult<{ is_helpful: boolean } | null>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleQueryAllowEmpty(
      () =>
        supabase
          .from('explanation_feedback')
          .select('is_helpful')
          .eq('question_id', questionId)
          .eq('user_id', userId)
          .maybeSingle(),
      null,
      'Failed to fetch explanation feedback'
    );
  }

  /**
   * Submit or update feedback for a question (upsert).
   */
  async submitFeedback(
    questionId: string,
    userId: string,
    isHelpful: boolean
  ): Promise<ServiceResult<void>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleVoidMutation(
      () =>
        supabase
          .from('explanation_feedback')
          .upsert(
            {
              question_id: questionId,
              user_id: userId,
              is_helpful: isHelpful,
            },
            { onConflict: 'question_id,user_id' }
          ),
      'Failed to submit explanation feedback'
    );
  }

  /**
   * Remove feedback for a question.
   */
  async removeFeedback(
    questionId: string,
    userId: string
  ): Promise<ServiceResult<void>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleVoidMutation(
      () =>
        supabase
          .from('explanation_feedback')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', userId),
      'Failed to remove explanation feedback'
    );
  }

  /**
   * Get all feedback records for admin stats aggregation.
   * No auth guard here — admin access is checked at the component level.
   */
  async getAllFeedback(): Promise<ServiceResult<FeedbackRecord[]>> {
    return this.handleQueryAllowEmpty(
      () =>
        supabase
          .from('explanation_feedback')
          .select('question_id, is_helpful'),
      [],
      'Failed to fetch all explanation feedback'
    );
  }
}

export const feedbackService = new FeedbackService();
