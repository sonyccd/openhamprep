import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { TestType } from '@/types/navigation';
import { queryKeys, unwrapOrThrow } from '@/services';
import { readinessService } from '@/services/readiness/readinessService';

// Re-export domain types for backward compatibility
export type { ReadinessData, SubelementMetric } from '@/services/readiness/readinessService';

/**
 * Hook to fetch the cached readiness score for a user.
 * This only reads from the database - calculations are done by the edge function.
 */
export function useReadinessScore(examType: TestType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.readiness.score(user?.id ?? '', examType),
    queryFn: async () => unwrapOrThrow(await readinessService.getScore(user!.id, examType)),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds - allow more frequent refetches after invalidation
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for background updates
  });
}

/**
 * Trigger a readiness recalculation via the edge function.
 * Call this after tests or batched question attempts.
 */
export async function recalculateReadiness(examType: TestType): Promise<boolean> {
  const result = await readinessService.recalculate(examType);
  if (!result.success) {
    console.error('Failed to recalculate readiness:', result.error.message);
    return false;
  }
  return true;
}
