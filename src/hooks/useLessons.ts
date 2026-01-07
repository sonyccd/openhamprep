import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TestType } from "@/types/navigation";
import { Lesson, LessonTopic, LessonProgress } from "@/types/lessons";
import { useAdmin } from "./useAdmin";

// Map test type to license type string
const testTypeLicenseMap: Record<TestType, string> = {
  technician: 'technician',
  general: 'general',
  extra: 'extra',
};

/**
 * Fetch all published lessons, optionally filtered by license type
 */
export function useLessons(testType?: TestType) {
  return useQuery({
    queryKey: ['lessons', testType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          topics:lesson_topics(
            id,
            lesson_id,
            topic_id,
            display_order,
            created_at,
            topic:topics(id, slug, title, description, thumbnail_url, is_published)
          )
        `)
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      let lessons = data as Lesson[];

      // Filter by license type if provided
      if (testType) {
        const licenseType = testTypeLicenseMap[testType];
        lessons = lessons.filter(l =>
          l.license_types && l.license_types.includes(licenseType)
        );
      }

      // Sort topics within each lesson by display_order
      lessons.forEach(lesson => {
        if (lesson.topics) {
          lesson.topics.sort((a, b) => a.display_order - b.display_order);
        }
      });

      return lessons;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

/**
 * Fetch all lessons for admin (including unpublished)
 * Only fetches when user is verified as admin
 */
export function useAdminLessons() {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          topics:lesson_topics(
            id,
            lesson_id,
            topic_id,
            display_order,
            created_at,
            topic:topics(id, slug, title, description, thumbnail_url, is_published)
          )
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const lessons = data as Lesson[];

      // Sort topics within each lesson by display_order
      lessons.forEach(lesson => {
        if (lesson.topics) {
          lesson.topics.sort((a, b) => a.display_order - b.display_order);
        }
      });

      return lessons;
    },
    enabled: isAdmin, // Only fetch when user is verified as admin
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes (admin needs fresher data)
  });
}

/**
 * Fetch a single lesson by slug with all topics
 */
export function useLesson(slug: string | undefined) {
  return useQuery({
    queryKey: ['lesson', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Lesson slug is required');

      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          topics:lesson_topics(
            id,
            lesson_id,
            topic_id,
            display_order,
            created_at,
            topic:topics(
              id, slug, title, description, thumbnail_url, is_published,
              subelements:topic_subelements(id, subelement)
            )
          )
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;

      // Sort topics by display_order
      if (data?.topics) {
        data.topics.sort((a: LessonTopic, b: LessonTopic) => a.display_order - b.display_order);
      }

      return data as Lesson;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

/**
 * Fetch user's progress for all lessons
 */
export function useLessonProgress() {
  return useQuery({
    queryKey: ['lesson-progress'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as LessonProgress[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Update lesson completion status
 */
export function useUpdateLessonProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, isCompleted }: { lessonId: string; isCompleted: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id,lesson_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress'] });
    },
  });
}

/**
 * Create a new lesson (admin only)
 */
export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at' | 'topics'>) => {
      const { data, error } = await supabase
        .from('lessons')
        .insert(lesson)
        .select()
        .single();

      if (error) throw error;
      return data as Lesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}

/**
 * Update a lesson (admin only)
 */
export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lesson> & { id: string }) => {
      const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lesson;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lesson', data.slug] });
    },
  });
}

/**
 * Delete a lesson (admin only)
 */
export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
}

/**
 * Add a topic to a lesson (admin only)
 */
export function useAddLessonTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, topicId, displayOrder }: { lessonId: string; topicId: string; displayOrder: number }) => {
      const { data, error } = await supabase
        .from('lesson_topics')
        .insert({
          lesson_id: lessonId,
          topic_id: topicId,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LessonTopic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lesson'] });
    },
  });
}

/**
 * Remove a topic from a lesson (admin only)
 */
export function useRemoveLessonTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonTopicId: string) => {
      const { error } = await supabase
        .from('lesson_topics')
        .delete()
        .eq('id', lessonTopicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lesson'] });
    },
  });
}

/**
 * Update topic order within a lesson (admin only)
 * Uses batch upsert to avoid N+1 queries
 */
export function useUpdateLessonTopicOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      // Batch upsert all display_order updates in a single query
      const { error } = await supabase
        .from('lesson_topics')
        .upsert(
          updates.map(({ id, display_order }) => ({ id, display_order })),
          { onConflict: 'id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lesson'] });
    },
  });
}
