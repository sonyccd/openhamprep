import { supabase } from '@/integrations/supabase/client';
import { ServiceBase } from '../shared/serviceBase';
import { ServiceResult, success } from '../types';

/** Row returned from practice_test_results after insert */
export interface TestResultRow {
  id: string;
  user_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  test_type: string;
  created_at: string;
}

/** Input shape for a single question_attempts insert */
export interface AttemptRecord {
  user_id: string;
  question_id: string;
  selected_answer: number;
  is_correct: boolean;
  attempt_type: string;
  test_result_id?: string;
}

class ProgressService extends ServiceBase {
  /**
   * Insert a practice test result and return the created row.
   * The returned row includes the generated `id` needed to link question_attempts.
   */
  async createTestResult(params: {
    userId: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    testType: string;
  }): Promise<ServiceResult<TestResultRow>> {
    const userCheck = this.requireUserId(params.userId);
    if (!userCheck.success) return userCheck;

    return this.handleMutation(
      () =>
        supabase
          .from('practice_test_results')
          .insert({
            user_id: params.userId,
            score: params.score,
            total_questions: params.totalQuestions,
            percentage: params.percentage,
            passed: params.passed,
            test_type: params.testType,
          })
          .select()
          .single(),
      'Failed to save test result'
    );
  }

  /**
   * Bulk insert question attempts.
   * Early-returns success for an empty array (no-op).
   */
  async createAttempts(
    records: AttemptRecord[]
  ): Promise<ServiceResult<void>> {
    if (records.length === 0) {
      return success(undefined);
    }

    return this.handleVoidMutation(
      () =>
        supabase
          .from('question_attempts')
          .insert(records),
      'Failed to save question attempts'
    );
  }
}

export const progressService = new ProgressService();
