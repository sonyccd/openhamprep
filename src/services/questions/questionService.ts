import { supabase } from '@/integrations/supabase/client';
import { ServiceBase } from '../shared/serviceBase';
import { ServiceResult } from '../types';
import { TestType } from '@/types/navigation';
import { getTestTypePrefix } from '@/lib/testTypeUtils';

// ---------------------------------------------------------------------------
// Domain types (exported for consumers)
// ---------------------------------------------------------------------------

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
  topics?: QuestionTopic[];
  arrlChapterId?: string | null;
  arrlPageReference?: string | null;
  contentHash?: string | null;
  poolVersion?: string | null;
}

// ---------------------------------------------------------------------------
// DB types (private to service)
// ---------------------------------------------------------------------------

interface DbTopicQuestion {
  topic: {
    id: string;
    slug: string;
    title: string;
    is_published: boolean;
  };
}

interface DbQuestion {
  id: string;
  display_name: string;
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
  arrl_chapter_id: string | null;
  arrl_page_reference: string | null;
  content_hash: string | null;
  pool_version: string | null;
}

// ---------------------------------------------------------------------------
// Transform helpers (private)
// ---------------------------------------------------------------------------

const answerMap: Record<number, 'A' | 'B' | 'C' | 'D'> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D',
};

function transformQuestion(dbQuestion: DbQuestion): Question {
  const options = dbQuestion.options as string[];
  const links = (dbQuestion.links as LinkData[]) || [];

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
    arrlChapterId: dbQuestion.arrl_chapter_id,
    arrlPageReference: dbQuestion.arrl_page_reference,
    contentHash: dbQuestion.content_hash,
    poolVersion: dbQuestion.pool_version,
  };
}

/** Detect if a string is a UUID format */
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/** Common select string used by all query methods */
const QUESTION_SELECT = `
  *,
  topic_questions(
    topic:topics(id, slug, title, is_published)
  )
`;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class QuestionService extends ServiceBase {
  async getAll(testType?: TestType): Promise<ServiceResult<Question[]>> {
    return this.handleQueryAllowEmpty(
      async () => {
        let query = supabase
          .from('questions')
          .select(QUESTION_SELECT);

        if (testType) {
          const prefix = getTestTypePrefix(testType);
          query = query.like('display_name', `${prefix}%`);
        }

        const { data, error } = await query;
        return {
          data: data ? (data as DbQuestion[]).map(transformQuestion) : null,
          error,
        };
      },
      [],
      'Failed to fetch questions'
    );
  }

  async getById(questionId: string): Promise<ServiceResult<Question>> {
    return this.handleQuery(
      async () => {
        const lookupByUUID = isUUID(questionId);
        const column = lookupByUUID ? 'id' : 'display_name';

        // display_name lookup uses ilike for case-insensitive matching,
        // allowing URLs like /questions/t1a01 to resolve to T1A01
        const query = supabase.from('questions').select(QUESTION_SELECT);
        const { data, error } = lookupByUUID
          ? await query.eq(column, questionId).single()
          : await query.ilike(column, questionId).single();

        return {
          data: data ? transformQuestion(data as DbQuestion) : null,
          error,
        };
      },
      'Failed to fetch question'
    );
  }

  async getByIds(questionIds: string[]): Promise<ServiceResult<Question[]>> {
    if (questionIds.length === 0) {
      return { success: true, data: [] };
    }

    return this.handleQueryAllowEmpty(
      async () => {
        const { data, error } = await supabase
          .from('questions')
          .select(QUESTION_SELECT)
          .in('id', questionIds);

        return {
          data: data ? (data as DbQuestion[]).map(transformQuestion) : null,
          error,
        };
      },
      [],
      'Failed to fetch questions by IDs'
    );
  }
}

export const questionService = new QuestionService();
