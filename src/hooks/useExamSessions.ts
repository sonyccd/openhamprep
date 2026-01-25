import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExamSession {
  id: string;
  title: string | null;
  exam_date: string;
  sponsor: string | null;
  exam_time: string | null;
  walk_ins_allowed: boolean;
  public_contact: string | null;
  phone: string | null;
  email: string | null;
  vec: string | null;
  location_name: string | null;
  address: string | null;
  address_2: string | null;
  address_3: string | null;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Amateur radio license classes in the US licensing system.
 * - technician: Entry-level license with VHF/UHF privileges
 * - general: Mid-level license with HF privileges
 * - extra: Highest class with full amateur privileges
 */
export type LicenseType = 'technician' | 'general' | 'extra';

/**
 * Possible outcomes for an exam attempt.
 * - passed: User passed the exam
 * - failed: User did not pass the exam
 * - skipped: User did not take the scheduled exam
 */
export type ExamOutcome = 'passed' | 'failed' | 'skipped';

export interface UserTargetExam {
  id: string;
  user_id: string;
  exam_session_id: string | null;
  custom_exam_date: string | null;
  study_intensity: 'light' | 'moderate' | 'intensive';
  /**
   * The license level the user is studying for.
   * Null for legacy records created before this field was added,
   * or if the user hasn't explicitly selected a license level.
   */
  target_license: LicenseType | null;
  created_at: string;
  updated_at: string;
  exam_session?: ExamSession | null;
}

/**
 * Historical record of an exam attempt.
 *
 * Note: A unique constraint (user_id, exam_date, target_license) prevents
 * duplicate entries for the same license on the same day. This is intentional
 * as VE sessions typically don't allow same-day retakes for the same element.
 * If a user needs to record multiple attempts on the same day (rare), they
 * can use the notes field to document additional details.
 */
export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_date: string;
  target_license: LicenseType;
  outcome: ExamOutcome | null;
  exam_session_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  exam_session?: ExamSession | null;
}

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
    queryKey: ['exam-sessions', filters],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('exam_sessions')
        .select('*', { count: 'exact' })
        .gte('exam_date', new Date().toISOString().split('T')[0])
        .order('exam_date', { ascending: true });

      if (filters?.startDate) {
        query = query.gte('exam_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('exam_date', filters.endDate);
      }
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }
      // Filter by zip code prefix (first 3 digits) on server
      if (filters?.zip && filters.zip.length >= 3) {
        const zipPrefix = filters.zip.substring(0, 3);
        query = query.ilike('zip', `${zipPrefix}*`);
      }
      // Filter by walk-ins allowed
      if (filters?.walkInsOnly) {
        query = query.eq('walk_ins_allowed', true);
      }

      // Apply pagination after all filters
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        sessions: data as ExamSession[],
        totalCount: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in garbage collection for 30 minutes
  });
};

// Hook to get total count of sessions (for admin stats)
export const useExamSessionsCount = () => {
  return useQuery({
    queryKey: ['exam-sessions-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('exam_sessions')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
};

// Hook to get the last updated timestamp for exam sessions
export const useExamSessionsLastUpdated = () => {
  return useQuery({
    queryKey: ['exam-sessions-last-updated'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.updated_at ?? null;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
};

export const useUserTargetExam = (userId?: string) => {
  return useQuery({
    queryKey: ['user-target-exam', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_target_exam')
        .select(`
          *,
          exam_session:exam_sessions(*)
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as (UserTargetExam & { exam_session: ExamSession | null }) | null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// Map study intensity to weekly goals
const INTENSITY_TO_GOALS = {
  light: { questions_goal: 70, tests_goal: 1 },      // 10 questions/day * 7
  moderate: { questions_goal: 175, tests_goal: 2 },  // 25 questions/day * 7
  intensive: { questions_goal: 350, tests_goal: 3 }, // 50 questions/day * 7
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
      targetLicense?: LicenseType;
    }) => {
      // Validate: must have exactly one of examSessionId or customExamDate
      if ((!examSessionId && !customExamDate) || (examSessionId && customExamDate)) {
        throw new Error('Must provide either examSessionId or customExamDate, not both');
      }

      // Upsert target exam
      const { data, error } = await supabase
        .from('user_target_exam')
        .upsert(
          {
            user_id: userId,
            exam_session_id: examSessionId || null,
            custom_exam_date: customExamDate || null,
            study_intensity: studyIntensity,
            target_license: targetLicense || null,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;

      // Also update weekly study goals based on intensity
      const goals = INTENSITY_TO_GOALS[studyIntensity];
      const { error: goalsError } = await supabase
        .from('weekly_study_goals')
        .upsert(
          {
            user_id: userId,
            questions_goal: goals.questions_goal,
            tests_goal: goals.tests_goal,
          },
          { onConflict: 'user_id' }
        );

      if (goalsError) {
        console.error('Failed to update weekly goals:', goalsError);
        // Don't throw - target exam was saved successfully
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-target-exam'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-goals'] });
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
      const { error } = await supabase
        .from('user_target_exam')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-target-exam'] });
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
    mutationFn: async (sessions: Omit<ExamSession, 'id' | 'created_at' | 'updated_at'>[]) => {
      // Use atomic database function to prevent race conditions
      const { data, error } = await supabase.rpc('bulk_import_exam_sessions_safe', {
        sessions_data: sessions,
      });

      if (error) throw error;

      // The function returns a single row with counts
      // If no data returned, the transaction may have failed silently
      if (!data || data.length === 0) {
        throw new Error('Bulk import returned no result - transaction may have failed');
      }

      const result = data[0];
      return {
        count: result.inserted_sessions_count,
        convertedTargets: result.converted_targets_count,
        deletedSessions: result.deleted_sessions_count,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['user-target-exam'] });

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

/**
 * Get a user's exam attempt history
 */
export const useExamAttempts = (userId?: string) => {
  return useQuery({
    queryKey: ['exam-attempts', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          exam_session:exam_sessions(*)
        `)
        .eq('user_id', userId)
        .order('exam_date', { ascending: false });

      if (error) throw error;
      return data as (ExamAttempt & { exam_session: ExamSession | null })[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Record an exam attempt (when user confirms they took the exam)
 */
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
      targetLicense: LicenseType;
      outcome?: ExamOutcome;
      examSessionId?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('exam_attempts')
        .insert({
          user_id: userId,
          exam_date: examDate,
          target_license: targetLicense,
          outcome: outcome || null,
          exam_session_id: examSessionId || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
    },
    onError: (error) => {
      console.error('Error recording exam attempt:', error);
      toast.error('Failed to record exam attempt');
    },
  });
};

/**
 * Update an exam attempt outcome (when user reports their result)
 */
export const useUpdateExamAttemptOutcome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      attemptId,
      outcome,
      notes,
    }: {
      attemptId: string;
      outcome: ExamOutcome;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('exam_attempts')
        .update({ outcome, ...(notes !== undefined && { notes }) })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
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
