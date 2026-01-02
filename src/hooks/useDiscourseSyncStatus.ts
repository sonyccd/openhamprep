import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Overview stats from the discourse_sync_overview view
 */
export interface SyncOverviewRow {
  license_type: 'Technician' | 'General' | 'Extra';
  total_questions: number;
  with_forum_url: number;
  without_forum_url: number;
  synced: number;
  errors: number;
  pending: number;
  needs_verification: number;
}

/**
 * Discrepancy types from verify-discourse-sync
 */
interface DiscrepancyOrphaned {
  questionDisplayName: string;
  topicId: number;
  topicUrl: string;
  action?: 'repaired' | 'skipped';
}

interface DiscrepancyBroken {
  questionId: string;
  questionDisplayName: string;
  forumUrl: string;
  error: string;
}

interface DiscrepancyMissingStatus {
  questionId: string;
  questionDisplayName: string;
  forumUrl: string;
}

/**
 * Response from verify-discourse-sync edge function
 */
export interface VerifyResult {
  success: boolean;
  action: 'verify' | 'repair';
  summary: {
    totalQuestionsInDb: number;
    totalTopicsInDiscourse: number;
    questionsWithForumUrl: number;
    questionsWithoutForumUrl: number;
    syncedCorrectly: number;
  };
  discrepancies: {
    orphanedInDiscourse: DiscrepancyOrphaned[];
    brokenForumUrl: DiscrepancyBroken[];
    missingStatus: DiscrepancyMissingStatus[];
  };
  repaired?: number;
}

/**
 * Hook for managing Discourse sync status and operations
 */
export function useDiscourseSyncStatus() {
  const queryClient = useQueryClient();

  /**
   * Query for overview stats using the database view
   */
  const overview = useQuery({
    queryKey: ['discourse-sync-overview'],
    queryFn: async (): Promise<SyncOverviewRow[]> => {
      const { data, error } = await supabase
        .rpc('get_discourse_sync_overview');

      if (error) throw error;
      return data as SyncOverviewRow[];
    },
    staleTime: 60000, // 1 minute
  });

  /**
   * Compute aggregated totals from overview data
   */
  const totals = overview.data?.reduce(
    (acc, row) => ({
      totalQuestions: acc.totalQuestions + row.total_questions,
      withForumUrl: acc.withForumUrl + row.with_forum_url,
      withoutForumUrl: acc.withoutForumUrl + row.without_forum_url,
      synced: acc.synced + row.synced,
      errors: acc.errors + row.errors,
      pending: acc.pending + row.pending,
      needsVerification: acc.needsVerification + row.needs_verification,
    }),
    {
      totalQuestions: 0,
      withForumUrl: 0,
      withoutForumUrl: 0,
      synced: 0,
      errors: 0,
      pending: 0,
      needsVerification: 0,
    }
  );

  /**
   * Mutation for verify action
   */
  const verify = useMutation({
    mutationFn: async (license?: string): Promise<VerifyResult> => {
      const response = await supabase.functions.invoke('verify-discourse-sync', {
        body: { action: 'verify', license },
      });

      if (response.error) throw response.error;
      return response.data as VerifyResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discourse-sync-overview'] });
    },
  });

  /**
   * Mutation for repair action
   */
  const repair = useMutation({
    mutationFn: async (license?: string): Promise<VerifyResult> => {
      const response = await supabase.functions.invoke('verify-discourse-sync', {
        body: { action: 'repair', license },
      });

      if (response.error) throw response.error;
      return response.data as VerifyResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discourse-sync-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-questions-full'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  /**
   * Refresh the overview data
   */
  const refreshOverview = () => {
    queryClient.invalidateQueries({ queryKey: ['discourse-sync-overview'] });
  };

  return {
    overview: overview.data,
    totals,
    isLoading: overview.isLoading,
    isError: overview.isError,
    error: overview.error,
    verify,
    repair,
    refreshOverview,
  };
}
