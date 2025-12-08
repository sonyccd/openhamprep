import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

interface DbQuestion {
  id: string;
  question: string;
  options: unknown;
  correct_answer: number;
  subelement: string;
  question_group: string;
  links: unknown;
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
  };
}

export function useQuestions() {
  return useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*');
      
      if (error) throw error;
      return (data as DbQuestion[]).map(transformQuestion);
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

export function usePracticeQuestions(count: number = 35) {
  const { data: allQuestions, isLoading, error } = useQuestions();
  
  const questions = allQuestions 
    ? shuffleArray([...allQuestions]).slice(0, count)
    : [];
  
  return { questions, isLoading, error };
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

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
