import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useQuestions } from './useQuestions';

// Mock Supabase
const mockSelect = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

// Mock question data for all test types
const mockDbQuestions = [
  // Technician questions (T prefix)
  { id: 'T1A01', question: 'Tech Q1?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: 'https://forum.openhamprep.com/t/t1a01-tech-q1/123', figure_url: null },
  { id: 'T1A02', question: 'Tech Q2?', options: ['A', 'B', 'C', 'D'], correct_answer: 1, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null, figure_url: 'https://storage.example.com/question-figures/T1A02.png' },
  { id: 'T2A01', question: 'Tech Q3?', options: ['A', 'B', 'C', 'D'], correct_answer: 2, subelement: 'T2', question_group: 'T2A', links: [], explanation: null, forum_url: 'https://forum.openhamprep.com/t/t2a01-tech-q3/125', figure_url: null },
  // General questions (G prefix)
  { id: 'G1A01', question: 'General Q1?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'G1', question_group: 'G1A', links: [], explanation: null, forum_url: null, figure_url: null },
  { id: 'G1A02', question: 'General Q2?', options: ['A', 'B', 'C', 'D'], correct_answer: 1, subelement: 'G1', question_group: 'G1A', links: [], explanation: null, forum_url: 'https://forum.openhamprep.com/t/g1a02-general-q2/200', figure_url: 'https://storage.example.com/question-figures/G1A02.png' },
  { id: 'G2A01', question: 'General Q3?', options: ['A', 'B', 'C', 'D'], correct_answer: 3, subelement: 'G2', question_group: 'G2A', links: [], explanation: null, forum_url: null, figure_url: null },
  // Extra questions (E prefix)
  { id: 'E1A01', question: 'Extra Q1?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'E1', question_group: 'E1A', links: [], explanation: null, forum_url: 'https://forum.openhamprep.com/t/e1a01-extra-q1/300', figure_url: null },
  { id: 'E1A02', question: 'What is shown in Figure E1-1?', options: ['A', 'B', 'C', 'D'], correct_answer: 2, subelement: 'E1', question_group: 'E1A', links: [], explanation: null, forum_url: null, figure_url: 'https://storage.example.com/question-figures/E1A02.png' },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue({ data: mockDbQuestions, error: null });
  });

  describe('without testType filter', () => {
    it('returns all questions when no testType is provided', async () => {
      const { result } = renderHook(() => useQuestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(8);
      expect(result.current.data?.map(q => q.id)).toEqual([
        'T1A01', 'T1A02', 'T2A01',
        'G1A01', 'G1A02', 'G2A01',
        'E1A01', 'E1A02',
      ]);
    });

    it('transforms database questions correctly', async () => {
      const { result } = renderHook(() => useQuestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const firstQuestion = result.current.data?.[0];
      expect(firstQuestion).toEqual({
        id: 'T1A01',
        question: 'Tech Q1?',
        options: { A: 'A', B: 'B', C: 'C', D: 'D' },
        correctAnswer: 'A',
        subelement: 'T1',
        group: 'T1A',
        links: [],
        explanation: null,
        forumUrl: 'https://forum.openhamprep.com/t/t1a01-tech-q1/123',
        figureUrl: null,
      });
    });
  });

  describe('with testType filter', () => {
    it('filters to only Technician questions when testType is "technician"', async () => {
      const { result } = renderHook(() => useQuestions('technician'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.every(q => q.id.startsWith('T'))).toBe(true);
      expect(result.current.data?.map(q => q.id)).toEqual(['T1A01', 'T1A02', 'T2A01']);
    });

    it('filters to only General questions when testType is "general"', async () => {
      const { result } = renderHook(() => useQuestions('general'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.every(q => q.id.startsWith('G'))).toBe(true);
      expect(result.current.data?.map(q => q.id)).toEqual(['G1A01', 'G1A02', 'G2A01']);
    });

    it('filters to only Extra questions when testType is "extra"', async () => {
      const { result } = renderHook(() => useQuestions('extra'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every(q => q.id.startsWith('E'))).toBe(true);
      expect(result.current.data?.map(q => q.id)).toEqual(['E1A01', 'E1A02']);
    });
  });

  describe('query key caching', () => {
    it('uses different query keys for different test types', async () => {
      const wrapper = createWrapper();

      // First render with technician
      const { result: techResult } = renderHook(() => useQuestions('technician'), { wrapper });
      await waitFor(() => expect(techResult.current.isSuccess).toBe(true));

      // Supabase should have been called once
      expect(mockSelect).toHaveBeenCalledTimes(1);

      // Second render with general (new wrapper to avoid cache sharing in test)
      const wrapper2 = createWrapper();
      const { result: generalResult } = renderHook(() => useQuestions('general'), { wrapper: wrapper2 });
      await waitFor(() => expect(generalResult.current.isSuccess).toBe(true));

      // Should call Supabase again for different test type
      expect(mockSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('correct answer mapping', () => {
    it('maps correct_answer 0 to A', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [{ id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null }],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('A');
    });

    it('maps correct_answer 1 to B', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [{ id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 1, subelement: 'T1', question_group: 'T1A', links: [], explanation: null }],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('B');
    });

    it('maps correct_answer 2 to C', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [{ id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 2, subelement: 'T1', question_group: 'T1A', links: [], explanation: null }],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('C');
    });

    it('maps correct_answer 3 to D', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [{ id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 3, subelement: 'T1', question_group: 'T1A', links: [], explanation: null }],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('D');
    });
  });

  describe('error handling', () => {
    it('returns error state when query fails', async () => {
      mockSelect.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      const { result } = renderHook(() => useQuestions('technician'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });
  });

  describe('empty results', () => {
    it('returns empty array when no questions match filter', async () => {
      // Only return Technician questions from the database
      mockSelect.mockResolvedValueOnce({
        data: [
          { id: 'T1A01', question: 'Tech Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null },
        ],
        error: null,
      });

      // But request General questions
      const { result } = renderHook(() => useQuestions('general'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(0);
    });
  });

  describe('forum_url handling', () => {
    it('transforms forum_url to forumUrl in camelCase', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [
          { id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: 'https://forum.openhamprep.com/t/test/123' },
        ],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.forumUrl).toBe('https://forum.openhamprep.com/t/test/123');
    });

    it('handles null forum_url', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [
          { id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null },
        ],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.forumUrl).toBeNull();
    });

    it('preserves forum_url across different license types', async () => {
      const { result } = renderHook(() => useQuestions(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // T1A01 has forum_url, T1A02 does not
      const t1a01 = result.current.data?.find(q => q.id === 'T1A01');
      const t1a02 = result.current.data?.find(q => q.id === 'T1A02');
      const g1a02 = result.current.data?.find(q => q.id === 'G1A02');
      const e1a01 = result.current.data?.find(q => q.id === 'E1A01');

      expect(t1a01?.forumUrl).toBe('https://forum.openhamprep.com/t/t1a01-tech-q1/123');
      expect(t1a02?.forumUrl).toBeNull();
      expect(g1a02?.forumUrl).toBe('https://forum.openhamprep.com/t/g1a02-general-q2/200');
      expect(e1a01?.forumUrl).toBe('https://forum.openhamprep.com/t/e1a01-extra-q1/300');
    });

    it('includes forumUrl in Question interface', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [
          { id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: 'Test explanation', forum_url: 'https://forum.openhamprep.com/t/test/456', figure_url: null },
        ],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const question = result.current.data?.[0];
      // Verify all expected properties exist
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('question');
      expect(question).toHaveProperty('options');
      expect(question).toHaveProperty('correctAnswer');
      expect(question).toHaveProperty('subelement');
      expect(question).toHaveProperty('group');
      expect(question).toHaveProperty('links');
      expect(question).toHaveProperty('explanation');
      expect(question).toHaveProperty('forumUrl');
      expect(question).toHaveProperty('figureUrl');
    });
  });

  describe('figure_url handling', () => {
    it('transforms figure_url to figureUrl in camelCase', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [
          { id: 'E9B05', question: 'What is shown in Figure E9-2?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'E9', question_group: 'E9B', links: [], explanation: null, forum_url: null, figure_url: 'https://storage.example.com/question-figures/E9B05.png' },
        ],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('extra'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.figureUrl).toBe('https://storage.example.com/question-figures/E9B05.png');
    });

    it('handles null figure_url', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [
          { id: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null, figure_url: null },
        ],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.figureUrl).toBeNull();
    });

    it('preserves figure_url across different license types', async () => {
      const { result } = renderHook(() => useQuestions(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // T1A01 has no figure, T1A02 has figure
      const t1a01 = result.current.data?.find(q => q.id === 'T1A01');
      const t1a02 = result.current.data?.find(q => q.id === 'T1A02');
      const g1a02 = result.current.data?.find(q => q.id === 'G1A02');
      const e1a02 = result.current.data?.find(q => q.id === 'E1A02');

      expect(t1a01?.figureUrl).toBeNull();
      expect(t1a02?.figureUrl).toBe('https://storage.example.com/question-figures/T1A02.png');
      expect(g1a02?.figureUrl).toBe('https://storage.example.com/question-figures/G1A02.png');
      expect(e1a02?.figureUrl).toBe('https://storage.example.com/question-figures/E1A02.png');
    });

    it('includes figureUrl in Question interface', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [
          { id: 'E9B05', question: 'What is shown in Figure E9-2?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'E9', question_group: 'E9B', links: [], explanation: 'Antenna pattern explanation', forum_url: null, figure_url: 'https://storage.example.com/question-figures/E9B05.png' },
        ],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('extra'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const question = result.current.data?.[0];
      // Verify figureUrl is included with other properties
      expect(question).toMatchObject({
        id: 'E9B05',
        question: 'What is shown in Figure E9-2?',
        figureUrl: 'https://storage.example.com/question-figures/E9B05.png',
      });
    });

    it('handles question with both forumUrl and figureUrl', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [
          {
            id: 'E9B05',
            question: 'What is shown in Figure E9-2?',
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 0,
            subelement: 'E9',
            question_group: 'E9B',
            links: [],
            explanation: 'Test explanation',
            forum_url: 'https://forum.openhamprep.com/t/e9b05/123',
            figure_url: 'https://storage.example.com/question-figures/E9B05.png',
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('extra'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const question = result.current.data?.[0];
      expect(question?.forumUrl).toBe('https://forum.openhamprep.com/t/e9b05/123');
      expect(question?.figureUrl).toBe('https://storage.example.com/question-figures/E9B05.png');
    });

    it('handles Supabase storage URLs correctly', async () => {
      const storageUrl = 'https://xyz.supabase.co/storage/v1/object/public/question-figures/E9B05.png';
      mockSelect.mockResolvedValueOnce({
        data: [
          { id: 'E9B05', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'E9', question_group: 'E9B', links: [], explanation: null, forum_url: null, figure_url: storageUrl },
        ],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('extra'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.figureUrl).toBe(storageUrl);
    });

    it('handles figure URLs with cache-busting query parameters', async () => {
      const urlWithParams = 'https://storage.example.com/question-figures/E9B05.png?t=1234567890';
      mockSelect.mockResolvedValueOnce({
        data: [
          { id: 'E9B05', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'E9', question_group: 'E9B', links: [], explanation: null, forum_url: null, figure_url: urlWithParams },
        ],
        error: null,
      });

      const { result } = renderHook(() => useQuestions('extra'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.figureUrl).toBe(urlWithParams);
    });
  });
});
