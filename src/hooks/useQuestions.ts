import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TestType } from "@/types/navigation";

// Map test type to question ID prefix
const testTypePrefixMap: Record<TestType, string> = {
  technician: 'T',
  general: 'G',
  extra: 'E',
};

export interface LinkData {
  url: string;
  title: string;
  description: string;
  image: string;
  type: 'video' | 'article' | 'website';
  siteName: string;
  unfurledAt?: string;
}

export interface Question {
  id: string;
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
}

interface DbQuestion {
  id: string;
  question: string;
  options: unknown;
  correct_answer: number;
  subelement: string;
  question_group: string;
  links: unknown;
  explanation: string | null;
  forum_url: string | null;
  figure_url: string | null;
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
  return {
    id: dbQuestion.id,
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
  };
}

export function useQuestions(testType?: TestType) {
  return useQuery({
    queryKey: ['questions', testType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*');

      if (error) throw error;
      let questions = (data as DbQuestion[]).map(transformQuestion);

      // Filter by test type if provided
      if (testType) {
        const prefix = testTypePrefixMap[testType];
        questions = questions.filter(q => q.id.startsWith(prefix));
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
