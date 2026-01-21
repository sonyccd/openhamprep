import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  todayQualifies: boolean;
  questionsToday: number;
  questionsNeeded: number;
  streakAtRisk: boolean;
}

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
    // Streak data with sensible defaults
    currentStreak: data?.currentStreak ?? 0,
    longestStreak: data?.longestStreak ?? 0,
    lastActivityDate: data?.lastActivityDate ?? null,
    todayQualifies: data?.todayQualifies ?? false,
    questionsToday: data?.questionsToday ?? 0,
    questionsNeeded: data?.questionsNeeded ?? 5,
    streakAtRisk: data?.streakAtRisk ?? false,

    // Query state
    isLoading,
    error,

    // Actions
    invalidateStreak,
  };
}

/**
 * Increment daily activity for the current user.
 * This is called from useProgress after saving question attempts.
 */
export async function incrementDailyActivity(
  userId: string,
  options: {
    questions?: number;
    correct?: number;
    tests?: number;
    testsPassed?: number;
    glossary?: number;
  }
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

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
