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

export type LicenseType = 'technician' | 'general' | 'extra';
export type ExamOutcome = 'passed' | 'failed' | 'skipped';

export interface UserTargetExam {
  id: string;
  user_id: string;
  exam_session_id: string | null;
  custom_exam_date: string | null;
  study_intensity: 'light' | 'moderate' | 'intensive';
  target_license: LicenseType | null;
  created_at: string;
  updated_at: string;
  exam_session?: ExamSession | null;
}

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

export const useBulkImportExamSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessions: Omit<ExamSession, 'id' | 'created_at' | 'updated_at'>[]) => {
      // Before deleting exam sessions, convert any user_target_exam rows that
      // reference sessions to use custom_exam_date instead. This preserves
      // the user's target date even when the linked session is removed.
      // Required because check_exam_date_source constraint needs exactly one
      // of exam_session_id OR custom_exam_date to be set.
      const { data: targetsWithSessions, error: fetchError } = await supabase
        .from('user_target_exam')
        .select('id, exam_session_id, exam_session:exam_sessions(exam_date)')
        .not('exam_session_id', 'is', null);

      if (fetchError) throw fetchError;

      // Update each target to use custom_exam_date instead of exam_session_id
      if (targetsWithSessions && targetsWithSessions.length > 0) {
        for (const target of targetsWithSessions) {
          const examDate = (target.exam_session as { exam_date: string } | null)?.exam_date;
          if (examDate) {
            const { error: updateError } = await supabase
              .from('user_target_exam')
              .update({
                exam_session_id: null,
                custom_exam_date: examDate,
              })
              .eq('id', target.id);

            if (updateError) throw updateError;
          }
        }
      }

      // Delete all existing sessions (full refresh)
      const { error: deleteError } = await supabase
        .from('exam_sessions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Insert in batches of 500 to avoid Supabase limits
      const BATCH_SIZE = 500;
      let totalInserted = 0;

      for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
        const batch = sessions.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
          .from('exam_sessions')
          .insert(batch);

        if (error) throw error;
        totalInserted += batch.length;
      }

      return { count: totalInserted };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] });
      toast.success(`Imported ${data.count} exam sessions`);
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
      const updateData: { outcome: ExamOutcome; notes?: string } = { outcome };
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('exam_attempts')
        .update(updateData)
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
        toast.info("Don't give up! Keep studying and you'll pass next time.");
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
