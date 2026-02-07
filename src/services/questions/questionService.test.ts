import { describe, it, expect, vi, beforeEach } from 'vitest';
import { questionService } from './questionService';
import type { Question } from './questionService';

// Mock supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIlike = vi.fn();
const mockLike = vi.fn();
const mockIn = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock testTypeUtils
vi.mock('@/lib/testTypeUtils', () => ({
  getTestTypePrefix: (testType: string) => {
    const map: Record<string, string> = { technician: 'T', general: 'G', extra: 'E' };
    return map[testType];
  },
}));

const makeDbQuestion = (overrides = {}) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  display_name: 'T1A01',
  question: 'What is amateur radio?',
  options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
  correct_answer: 2,
  subelement: 'T1',
  question_group: 'A',
  links: [],
  explanation: 'An explanation',
  forum_url: null,
  figure_url: null,
  topic_questions: [
    {
      topic: { id: 't1', slug: 'basics', title: 'Basics', is_published: true },
    },
  ],
  arrl_chapter_id: null,
  arrl_page_reference: null,
  content_hash: 'abc123',
  pool_version: '2022-2026',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue({
    select: mockSelect,
  });
  mockSelect.mockReturnValue({
    eq: mockEq,
    ilike: mockIlike,
    like: mockLike,
    in: mockIn,
  });
  mockLike.mockReturnValue({ data: [], error: null });
  mockEq.mockReturnValue({ single: mockSingle });
  mockIlike.mockReturnValue({ single: mockSingle });
});

describe('QuestionService', () => {
  describe('getAll', () => {
    it('returns all questions when no testType provided', async () => {
      const dbQuestions = [makeDbQuestion()];
      mockSelect.mockResolvedValue({ data: dbQuestions, error: null });

      const result = await questionService.getAll();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].displayName).toBe('T1A01');
        expect(result.data[0].correctAnswer).toBe('C'); // index 2
        expect(result.data[0].options.A).toBe('Answer A');
        expect(result.data[0].topics).toEqual([
          { id: 't1', slug: 'basics', title: 'Basics' },
        ]);
      }
    });

    it('filters by testType when provided', async () => {
      mockLike.mockResolvedValue({ data: [makeDbQuestion()], error: null });

      const result = await questionService.getAll('technician');

      expect(result.success).toBe(true);
      expect(mockLike).toHaveBeenCalledWith('display_name', 'T%');
    });

    it('returns empty array when no questions exist', async () => {
      mockSelect.mockResolvedValue({ data: null, error: null });

      const result = await questionService.getAll();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('filters out unpublished topics', async () => {
      const dbQ = makeDbQuestion({
        topic_questions: [
          { topic: { id: 't1', slug: 'published', title: 'Published', is_published: true } },
          { topic: { id: 't2', slug: 'draft', title: 'Draft', is_published: false } },
        ],
      });
      mockSelect.mockResolvedValue({ data: [dbQ], error: null });

      const result = await questionService.getAll();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].topics).toHaveLength(1);
        expect(result.data[0].topics![0].slug).toBe('published');
      }
    });

    it('returns failure on database error', async () => {
      const dbError = {
        message: 'relation does not exist',
        code: '42P01',
        details: '',
        hint: '',
      };
      mockSelect.mockResolvedValue({ data: null, error: dbError });

      const result = await questionService.getAll();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('getById', () => {
    it('fetches question by UUID', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const dbQ = makeDbQuestion({ id: uuid });
      mockSingle.mockResolvedValue({ data: dbQ, error: null });

      const result = await questionService.getById(uuid);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(uuid);
      }
      expect(mockEq).toHaveBeenCalledWith('id', uuid);
    });

    it('fetches question by display_name using ilike', async () => {
      const dbQ = makeDbQuestion();
      mockSingle.mockResolvedValue({ data: dbQ, error: null });

      const result = await questionService.getById('T1A01');

      expect(result.success).toBe(true);
      expect(mockIlike).toHaveBeenCalledWith('display_name', 'T1A01');
    });

    it('returns NOT_FOUND when question does not exist', async () => {
      mockSingle.mockResolvedValue({ data: null, error: null });

      const result = await questionService.getById('nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('getByIds', () => {
    it('returns empty array for empty input', async () => {
      const result = await questionService.getByIds([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
      // Should not call supabase at all
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('fetches multiple questions by UUIDs', async () => {
      const ids = ['id1', 'id2'];
      const dbQuestions = [
        makeDbQuestion({ id: 'id1', display_name: 'T1A01' }),
        makeDbQuestion({ id: 'id2', display_name: 'T1A02' }),
      ];
      mockIn.mockResolvedValue({ data: dbQuestions, error: null });

      const result = await questionService.getByIds(ids);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
      expect(mockIn).toHaveBeenCalledWith('id', ids);
    });
  });

  describe('transformQuestion', () => {
    it('maps answer index to letter correctly', async () => {
      const questions = [0, 1, 2, 3].map(i =>
        makeDbQuestion({ correct_answer: i })
      );
      mockSelect.mockResolvedValue({ data: questions, error: null });

      const result = await questionService.getAll();

      expect(result.success).toBe(true);
      if (result.success) {
        const answers = result.data.map((q: Question) => q.correctAnswer);
        expect(answers).toEqual(['A', 'B', 'C', 'D']);
      }
    });

    it('defaults to A for unknown answer index', async () => {
      mockSelect.mockResolvedValue({
        data: [makeDbQuestion({ correct_answer: 99 })],
        error: null,
      });

      const result = await questionService.getAll();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].correctAnswer).toBe('A');
      }
    });

    it('sets topics to undefined when none are published', async () => {
      mockSelect.mockResolvedValue({
        data: [makeDbQuestion({ topic_questions: [] })],
        error: null,
      });

      const result = await questionService.getAll();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].topics).toBeUndefined();
      }
    });
  });
});
