import { supabase } from '@/integrations/supabase/client';
import { ServiceBase } from '../shared/serviceBase';
import { ServiceResult } from '../types';

export interface AttemptWithDisplayName {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  attempt_type: string;
  attempted_at: string;
  display_name: string;
  [key: string]: unknown;
}

export interface ProfileStats {
  best_streak: number;
}

export interface FullProfile {
  id: string;
  display_name: string | null;
  forum_username: string | null;
  best_streak: number;
  [key: string]: unknown;
}

class DashboardDataService extends ServiceBase {
  async getTestResults(
    userId: string,
    testTypes: string[]
  ): Promise<ServiceResult<unknown[]>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleQueryAllowEmpty(
      () =>
        supabase
          .from('practice_test_results')
          .select('*')
          .eq('user_id', userId)
          .in('test_type', testTypes)
          .order('completed_at', { ascending: false }),
      [],
      'Failed to fetch test results'
    );
  }

  async getAttemptsWithDisplayName(
    userId: string
  ): Promise<ServiceResult<AttemptWithDisplayName[]>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleQueryAllowEmpty(
      async () => {
        const { data, error } = await supabase
          .from('question_attempts')
          .select('*, questions!inner(display_name)')
          .eq('user_id', userId);

        // Flatten the joined display_name to the top level
        const flattened = data?.map(attempt => ({
          ...attempt,
          display_name: attempt.questions?.display_name,
        })) ?? [];

        return { data: flattened, error };
      },
      [],
      'Failed to fetch question attempts'
    );
  }

  async getProfileStats(
    userId: string
  ): Promise<ServiceResult<ProfileStats | null>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleQueryAllowEmpty(
      () =>
        supabase
          .from('profiles')
          .select('best_streak')
          .eq('id', userId)
          .maybeSingle(),
      null,
      'Failed to fetch profile stats'
    );
  }

  async getFullProfile(userId: string): Promise<ServiceResult<FullProfile>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleQuery(
      () =>
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
      'Failed to fetch profile'
    );
  }
}

export const dashboardDataService = new DashboardDataService();
