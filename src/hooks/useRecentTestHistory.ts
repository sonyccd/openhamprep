import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/services/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import type { TestType } from '@/types/navigation';

export interface TestHistoryResult {
  id: string;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
  test_type: string;
}

/**
 * The signed-in user's last five results for one exam, for the start screen.
 *
 * Was an inline useQuery in PracticeTest calling supabase from the component,
 * under a hand-written ['test-history', ...] key that nothing invalidated —
 * so after finishing a test the list stayed stale for its whole staleTime.
 * Its key now sits under the testResults prefix useProgress already clears.
 */
export function useRecentTestHistory(testType: TestType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.progress.recentTestResults(user?.id ?? '', testType),
    queryFn: async () => {
      // Technician results were stored as 'practice' before test types existed.
      const testTypesToMatch = testType === 'technician' ? ['practice', 'technician'] : [testType];

      const { data, error } = await supabase
        .from('practice_test_results')
        .select('*')
        .eq('user_id', user!.id)
        .in('test_type', testTypesToMatch)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as TestHistoryResult[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

/** "Today at 3:15 PM", "Yesterday", "4 days ago", then a short date. */
export function formatTestDate(dateStr: string) {
  const date = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
