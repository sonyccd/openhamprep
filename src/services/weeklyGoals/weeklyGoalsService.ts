import { supabase } from '@/integrations/supabase/client';
import { ServiceBase } from '../shared/serviceBase';
import { ServiceResult } from '../types';

export interface WeeklyGoals {
  user_id: string;
  questions_goal: number;
  tests_goal: number;
}

class WeeklyGoalsService extends ServiceBase {
  async getGoals(userId: string): Promise<ServiceResult<WeeklyGoals | null>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleQueryAllowEmpty(
      () =>
        supabase
          .from('weekly_study_goals')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
      null,
      'Failed to fetch weekly goals'
    );
  }

  async upsertGoals(
    userId: string,
    questionsGoal: number,
    testsGoal: number
  ): Promise<ServiceResult<void>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleVoidMutation(
      () =>
        supabase
          .from('weekly_study_goals')
          .upsert(
            {
              user_id: userId,
              questions_goal: questionsGoal,
              tests_goal: testsGoal,
            },
            { onConflict: 'user_id' }
          ),
      'Failed to save weekly goals'
    );
  }
}

export const weeklyGoalsService = new WeeklyGoalsService();
