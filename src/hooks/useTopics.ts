import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TestType } from "@/types/navigation";

export interface TopicQuestion {
  id: string;
  displayName: string;
  question: string;
}

export interface TopicResource {
  id: string;
  topic_id: string;
  resource_type: 'video' | 'article' | 'pdf' | 'image' | 'link';
  title: string;
  url: string | null;
  storage_path: string | null;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface TopicSubelement {
  id: string;
  topic_id: string;
  subelement: string;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  display_order: number;
  is_published: boolean;
  license_types: string[];
  content_path: string | null;
  edit_history: unknown[];
  created_at: string;
  updated_at: string;
  subelements?: TopicSubelement[];
  resources?: TopicResource[];
}

interface TopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

// Map test type to license type string
const testTypeLicenseMap: Record<TestType, string> = {
  technician: 'technician',
  general: 'general',
  extra: 'extra',
};

/**
 * Fetch all published topics, optionally filtered by license type
 */
export function useTopics(testType?: TestType) {
  return useQuery({
    queryKey: ['topics', testType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          subelements:topic_subelements(id, topic_id, subelement),
          resources:topic_resources(id, topic_id, resource_type, title, url, storage_path, description, display_order, created_at)
        `)
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      let topics = data as Topic[];

      // Filter by license type if provided
      if (testType) {
        const licenseType = testTypeLicenseMap[testType];
        topics = topics.filter(t =>
          t.license_types && t.license_types.includes(licenseType)
        );
      }

      return topics;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

/**
 * Fetch all topics for admin (including unpublished)
 */
export function useAdminTopics() {
  return useQuery({
    queryKey: ['admin-topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          subelements:topic_subelements(id, topic_id, subelement),
          resources:topic_resources(id, topic_id, resource_type, title, url, storage_path, description, display_order, created_at)
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Topic[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes (admin needs fresher data)
  });
}

/**
 * Fetch a single topic by slug
 */
export function useTopic(slug: string | undefined) {
  return useQuery({
    queryKey: ['topic', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Topic slug is required');

      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          subelements:topic_subelements(id, topic_id, subelement),
          resources:topic_resources(id, topic_id, resource_type, title, url, storage_path, description, display_order, created_at)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Topic;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

/**
 * Fetch markdown content from storage
 */
export function useTopicContent(contentPath: string | null | undefined) {
  return useQuery({
    queryKey: ['topic-content', contentPath],
    queryFn: async () => {
      if (!contentPath) return null;

      const { data, error } = await supabase.storage
        .from('topic-content')
        .download(contentPath);

      if (error) {
        // Return empty content if file doesn't exist yet
        if (error.message.includes('not found')) {
          return '';
        }
        throw error;
      }

      return await data.text();
    },
    enabled: !!contentPath,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

/**
 * Fetch user's progress for all topics
 */
export function useTopicProgress() {
  return useQuery({
    queryKey: ['topic-progress'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('topic_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as TopicProgress[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Check if a specific topic is completed
 */
export function useTopicCompleted(topicId: string | undefined) {
  const { data: progress } = useTopicProgress();

  if (!topicId || !progress) return false;

  const topicProgress = progress.find(p => p.topic_id === topicId);
  return topicProgress?.is_completed ?? false;
}

/**
 * Toggle topic completion status
 */
export function useToggleTopicComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ topicId, isCompleted }: { topicId: string; isCompleted: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (isCompleted) {
        // Mark as completed - upsert to handle both insert and update
        const { error } = await supabase
          .from('topic_progress')
          .upsert({
            user_id: user.id,
            topic_id: topicId,
            is_completed: true,
            completed_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,topic_id',
          });

        if (error) throw error;
      } else {
        // Mark as not completed
        const { error } = await supabase
          .from('topic_progress')
          .upsert({
            user_id: user.id,
            topic_id: topicId,
            is_completed: false,
            completed_at: null,
          }, {
            onConflict: 'user_id,topic_id',
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-progress'] });
    },
  });
}

/**
 * Fetch questions linked to a specific topic
 */
export function useTopicQuestions(topicId: string | undefined) {
  return useQuery({
    queryKey: ['topic-questions', topicId],
    queryFn: async () => {
      if (!topicId) throw new Error('Topic ID is required');

      const { data, error } = await supabase
        .from('topic_questions')
        .select(`
          question:questions(id, display_name, question)
        `)
        .eq('topic_id', topicId);

      if (error) throw error;

      // Transform the data to extract questions
      const questions: TopicQuestion[] = (data || [])
        .filter(item => item.question)
        .map(item => ({
          id: item.question.id,
          displayName: item.question.display_name,
          question: item.question.question,
        }))
        // Sort by display name
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

      return questions;
    },
    enabled: !!topicId,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}
