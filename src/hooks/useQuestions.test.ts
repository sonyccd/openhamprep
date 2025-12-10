import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuestions, usePracticeQuestions, useRandomQuestion } from './useQuestions';
import type { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
    })),
  },
}));

const mockQuestions = [
  {
    id: 'T1A01',
    question: 'What is the maximum transmitting power?',
    options: ['200 watts', '1000 watts', '1500 watts', '2000 watts'],
    correct_answer: 0,
    subelement: 'T1',
    question_group: 'T1A',
    links: [],
    explanation: 'Maximum power explanation',
  },
  {
    id: 'T1A02',
    question: 'What is the frequency range?',
    options: ['10 MHz', '20 MHz', '30 MHz', '40 MHz'],
    correct_answer: 1,
    subelement: 'T1',
    question_group: 'T1A',
    links: [],
    explanation: null,
  },
  {
    id: 'G1A01',
    question: 'General class question?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct_answer: 2,
    subelement: 'G1',
    question_group: 'G1A',
    links: [
      {
        url: 'https://example.com',
        title: 'Example',
        description: 'Test link',
        image: 'https://example.com/image.jpg',
        type: 'article' as const,
        siteName: 'Example Site',
      },
    ],
    explanation: 'General explanation',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
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

  it('fetches and transforms questions successfully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockSelect = vi.fn().mockResolvedValue({
      data: mockQuestions,
      error: null,
    });
    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data![0]).toMatchObject({
      id: 'T1A01',
      question: 'What is the maximum transmitting power?',
      options: {
        A: '200 watts',
        B: '1000 watts',
        C: '1500 watts',
        D: '2000 watts',
      },
      correctAnswer: 'A',
      subelement: 'T1',
      group: 'T1A',
    });
  });

  it('transforms correct_answer index to letter correctly', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockQuestions,
        error: null,
      }),
    });

    const { result } = renderHook(() => useQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].correctAnswer).toBe('A'); // correct_answer: 0
    expect(result.current.data![1].correctAnswer).toBe('B'); // correct_answer: 1
    expect(result.current.data![2].correctAnswer).toBe('C'); // correct_answer: 2
  });

  it('handles empty links array', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockQuestions,
        error: null,
      }),
    });

    const { result } = renderHook(() => useQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].links).toEqual([]);
    expect(result.current.data![2].links).toHaveLength(1);
  });

  it('handles errors from Supabase', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockError = new Error('Database error');
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    });

    const { result } = renderHook(() => useQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('caches data for 1 hour', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockSelect = vi.fn().mockResolvedValue({
      data: mockQuestions,
      error: null,
    });
    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });

    const wrapper = createWrapper();
    const { result, rerender } = renderHook(() => useQuestions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Rerender should use cache
    rerender();
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });
});

describe('usePracticeQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns shuffled subset of questions', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockQuestions,
        error: null,
      }),
    });

    const { result } = renderHook(() => usePracticeQuestions(2), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.questions).toHaveLength(2));

    expect(result.current.questions).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
  });

  it('defaults to 35 questions', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const manyQuestions = Array.from({ length: 50 }, (_, i) => ({
      ...mockQuestions[0],
      id: `T${i}`,
    }));
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: manyQuestions,
        error: null,
      }),
    });

    const { result } = renderHook(() => usePracticeQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.questions.length).toBe(35));

    expect(result.current.questions).toHaveLength(35);
  });

  it('returns empty array when no data', () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('No data'),
      }),
    });

    const { result } = renderHook(() => usePracticeQuestions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.questions).toEqual([]);
  });
});

describe('useRandomQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('returns a function to get random questions', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockQuestions,
        error: null,
      }),
    });

    const { result } = renderHook(() => useRandomQuestion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.allQuestions).toBeDefined());

    const randomQ = result.current.getRandomQuestion();
    expect(randomQ).toBeDefined();
    expect(mockQuestions.some((q) => q.id === randomQ!.id)).toBe(true);
  });

  it('excludes specified question IDs', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockQuestions,
        error: null,
      }),
    });

    const excludeIds = ['T1A01', 'T1A02'];
    const { result } = renderHook(() => useRandomQuestion(excludeIds), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.allQuestions).toBeDefined());

    const randomQ = result.current.getRandomQuestion();
    expect(randomQ).toBeDefined();
    expect(excludeIds).not.toContain(randomQ!.id);
  });

  it('resets when all questions are excluded', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockQuestions,
        error: null,
      }),
    });

    const excludeIds = mockQuestions.map((q) => q.id);
    const { result } = renderHook(() => useRandomQuestion(excludeIds), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.allQuestions).toBeDefined());

    const randomQ = result.current.getRandomQuestion();
    expect(randomQ).toBeDefined();
    // Should still return a question even though all are excluded
  });

  it('returns null when no questions available', () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    });

    const { result } = renderHook(() => useRandomQuestion(), {
      wrapper: createWrapper(),
    });

    const randomQ = result.current.getRandomQuestion();
    expect(randomQ).toBeNull();
  });
});
