import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { TestType } from '@/types/navigation';
import { queryKeys } from '@/services/queryKeys';
import { readinessService, type ReadinessSnapshot } from '@/services/readiness/readinessService';
import { unwrapOrThrow } from '@/services/types';

// Re-export type from the service layer
export type { ReadinessSnapshot } from '@/services/readiness/readinessService';

interface UseReadinessSnapshotsOptions {
  examType: TestType;
  /** Number of days of history to fetch (default: 30) */
  days?: number;
}

/**
 * Hook to fetch readiness snapshots for trend charts.
 * Returns daily snapshots sorted by date (oldest first for charting).
 */
export function useReadinessSnapshots({
  examType,
  days = 30,
}: UseReadinessSnapshotsOptions) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.readiness.snapshots(user?.id ?? '', examType, days),
    queryFn: async () => {
      if (!user) return [];
      return unwrapOrThrow(await readinessService.getSnapshots(user.id, examType, days));
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute - allow refetch after test completion
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for background updates
  });
}

/**
 * Calculate trend direction from snapshots
 */
export function calculateTrend(
  snapshots: ReadinessSnapshot[]
): 'improving' | 'stable' | 'declining' | 'unknown' {
  if (snapshots.length < 2) return 'unknown';

  // Compare last 7 days average to previous 7 days average
  const recentSnapshots = snapshots.slice(-7);
  const previousSnapshots = snapshots.slice(-14, -7);

  if (previousSnapshots.length === 0) return 'unknown';

  const recentAvg =
    recentSnapshots.reduce((sum, s) => sum + (s.readiness_score || 0), 0) /
    recentSnapshots.length;

  const previousAvg =
    previousSnapshots.reduce((sum, s) => sum + (s.readiness_score || 0), 0) /
    previousSnapshots.length;

  const delta = recentAvg - previousAvg;

  if (delta > 3) return 'improving';
  if (delta < -3) return 'declining';
  return 'stable';
}
