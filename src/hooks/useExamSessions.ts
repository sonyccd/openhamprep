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

export interface UserTargetExam {
  id: string;
  user_id: string;
  exam_session_id: string;
  study_intensity: 'light' | 'moderate' | 'intensive';
  created_at: string;
  updated_at: string;
  exam_session?: ExamSession;
}

export const useExamSessions = (filters?: {
  zip?: string;
  startDate?: string;
  endDate?: string;
  state?: string;
}) => {
  return useQuery({
    queryKey: ['exam-sessions', filters],
    queryFn: async () => {
      let query = supabase
        .from('exam_sessions')
        .select('*')
        .gte('exam_date', new Date().toISOString().split('T')[0])
        .order('exam_date', { ascending: true })
        .limit(5000); // Increase limit to handle larger datasets

      if (filters?.startDate) {
        query = query.gte('exam_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('exam_date', filters.endDate);
      }
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExamSession[];
    },
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
      return data as (UserTargetExam & { exam_session: ExamSession }) | null;
    },
    enabled: !!userId,
  });
};

export const useSaveTargetExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      examSessionId,
      studyIntensity,
    }: {
      userId: string;
      examSessionId: string;
      studyIntensity: 'light' | 'moderate' | 'intensive';
    }) => {
      // Upsert - replace existing target if any
      const { data, error } = await supabase
        .from('user_target_exam')
        .upsert(
          {
            user_id: userId,
            exam_session_id: examSessionId,
            study_intensity: studyIntensity,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-target-exam'] });
      toast.success('Target exam date saved!');
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
      // Delete all existing sessions first (full refresh)
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
