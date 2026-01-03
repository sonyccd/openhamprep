import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TestType } from "@/types/navigation";
import { getTestTypePrefix } from "@/lib/testTypeUtils";

export interface LinkData {
  url: string;
  title: string;
  description: string;
  image: string;
  type: 'video' | 'article' | 'website';
  siteName: string;
  unfurledAt?: string;
}

export interface QuestionTopic {
  id: string;
  slug: string;
  title: string;
}

export interface Question {
  id: string;  // UUID
  displayName: string;  // Human-readable ID (T1A01, G2B03, etc.)
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  subelement: string;
  group: string;
  links: LinkData[];
  explanation?: string | null;
  forumUrl?: string | null;
  figureUrl?: string | null;
  topics?: QuestionTopic[];  // Related topics for this question
}

interface DbTopicQuestion {
  topic: {
    id: string;
    slug: string;
    title: string;
    is_published: boolean;
  };
}

interface DbQuestion {
  id: string;  // UUID
  display_name: string;  // Human-readable ID (T1A01, etc.)
  question: string;
  options: unknown;
  correct_answer: number;
  subelement: string;
  question_group: string;
  links: unknown;
  explanation: string | null;
  forum_url: string | null;
  figure_url: string | null;
  topic_questions?: DbTopicQuestion[];
}

const answerMap: Record<number, 'A' | 'B' | 'C' | 'D'> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D'
};

function transformQuestion(dbQuestion: DbQuestion): Question {
  const options = dbQuestion.options as string[];
  const links = (dbQuestion.links as LinkData[]) || [];

  // Extract topics from the junction table, filtering to only published topics
  const topics: QuestionTopic[] = (dbQuestion.topic_questions || [])
    .filter(tq => tq.topic?.is_published)
    .map(tq => ({
      id: tq.topic.id,
      slug: tq.topic.slug,
      title: tq.topic.title,
    }));

  return {
    id: dbQuestion.id,
    displayName: dbQuestion.display_name,
    question: dbQuestion.question,
    options: {
      A: options[0] || '',
      B: options[1] || '',
      C: options[2] || '',
      D: options[3] || '',
    },
    correctAnswer: answerMap[dbQuestion.correct_answer] || 'A',
    subelement: dbQuestion.subelement,
    group: dbQuestion.question_group,
    links,
    explanation: dbQuestion.explanation,
    forumUrl: dbQuestion.forum_url,
    figureUrl: dbQuestion.figure_url,
    topics: topics.length > 0 ? topics : undefined,
  };
}

// Helper to detect if a string is a UUID format
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function useQuestions(testType?: TestType) {
  return useQuery({
    queryKey: ['questions', testType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          topic_questions(
            topic:topics(id, slug, title, is_published)
          )
        `)
        .range(0, 1999); // Bypass Supabase's default 1000 row limit

      if (error) throw error;
      let questions = (data as DbQuestion[]).map(transformQuestion);

      // Filter by test type if provided (using displayName which has T/G/E prefix)
      if (testType) {
        const prefix = getTestTypePrefix(testType);
        questions = questions.filter(q => q.displayName.startsWith(prefix));
      }

      return questions;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

export function useRandomQuestion(excludeIds: string[] = []) {
  const { data: allQuestions, isLoading, error } = useQuestions();

  const getRandomQuestion = (): Question | null => {
    if (!allQuestions || allQuestions.length === 0) return null;

    const available = allQuestions.filter(q => !excludeIds.includes(q.id));
    if (available.length === 0) {
      // Reset if all questions have been asked
      return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  };

  return { getRandomQuestion, isLoading, error, allQuestions };
}

export function useQuestion(questionId: string | undefined) {
  // Try to use the existing all-questions cache first
  const { data: allQuestions } = useQuestions();

  return useQuery({
    queryKey: ['question', questionId],
    queryFn: async () => {
      if (!questionId) throw new Error('Question ID is required');

      // Determine if we're looking up by UUID or display_name
      const lookupByUUID = isUUID(questionId);

      // Check if we have it in the all-questions cache
      if (allQuestions) {
        const found = lookupByUUID
          ? allQuestions.find(q => q.id === questionId)
          : allQuestions.find(q => q.displayName.toUpperCase() === questionId.toUpperCase());
        if (found) return found;
      }

      // Fallback: fetch directly from database with topic associations
      const column = lookupByUUID ? 'id' : 'display_name';
      const query = supabase.from('questions').select(`
        *,
        topic_questions(
          topic:topics(id, slug, title, is_published)
        )
      `);
      const { data, error } = lookupByUUID
        ? await query.eq(column, questionId).single()
        : await query.ilike(column, questionId).single();

      if (error) throw error;
      return transformQuestion(data as DbQuestion);
    },
    enabled: !!questionId,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}
