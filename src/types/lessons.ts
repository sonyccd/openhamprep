import { Topic } from "@/hooks/useTopics";

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  display_order: number;
  is_published: boolean;
  license_types: string[];
  edit_history: unknown[];
  created_at: string;
  updated_at: string;
  topics?: LessonTopic[];
}

export interface LessonTopic {
  id: string;
  lesson_id: string;
  topic_id: string;
  display_order: number;
  created_at: string;
  topic?: Topic;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonWithCompletion extends Lesson {
  topicCount: number;
  completedTopicCount: number;
  completionPercentage: number;
}
