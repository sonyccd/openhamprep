import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TestType } from '@/types/navigation';
import { queryKeys } from '@/services/queryKeys';

/**
 * Daily readiness snapshot for trend analysis
 */
export interface ReadinessSnapshot {
  id: string;
  user_id: string;
  exam_type: string;
  snapshot_date: string;
  readiness_score: number | null;
  pass_probability: number | null;
  recent_accuracy: number | null;
  overall_accuracy: number | null;
  coverage: number | null;
  mastery: number | null;
  tests_passed: number;
  tests_taken: number;
  questions_attempted: number;
  questions_correct: number;
}

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
    queryFn: async (): Promise<ReadinessSnapshot[]> => {
      if (!user) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_readiness_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_type', examType)
        .gte('snapshot_date', startDateStr)
        .order('snapshot_date', { ascending: true });

      if (error) {
        console.error('Error fetching readiness snapshots:', error);
        throw error;
      }

      return (data as ReadinessSnapshot[]) || [];
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
