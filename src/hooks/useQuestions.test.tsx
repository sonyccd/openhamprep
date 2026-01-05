import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useQuestions, useQuestion } from './useQuestions';

// Mock question data for all test types
// Note: id is now UUID, display_name is the human-readable ID (T1A01, etc.)
const mockDbQuestions = [
  // Technician questions (T prefix)
  { id: 'uuid-t1a01', display_name: 'T1A01', question: 'Tech Q1?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: 'https://forum.openhamprep.com/t/t1a01-tech-q1/123', figure_url: null },
  { id: 'uuid-t1a02', display_name: 'T1A02', question: 'Tech Q2?', options: ['A', 'B', 'C', 'D'], correct_answer: 1, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null, figure_url: 'https://storage.example.com/question-figures/T1A02.png' },
  { id: 'uuid-t2a01', display_name: 'T2A01', question: 'Tech Q3?', options: ['A', 'B', 'C', 'D'], correct_answer: 2, subelement: 'T2', question_group: 'T2A', links: [], explanation: null, forum_url: 'https://forum.openhamprep.com/t/t2a01-tech-q3/125', figure_url: null },
  // General questions (G prefix)
  { id: 'uuid-g1a01', display_name: 'G1A01', question: 'General Q1?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'G1', question_group: 'G1A', links: [], explanation: null, forum_url: null, figure_url: null },
  { id: 'uuid-g1a02', display_name: 'G1A02', question: 'General Q2?', options: ['A', 'B', 'C', 'D'], correct_answer: 1, subelement: 'G1', question_group: 'G1A', links: [], explanation: null, forum_url: 'https://forum.openhamprep.com/t/g1a02-general-q2/200', figure_url: 'https://storage.example.com/question-figures/G1A02.png' },
  { id: 'uuid-g2a01', display_name: 'G2A01', question: 'General Q3?', options: ['A', 'B', 'C', 'D'], correct_answer: 3, subelement: 'G2', question_group: 'G2A', links: [], explanation: null, forum_url: null, figure_url: null },
  // Extra questions (E prefix)
  { id: 'uuid-e1a01', display_name: 'E1A01', question: 'Extra Q1?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'E1', question_group: 'E1A', links: [], explanation: null, forum_url: 'https://forum.openhamprep.com/t/e1a01-extra-q1/300', figure_url: null },
  { id: 'uuid-e1a02', display_name: 'E1A02', question: 'What is shown in Figure E1-1?', options: ['A', 'B', 'C', 'D'], correct_answer: 2, subelement: 'E1', question_group: 'E1A', links: [], explanation: null, forum_url: null, figure_url: 'https://storage.example.com/question-figures/E1A02.png' },
];

// Variable to allow tests to override the mock data or force errors
let mockDataOverride: typeof mockDbQuestions | null = null;
let mockErrorOverride: Error | null = null;

// Helper to set mock data for a test
const setMockData = (data: typeof mockDbQuestions) => {
  mockDataOverride = data;
};

// Helper to set error for a test
const setMockError = (error: Error) => {
  mockErrorOverride = error;
};

// Create the chainable query builder that simulates Supabase query behavior
const createQueryBuilder = () => {
  const currentData = mockDataOverride || mockDbQuestions;
  const currentError = mockErrorOverride;

  // Reset overrides after creating builder
  mockDataOverride = null;
  mockErrorOverride = null;

  if (currentError) {
    // Return error builder
    return {
      like: vi.fn(() => Promise.resolve({ data: null, error: currentError })),
      in: vi.fn(() => Promise.resolve({ data: null, error: currentError })),
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: currentError })),
      })),
      ilike: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: currentError })),
      })),
      then: (resolve: (value: { data: null; error: Error }) => void) => {
        resolve({ data: null, error: currentError });
      },
    };
  }

  const builder = {
    like: vi.fn((column: string, pattern: string) => {
      // Filter data based on the like pattern (e.g., 'T%' for Technician)
      const prefix = pattern.replace('%', '');
      const filtered = currentData.filter(q => q.display_name.startsWith(prefix));
      return Promise.resolve({ data: filtered, error: null });
    }),
    in: vi.fn((column: string, ids: string[]) => {
      const filtered = currentData.filter(q => ids.includes(q.id));
      return Promise.resolve({ data: filtered, error: null });
    }),
    eq: vi.fn((column: string, value: string) => ({
      single: vi.fn(() => {
        const found = currentData.find(q => column === 'id' ? q.id === value : q.display_name === value);
        return Promise.resolve({ data: found || null, error: found ? null : { message: 'Not found' } });
      }),
    })),
    ilike: vi.fn((column: string, value: string) => ({
      single: vi.fn(() => {
        const found = currentData.find(q => q.display_name.toUpperCase() === value.toUpperCase());
        return Promise.resolve({ data: found || null, error: found ? null : { message: 'Not found' } });
      }),
    })),
    // When no filter is applied (the query is awaited directly), return all data
    then: (resolve: (value: { data: typeof mockDbQuestions; error: null }) => void) => {
      resolve({ data: currentData, error: null });
    },
  };
  return builder;
};

const mockSelect = vi.fn(() => createQueryBuilder());

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

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
  });

  describe('without testType filter', () => {
    it('returns all questions when no testType is provided', async () => {
      const { result } = renderHook(() => useQuestions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(8);
      // Now using displayName for human-readable IDs
      expect(result.current.data?.map(q => q.displayName)).toEqual([
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
        id: 'uuid-t1a01',  // UUID
        displayName: 'T1A01',  // Human-readable ID
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
      expect(result.current.data?.every(q => q.displayName.startsWith('T'))).toBe(true);
      expect(result.current.data?.map(q => q.displayName)).toEqual(['T1A01', 'T1A02', 'T2A01']);
    });

    it('filters to only General questions when testType is "general"', async () => {
      const { result } = renderHook(() => useQuestions('general'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.every(q => q.displayName.startsWith('G'))).toBe(true);
      expect(result.current.data?.map(q => q.displayName)).toEqual(['G1A01', 'G1A02', 'G2A01']);
    });

    it('filters to only Extra questions when testType is "extra"', async () => {
      const { result } = renderHook(() => useQuestions('extra'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every(q => q.displayName.startsWith('E'))).toBe(true);
      expect(result.current.data?.map(q => q.displayName)).toEqual(['E1A01', 'E1A02']);
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
      setMockData([{ id: 'uuid-t1a01', display_name: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null, figure_url: null }]);

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('A');
    });

    it('maps correct_answer 1 to B', async () => {
      setMockData([{ id: 'uuid-t1a01', display_name: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 1, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null, figure_url: null }]);

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('B');
    });

    it('maps correct_answer 2 to C', async () => {
      setMockData([{ id: 'uuid-t1a01', display_name: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 2, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null, figure_url: null }]);

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('C');
    });

    it('maps correct_answer 3 to D', async () => {
      setMockData([{ id: 'uuid-t1a01', display_name: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 3, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null, figure_url: null }]);

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.correctAnswer).toBe('D');
    });
  });

  describe('error handling', () => {
    it('returns error state when query fails', async () => {
      setMockError(new Error('Database error'));

      const { result } = renderHook(() => useQuestions('technician'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });
  });

  describe('empty results', () => {
    it('returns empty array when no questions match filter', async () => {
      // Only have Technician questions in the database
      setMockData([
        { id: 'uuid-t1a01', display_name: 'T1A01', question: 'Tech Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null, figure_url: null },
      ]);

      // But request General questions - should get empty because server-side filtering returns no G* questions
      const { result } = renderHook(() => useQuestions('general'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(0);
    });
  });

  describe('forum_url handling', () => {
    it('transforms forum_url to forumUrl in camelCase', async () => {
      setMockData([
        { id: 'uuid-t1a01', display_name: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: 'https://forum.openhamprep.com/t/test/123', figure_url: null },
      ]);

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.forumUrl).toBe('https://forum.openhamprep.com/t/test/123');
    });

    it('handles null forum_url', async () => {
      setMockData([
        { id: 'uuid-t1a01', display_name: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null, figure_url: null },
      ]);

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.forumUrl).toBeNull();
    });

    it('preserves forum_url across different license types', async () => {
      const { result } = renderHook(() => useQuestions(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // T1A01 has forum_url, T1A02 does not
      const t1a01 = result.current.data?.find(q => q.displayName === 'T1A01');
      const t1a02 = result.current.data?.find(q => q.displayName === 'T1A02');
      const g1a02 = result.current.data?.find(q => q.displayName === 'G1A02');
      const e1a01 = result.current.data?.find(q => q.displayName === 'E1A01');

      expect(t1a01?.forumUrl).toBe('https://forum.openhamprep.com/t/t1a01-tech-q1/123');
      expect(t1a02?.forumUrl).toBeNull();
      expect(g1a02?.forumUrl).toBe('https://forum.openhamprep.com/t/g1a02-general-q2/200');
      expect(e1a01?.forumUrl).toBe('https://forum.openhamprep.com/t/e1a01-extra-q1/300');
    });

    it('includes forumUrl in Question interface', async () => {
      setMockData([
        { id: 'uuid-t1a01', display_name: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: 'Test explanation', forum_url: 'https://forum.openhamprep.com/t/test/456', figure_url: null },
      ]);

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
      setMockData([
        { id: 'uuid-e9b05', display_name: 'E9B05', question: 'What is shown in Figure E9-2?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'E9', question_group: 'E9B', links: [], explanation: null, forum_url: null, figure_url: 'https://storage.example.com/question-figures/E9B05.png' },
      ]);

      const { result } = renderHook(() => useQuestions('extra'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.figureUrl).toBe('https://storage.example.com/question-figures/E9B05.png');
    });

    it('handles null figure_url', async () => {
      setMockData([
        { id: 'uuid-t1a01', display_name: 'T1A01', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'T1', question_group: 'T1A', links: [], explanation: null, forum_url: null, figure_url: null },
      ]);

      const { result } = renderHook(() => useQuestions('technician'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.figureUrl).toBeNull();
    });

    it('preserves figure_url across different license types', async () => {
      const { result } = renderHook(() => useQuestions(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // T1A01 has no figure, T1A02 has figure
      const t1a01 = result.current.data?.find(q => q.displayName === 'T1A01');
      const t1a02 = result.current.data?.find(q => q.displayName === 'T1A02');
      const g1a02 = result.current.data?.find(q => q.displayName === 'G1A02');
      const e1a02 = result.current.data?.find(q => q.displayName === 'E1A02');

      expect(t1a01?.figureUrl).toBeNull();
      expect(t1a02?.figureUrl).toBe('https://storage.example.com/question-figures/T1A02.png');
      expect(g1a02?.figureUrl).toBe('https://storage.example.com/question-figures/G1A02.png');
      expect(e1a02?.figureUrl).toBe('https://storage.example.com/question-figures/E1A02.png');
    });

    it('includes figureUrl in Question interface', async () => {
      setMockData([
        { id: 'uuid-e9b05', display_name: 'E9B05', question: 'What is shown in Figure E9-2?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'E9', question_group: 'E9B', links: [], explanation: 'Antenna pattern explanation', forum_url: null, figure_url: 'https://storage.example.com/question-figures/E9B05.png' },
      ]);

      const { result } = renderHook(() => useQuestions('extra'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const question = result.current.data?.[0];
      // Verify figureUrl is included with other properties
      expect(question).toMatchObject({
        id: 'uuid-e9b05',
        displayName: 'E9B05',
        question: 'What is shown in Figure E9-2?',
        figureUrl: 'https://storage.example.com/question-figures/E9B05.png',
      });
    });

    it('handles question with both forumUrl and figureUrl', async () => {
      setMockData([
        {
          id: 'uuid-e9b05',
          display_name: 'E9B05',
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
      ]);

      const { result } = renderHook(() => useQuestions('extra'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const question = result.current.data?.[0];
      expect(question?.forumUrl).toBe('https://forum.openhamprep.com/t/e9b05/123');
      expect(question?.figureUrl).toBe('https://storage.example.com/question-figures/E9B05.png');
    });

    it('handles Supabase storage URLs correctly', async () => {
      const storageUrl = 'https://xyz.supabase.co/storage/v1/object/public/question-figures/E9B05.png';
      setMockData([
        { id: 'uuid-e9b05', display_name: 'E9B05', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'E9', question_group: 'E9B', links: [], explanation: null, forum_url: null, figure_url: storageUrl },
      ]);

      const { result } = renderHook(() => useQuestions('extra'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.figureUrl).toBe(storageUrl);
    });

    it('handles figure URLs with cache-busting query parameters', async () => {
      const urlWithParams = 'https://storage.example.com/question-figures/E9B05.png?t=1234567890';
      setMockData([
        { id: 'uuid-e9b05', display_name: 'E9B05', question: 'Q?', options: ['A', 'B', 'C', 'D'], correct_answer: 0, subelement: 'E9', question_group: 'E9B', links: [], explanation: null, forum_url: null, figure_url: urlWithParams },
      ]);

      const { result } = renderHook(() => useQuestions('extra'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]?.figureUrl).toBe(urlWithParams);
    });
  });
});

describe('useQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to first load questions into cache, then test useQuestion
  const renderWithPreloadedCache = async (questionId: string) => {
    const wrapper = createWrapper();

    // First, load all questions into cache
    const { result: questionsResult } = renderHook(() => useQuestions(), { wrapper });
    await waitFor(() => expect(questionsResult.current.isSuccess).toBe(true));

    // Now test useQuestion with the cache populated
    const { result } = renderHook(() => useQuestion(questionId), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    return result;
  };

  describe('fetching question by display_name', () => {
    it('returns the correct question when display_name is found in cache', async () => {
      const result = await renderWithPreloadedCache('T1A01');

      expect(result.current.data?.displayName).toBe('T1A01');
      expect(result.current.data?.question).toBe('Tech Q1?');
    });

    it('handles case-insensitive display_name IDs', async () => {
      const result = await renderWithPreloadedCache('t1a01');

      expect(result.current.data?.displayName).toBe('T1A01');
    });

    it('returns General question when display_name starts with G', async () => {
      const result = await renderWithPreloadedCache('G1A01');

      expect(result.current.data?.displayName).toBe('G1A01');
      expect(result.current.data?.question).toBe('General Q1?');
    });

    it('returns Extra question when display_name starts with E', async () => {
      const result = await renderWithPreloadedCache('E1A01');

      expect(result.current.data?.displayName).toBe('E1A01');
      expect(result.current.data?.question).toBe('Extra Q1?');
    });
  });

  describe('disabled query', () => {
    it('does not fetch when questionId is undefined', async () => {
      const { result } = renderHook(() => useQuestion(undefined), {
        wrapper: createWrapper(),
      });

      // Query should not be enabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('does not fetch when questionId is empty string', async () => {
      const { result } = renderHook(() => useQuestion(''), {
        wrapper: createWrapper(),
      });

      // Query should not be enabled when ID is empty
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('question transformation', () => {
    it('transforms question data correctly', async () => {
      const result = await renderWithPreloadedCache('T1A01');

      expect(result.current.data).toEqual({
        id: 'uuid-t1a01',  // UUID
        displayName: 'T1A01',  // Human-readable ID
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

    it('includes figureUrl when present', async () => {
      const result = await renderWithPreloadedCache('T1A02');

      expect(result.current.data?.figureUrl).toBe('https://storage.example.com/question-figures/T1A02.png');
    });
  });

  describe('query key', () => {
    it('uses unique query key per question ID', async () => {
      const wrapper = createWrapper();

      // Preload the cache
      const { result: questionsResult } = renderHook(() => useQuestions(), { wrapper });
      await waitFor(() => expect(questionsResult.current.isSuccess).toBe(true));

      const { result: result1 } = renderHook(() => useQuestion('T1A01'), { wrapper });
      await waitFor(() => expect(result1.current.data).toBeDefined());

      const { result: result2 } = renderHook(() => useQuestion('G1A01'), { wrapper });
      await waitFor(() => expect(result2.current.data).toBeDefined());

      // Both queries should succeed with different data
      expect(result1.current.data?.displayName).toBe('T1A01');
      expect(result2.current.data?.displayName).toBe('G1A01');
    });
  });
});
