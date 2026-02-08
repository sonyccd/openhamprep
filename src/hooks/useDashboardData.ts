import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/services/queryKeys';
import { unwrapOrThrow } from '@/services/types';
import { dashboardDataService } from '@/services/dashboard/dashboardDataService';
import { weeklyGoalsService } from '@/services/weeklyGoals/weeklyGoalsService';
import type { TestType } from '@/types/navigation';

/**
 * Fetch test results for the current user, filtered by test type.
 * Includes backward-compatible handling of legacy 'practice' test_type.
 */
export function useTestResults(selectedTest: TestType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.progress.testResults(user?.id ?? '', selectedTest),
    queryFn: async () => {
      // Include legacy 'practice' type for backward compatibility
      const testTypesToMatch = selectedTest === 'technician'
        ? ['practice', 'technician']
        : [selectedTest];

      return unwrapOrThrow(
        await dashboardDataService.getTestResults(user!.id, testTypesToMatch)
      );
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch all question attempts with joined display_name for the current user.
 * Used by both Dashboard and AppLayout for weak question calculation.
 */
export function useQuestionAttemptsWithNames() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.progress.attempts(user?.id ?? ''),
    queryFn: async () =>
      unwrapOrThrow(
        await dashboardDataService.getAttemptsWithDisplayName(user!.id)
      ),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch profile stats (best_streak) for the current user.
 */
export function useProfileStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.progress.profileStats(user?.id ?? ''),
    queryFn: async () =>
      unwrapOrThrow(
        await dashboardDataService.getProfileStats(user!.id)
      ),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch the full profile for the current user.
 */
export function useFullProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.profile.byUser(user?.id ?? ''),
    queryFn: async () =>
      unwrapOrThrow(
        await dashboardDataService.getFullProfile(user!.id)
      ),
    enabled: !!user,
  });
}

/**
 * Fetch weekly study goals for the current user.
 */
export function useWeeklyGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.progress.weeklyGoals(user?.id ?? ''),
    queryFn: async () =>
      unwrapOrThrow(
        await weeklyGoalsService.getGoals(user!.id)
      ),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
