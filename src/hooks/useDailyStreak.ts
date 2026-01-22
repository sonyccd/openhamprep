import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getUTCDateString, STREAK_QUESTIONS_THRESHOLD } from '@/lib/streakConstants';

/**
 * Streak information returned by the hook.
 */
export interface StreakInfo {
  /** Current consecutive days with qualifying activity */
  currentStreak: number;
  /** All-time best streak */
  longestStreak: number;
  /** Date of last qualifying activity (YYYY-MM-DD) */
  lastActivityDate: string | null;
  /** Whether today's activity qualifies for the streak */
  todayQualifies: boolean;
  /** Number of questions answered today */
  questionsToday: number;
  /** Questions still needed to qualify today */
  questionsNeeded: number;
  /** True if user has a streak but hasn't qualified today yet */
  streakAtRisk: boolean;
}

/** Raw response from the get_streak_info RPC */
interface RawStreakInfo {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  today_qualifies: boolean;
  questions_today: number;
  questions_needed: number;
  streak_at_risk: boolean;
}

/**
 * Hook to fetch and manage daily streak information.
 * Uses the get_streak_info RPC for efficient single-query data retrieval.
 *
 * @returns Object containing streak data, loading state, and actions
 *
 * @example
 * ```tsx
 * const { currentStreak, streakAtRisk, questionsNeeded } = useDailyStreak();
 *
 * if (streakAtRisk) {
 *   console.log(`Answer ${questionsNeeded} more questions to keep your streak!`);
 * }
 * ```
 */
export function useDailyStreak() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['daily-streak', user?.id],
    queryFn: async (): Promise<StreakInfo> => {
      const { data, error } = await supabase
        .rpc('get_streak_info', { p_user_id: user!.id })
        .single();

      if (error) {
        console.error('Error fetching streak info:', error);
        throw error;
      }

      const raw = data as RawStreakInfo;
      return {
        currentStreak: raw.current_streak,
        longestStreak: raw.longest_streak,
        lastActivityDate: raw.last_activity_date,
        todayQualifies: raw.today_qualifies,
        questionsToday: raw.questions_today,
        questionsNeeded: raw.questions_needed,
        streakAtRisk: raw.streak_at_risk,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });

  /**
   * Invalidate streak queries to force a refresh.
   * Call this after recording new activity.
   */
  const invalidateStreak = () => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['daily-streak', user.id] });
    }
  };

  return {
    /** Current consecutive days with qualifying activity (default: 0) */
    currentStreak: data?.currentStreak ?? 0,
    /** All-time best streak (default: 0) */
    longestStreak: data?.longestStreak ?? 0,
    /** Date of last qualifying activity, or null if never (default: null) */
    lastActivityDate: data?.lastActivityDate ?? null,
    /** Whether today's activity qualifies for the streak (default: false) */
    todayQualifies: data?.todayQualifies ?? false,
    /** Number of questions answered today (default: 0) */
    questionsToday: data?.questionsToday ?? 0,
    /** Questions still needed to qualify today (default: threshold) */
    questionsNeeded: data?.questionsNeeded ?? STREAK_QUESTIONS_THRESHOLD,
    /** True if user has a streak but hasn't qualified today yet (default: false) */
    streakAtRisk: data?.streakAtRisk ?? false,

    /** Whether the query is currently loading */
    isLoading,
    /** Error object if the query failed */
    error,

    /** Invalidate the streak cache to trigger a refresh */
    invalidateStreak,
  };
}

/**
 * Options for incrementing daily activity.
 */
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

/**
 * Increment daily activity for the current user.
 * This is called from useProgress after saving question attempts.
 *
 * Uses the user's local date to ensure consistent timezone handling.
 *
 * @param userId - The user's UUID
 * @param options - Activity counts to increment
 * @returns true if successful, false if an error occurred
 *
 * @example
 * ```ts
 * await incrementDailyActivity(user.id, {
 *   questions: 1,
 *   correct: 1,
 * });
 * ```
 */
export async function incrementDailyActivity(
  userId: string,
  options: IncrementActivityOptions
): Promise<boolean> {
  // Use UTC date to match PostgreSQL's CURRENT_DATE on the server
  const today = getUTCDateString();

  const { error } = await supabase.rpc('increment_daily_activity', {
    p_user_id: userId,
    p_date: today,
    p_questions: options.questions ?? 0,
    p_correct: options.correct ?? 0,
    p_tests: options.tests ?? 0,
    p_tests_passed: options.testsPassed ?? 0,
    p_glossary: options.glossary ?? 0,
  });

  if (error) {
    console.error('Error incrementing daily activity:', error);
    return false;
  }

  return true;
}
