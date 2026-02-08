import { supabase } from '@/integrations/supabase/client';
import { ServiceBase } from '../shared/serviceBase';
import { ServiceResult, failure } from '../types';
import { TestType } from '@/types/navigation';

export interface SubelementMetric {
  accuracy: number | null;
  recent_accuracy: number | null;
  coverage: number;
  mastery: number;
  risk_score: number;
  expected_score: number;
  weight: number;
  pool_size: number;
  attempts_count: number;
  recent_attempts_count: number;
}

export interface ReadinessData {
  id: string;
  user_id: string;
  exam_type: string;
  recent_accuracy: number | null;
  overall_accuracy: number | null;
  coverage: number | null;
  mastery: number | null;
  tests_passed: number;
  tests_taken: number;
  last_study_at: string | null;
  readiness_score: number | null;
  pass_probability: number | null;
  expected_exam_score: number | null;
  subelement_metrics: Record<string, SubelementMetric>;
  total_attempts: number;
  unique_questions_seen: number;
  config_version: string | null;
  calculated_at: string;
}

class ReadinessService extends ServiceBase {
  async getScore(
    userId: string,
    examType: TestType
  ): Promise<ServiceResult<ReadinessData | null>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleQueryAllowEmpty(
      () =>
        supabase
          .from('user_readiness_cache')
          .select('*')
          .eq('user_id', userId)
          .eq('exam_type', examType)
          .maybeSingle(),
      null,
      'Failed to fetch readiness score for user'
    );
  }

  /**
   * Trigger readiness recalculation via the calculate-readiness edge function.
   *
   * The edge function returns `{ success: boolean }` in its response body.
   * `handleEdgeFunction` handles transport-level errors (network, HTTP status);
   * we then check the application-level `success` field to confirm the
   * calculation itself completed.
   */
  async recalculate(examType: TestType): Promise<ServiceResult<void>> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return failure('AUTH_REQUIRED', 'Cannot recalculate readiness: user not authenticated');
    }

    const result = await this.handleEdgeFunction(
      () =>
        supabase.functions.invoke('calculate-readiness', {
          body: { exam_type: examType },
        }),
      'Failed to recalculate readiness'
    );

    if (!result.success) return result;

    // Edge function responded OK but calculation itself may have failed
    if (result.data?.success !== true) {
      return failure('EDGE_FUNCTION_ERROR', 'Failed to recalculate readiness: calculation returned unsuccessful');
    }

    return { success: true, data: undefined };
  }
}

export const readinessService = new ReadinessService();
