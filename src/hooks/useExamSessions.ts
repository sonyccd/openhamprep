import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/services/queryKeys';
import { unwrapOrThrow } from '@/services/types';
import { examSessionService } from '@/services/examSession/examSessionService';
import { weeklyGoalsService } from '@/services/weeklyGoals/weeklyGoalsService';

// Re-export types from service for backward compatibility
export type {
  ExamSession,
  LicenseType,
  ExamOutcome,
  UserTargetExam,
  ExamAttempt,
} from '@/services/examSession/examSessionService';

// Map study intensity to weekly goals (presentation concern, stays in hook)
const INTENSITY_TO_GOALS = {
  light: { questions_goal: 70, tests_goal: 1 },
  moderate: { questions_goal: 175, tests_goal: 2 },
  intensive: { questions_goal: 350, tests_goal: 3 },
};

export const useExamSessions = (filters?: {
  zip?: string;
  startDate?: string;
  endDate?: string;
  state?: string;
  walkInsOnly?: boolean;
  page?: number;
  pageSize?: number;
}) => {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 50;

  return useQuery({
    queryKey: queryKeys.examSessions.all(filters),
    queryFn: async () =>
      unwrapOrThrow(
        await examSessionService.getSessions(filters, page, pageSize)
      ),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

export const useExamSessionsCount = () => {
  return useQuery({
    queryKey: queryKeys.examSessions.count(),
    queryFn: async () =>
      unwrapOrThrow(await examSessionService.getCount()),
    staleTime: 1000 * 60 * 10,
  });
};

export const useExamSessionsLastUpdated = () => {
  return useQuery({
    queryKey: queryKeys.examSessions.lastUpdated(),
    queryFn: async () =>
      unwrapOrThrow(await examSessionService.getLastUpdated()),
    staleTime: 1000 * 60 * 10,
  });
};

export const useUserTargetExam = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.targetExam.byUser(userId ?? ''),
    queryFn: async () => {
      if (!userId) return null;
      return unwrapOrThrow(await examSessionService.getUserTarget(userId));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSaveTargetExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      examSessionId,
      customExamDate,
      studyIntensity,
      targetLicense,
    }: {
      userId: string;
      examSessionId?: string;
      customExamDate?: string;
      studyIntensity: 'light' | 'moderate' | 'intensive';
      targetLicense?: 'technician' | 'general' | 'extra';
    }) => {
      const data = unwrapOrThrow(
        await examSessionService.saveTarget({
          userId,
          examSessionId,
          customExamDate,
          studyIntensity,
          targetLicense,
        })
      );

      // Also update weekly study goals based on intensity (non-fatal)
      const goals = INTENSITY_TO_GOALS[studyIntensity];
      const goalsResult = await weeklyGoalsService.upsertGoals(
        userId,
        goals.questions_goal,
        goals.tests_goal
      );
      if (!goalsResult.success) {
        console.error('Failed to update weekly goals:', goalsResult.error);
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.targetExam.root() });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.weeklyGoals(variables.userId) });
      toast.success('Target exam date saved! Weekly goals updated.');
    },
    onError: (error) => {
      console.error('Error saving target exam:', error);
      toast.error('Failed to save target exam date');
    },
  });
};

export const useRemoveTargetExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      unwrapOrThrow(await examSessionService.removeTarget(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.targetExam.root() });
      toast.success('Target exam date removed');
    },
    onError: (error) => {
      console.error('Error removing target exam:', error);
      toast.error('Failed to remove target exam date');
    },
  });
};

/**
 * Bulk import exam sessions using an atomic database function.
 * This prevents race conditions where users could save targets
 * referencing sessions that are about to be deleted.
 *
 * **Important:** This operation affects ALL users with session-linked targets.
 * Any user_target_exam row that references an exam_session will have its
 * exam_session_id converted to a custom_exam_date (preserving the date).
 * Users will see their target date unchanged, but it will no longer be
 * linked to a specific session.
 *
 * The database function (admin-only, SECURITY DEFINER):
 * 1. Converts ALL user_target_exam rows with session refs to custom_exam_date
 * 2. Deletes all existing sessions
 * 3. Inserts new sessions from the provided data
 * All within a single atomic transaction.
 */
export const useBulkImportExamSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessions: Parameters<typeof examSessionService.bulkImport>[0]) =>
      unwrapOrThrow(await examSessionService.bulkImport(sessions)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examSessions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.targetExam.root() });

      let message = `Imported ${data.count} exam sessions`;
      if (data.convertedTargets > 0) {
        message += ` (${data.convertedTargets} existing target${data.convertedTargets === 1 ? '' : 's'} preserved as custom dates)`;
      }
      toast.success(message);
    },
    onError: (error) => {
      console.error('Error importing exam sessions:', error);
      toast.error('Failed to import exam sessions');
    },
  });
};

// ============================================================================
// Exam Attempts Hooks (Historical Tracking)
// ============================================================================

export const useExamAttempts = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.examAttempts.byUser(userId ?? ''),
    queryFn: async () => {
      if (!userId) return [];
      return unwrapOrThrow(await examSessionService.getAttempts(userId));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useRecordExamAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      examDate,
      targetLicense,
      outcome,
      examSessionId,
      notes,
    }: {
      userId: string;
      examDate: string;
      targetLicense: 'technician' | 'general' | 'extra';
      outcome?: 'passed' | 'failed' | 'skipped';
      examSessionId?: string;
      notes?: string;
    }) =>
      unwrapOrThrow(
        await examSessionService.recordAttempt({
          userId,
          examDate,
          targetLicense,
          outcome,
          examSessionId,
          notes,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examAttempts.root() });
    },
    onError: (error) => {
      console.error('Error recording exam attempt:', error);
      toast.error('Failed to record exam attempt');
    },
  });
};

export const useUpdateExamAttemptOutcome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      attemptId,
      outcome,
      notes,
    }: {
      attemptId: string;
      outcome: 'passed' | 'failed' | 'skipped';
      notes?: string;
    }) =>
      unwrapOrThrow(
        await examSessionService.updateOutcome({ attemptId, outcome, notes })
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examAttempts.root() });
      if (variables.outcome === 'passed') {
        toast.success('Congratulations on passing your exam!');
      } else if (variables.outcome === 'failed') {
        toast.info('Exam result recorded. Keep studying - you can do it!');
      }
    },
    onError: (error) => {
      console.error('Error updating exam outcome:', error);
      toast.error('Failed to update exam outcome');
    },
  });
};

// Note: Geocoding is now handled client-side via useGeocoding.ts hook
// using Mapbox API with localStorage persistence and quota protection.

export const useSessionsNeedingGeocodeCount = () => {
  return useQuery({
    queryKey: queryKeys.examSessions.needingGeocodeCount(),
    queryFn: async () =>
      unwrapOrThrow(await examSessionService.getNeedingGeocodeCount()),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSessionsNeedingGeocode = (options?: {
  enabled?: boolean;
  includeAll?: boolean;
}) => {
  return useQuery({
    queryKey: queryKeys.examSessions.needingGeocode(options?.includeAll ?? false),
    queryFn: async () =>
      unwrapOrThrow(
        await examSessionService.getSessionsNeedingGeocode(options?.includeAll ?? false)
      ),
    enabled: options?.enabled ?? false,
    staleTime: 1000 * 60 * 2,
  });
};
