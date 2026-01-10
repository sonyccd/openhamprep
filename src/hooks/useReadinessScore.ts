import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TestType } from '@/types/navigation';

/**
 * Subelement metrics from the readiness calculation
 */
export interface SubelementMetric {
  accuracy: number | null;
  recent_accuracy: number | null;
  coverage: number;
  mastery: number;
  risk_score: number;
  expected_score: number;
  weight: number;
  pool_size: number;
  attempts_count: number;
  recent_attempts_count: number;
}

/**
 * Readiness cache data from the database
 */
export interface ReadinessData {
  id: string;
  user_id: string;
  exam_type: string;
  recent_accuracy: number | null;
  overall_accuracy: number | null;
  coverage: number | null;
  mastery: number | null;
  tests_passed: number;
  tests_taken: number;
  last_study_at: string | null;
  readiness_score: number | null;
  pass_probability: number | null;
  expected_exam_score: number | null;
  subelement_metrics: Record<string, SubelementMetric>;
  total_attempts: number;
  unique_questions_seen: number;
  config_version: string | null;
  calculated_at: string;
}

/**
 * Hook to fetch the cached readiness score for a user.
 * This only reads from the database - calculations are done by the edge function.
 */
export function useReadinessScore(examType: TestType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['readiness', user?.id, examType],
    queryFn: async (): Promise<ReadinessData | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_readiness_cache')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_type', examType)
        .maybeSingle();

      if (error) {
        console.error('Error fetching readiness score:', error);
        throw error;
      }

      return data as ReadinessData | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - edge function updates on events
  });
}

/**
 * Trigger a readiness recalculation via the edge function.
 * Call this after tests or batched question attempts.
 *
 * Note: This requires the user to be authenticated. The edge function
 * will reject requests without a valid auth token.
 */
export async function recalculateReadiness(examType: TestType): Promise<boolean> {
  try {
    // Check if user is authenticated before calling edge function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('Cannot recalculate readiness: user not authenticated');
      return false;
    }

    const { data, error } = await supabase.functions.invoke('calculate-readiness', {
      body: { exam_type: examType },
    });

    if (error) {
      console.error('Error calling calculate-readiness:', error);
      return false;
    }

    return data?.success === true;
  } catch (err) {
    console.error('Failed to recalculate readiness:', err);
    return false;
  }
}
