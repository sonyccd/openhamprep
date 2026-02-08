import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getUTCDateString,
  calculateLocalDayQuestions,
  checkLocalDayQualifies,
  getStreakResetTimeLocal,
  STREAK_QUESTIONS_THRESHOLD,
} from '@/lib/streakConstants';
import { queryKeys } from '@/services/queryKeys';
import { streakService, type IncrementActivityOptions } from '@/services/streak/streakService';
import { unwrapOrThrow } from '@/services/types';

// Re-export types from the service layer
export type { IncrementActivityOptions } from '@/services/streak/streakService';

/**
 * Streak information returned by the hook.
 * Values are computed for the user's LOCAL day, not UTC.
 */
export interface StreakInfo {
  /** Current consecutive days with qualifying activity */
  currentStreak: number;
  /** All-time best streak */
  longestStreak: number;
  /** Date of last qualifying activity (YYYY-MM-DD in UTC) */
  lastActivityDate: string | null;
  /** Whether today (local) has qualifying activity */
  todayQualifies: boolean;
  /** Number of questions answered today (local) */
  questionsToday: number;
  /** Questions still needed to qualify today (local) */
  questionsNeeded: number;
  /** True if user has a streak but hasn't qualified today (local) yet */
  streakAtRisk: boolean;
  /** Human-readable time when streak day resets (e.g., "4:00 PM") */
  streakResetTime: string;
}

/**
 * Hook to fetch and manage daily streak information.
 * Uses the get_streak_info RPC for efficient single-query data retrieval.
 *
 * Data is stored in UTC but computed values are adjusted to the user's
 * local timezone for display.
 *
 * @returns Object containing streak data, loading state, and actions
 *
 * @example
 * ```tsx
 * const { currentStreak, streakAtRisk, questionsNeeded, streakResetTime } = useDailyStreak();
 *
 * if (streakAtRisk) {
 *   console.log(`Answer ${questionsNeeded} more questions to keep your streak!`);
 *   console.log(`Streak day resets at ${streakResetTime}`);
 * }
 * ```
 */
export function useDailyStreak() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.progress.streak(user?.id ?? ''),
    queryFn: async (): Promise<StreakInfo> => {
      const raw = unwrapOrThrow(await streakService.getStreakInfo(user!.id));

      // Compute local day values from UTC data
      const questionsToday = calculateLocalDayQuestions(
        raw.today_utc,
        raw.questions_today,
        raw.questions_yesterday
      );

      const todayQualifies = checkLocalDayQualifies(
        raw.today_utc,
        raw.today_qualifies,
        raw.yesterday_qualifies
      );

      const questionsNeeded = Math.max(0, STREAK_QUESTIONS_THRESHOLD - questionsToday);

      // Streak is at risk if user has an active streak but hasn't qualified locally today
      const streakAtRisk = raw.current_streak > 0 && !todayQualifies;

      return {
        currentStreak: raw.current_streak,
        longestStreak: raw.longest_streak,
        lastActivityDate: raw.last_activity_date,
        todayQualifies,
        questionsToday,
        questionsNeeded,
        streakAtRisk,
        streakResetTime: getStreakResetTimeLocal(),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.streak(user.id) });
    }
  };

  return {
    /** Current consecutive days with qualifying activity (default: 0) */
    currentStreak: data?.currentStreak ?? 0,
    /** All-time best streak (default: 0) */
    longestStreak: data?.longestStreak ?? 0,
    /** Date of last qualifying activity, or null if never (default: null) */
    lastActivityDate: data?.lastActivityDate ?? null,
    /** Whether today (local) has qualifying activity (default: false) */
    todayQualifies: data?.todayQualifies ?? false,
    /** Number of questions answered today in local time (default: 0) */
    questionsToday: data?.questionsToday ?? 0,
    /** Questions still needed to qualify today in local time (default: threshold) */
    questionsNeeded: data?.questionsNeeded ?? STREAK_QUESTIONS_THRESHOLD,
    /** True if user has a streak but hasn't qualified today (local) yet (default: false) */
    streakAtRisk: data?.streakAtRisk ?? false,
    /** Human-readable time when streak day resets (e.g., "4:00 PM") */
    streakResetTime: data?.streakResetTime ?? getStreakResetTimeLocal(),

    /** Whether the query is currently loading */
    isLoading,
    /** Error object if the query failed */
    error,

    /** Invalidate the streak cache to trigger a refresh */
    invalidateStreak,
  };
}

/**
 * Increment daily activity for the current user.
 * This is called from useProgress after saving question attempts.
 *
 * Uses UTC date to ensure consistent storage in the database.
 * Frontend handles conversion to local timezone for display.
 *
 * @param userId - The user's UUID
 * @param options - Activity counts to increment
 * @returns true if successful, false if an error occurred
 *
 * @example
 * ```ts
 * import { IncrementActivityOptions } from '@/hooks/useDailyStreak';
 *
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
  const today = getUTCDateString();
  const result = await streakService.incrementActivity(userId, today, options);

  if (!result.success) {
    console.error('Error incrementing daily activity:', result.error.message);
    return false;
  }

  return true;
}
