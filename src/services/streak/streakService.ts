import { supabase } from '@/integrations/supabase/client';
import { ServiceBase } from '../shared/serviceBase';
import { ServiceResult } from '../types';

/** Raw response from the get_streak_info RPC (snake_case) */
export interface RawStreakInfo {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  today_qualifies: boolean;
  questions_today: number;
  questions_needed: number;
  streak_at_risk: boolean;
  yesterday_qualifies: boolean;
  questions_yesterday: number;
  today_utc: string;
}

/** Options for incrementing daily activity */
export interface IncrementActivityOptions {
  /** Number of questions answered */
  questions?: number;
  /** Number of correct answers */
  correct?: number;
  /** Number of tests completed */
  tests?: number;
  /** Number of tests passed */
  testsPassed?: number;
  /** Number of glossary terms studied */
  glossary?: number;
}

class StreakService extends ServiceBase {
  /**
   * Fetch streak info for a user via the get_streak_info RPC.
   * Returns raw snake_case data; the hook handles timezone conversion.
   */
  async getStreakInfo(userId: string): Promise<ServiceResult<RawStreakInfo>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleQuery(
      () =>
        supabase
          .rpc('get_streak_info', { p_user_id: userId })
          .single(),
      'Failed to fetch streak info'
    );
  }

  /**
   * Increment daily activity counters for a user.
   * The date parameter should come from getUTCDateString() in the caller.
   */
  async incrementActivity(
    userId: string,
    date: string,
    options: IncrementActivityOptions
  ): Promise<ServiceResult<void>> {
    const userCheck = this.requireUserId(userId);
    if (!userCheck.success) return userCheck;

    return this.handleVoidMutation(
      () =>
        supabase.rpc('increment_daily_activity', {
          p_user_id: userId,
          p_date: date,
          p_questions: options.questions ?? 0,
          p_correct: options.correct ?? 0,
          p_tests: options.tests ?? 0,
          p_tests_passed: options.testsPassed ?? 0,
          p_glossary: options.glossary ?? 0,
        }),
      'Failed to increment daily activity'
    );
  }
}

export const streakService = new StreakService();
