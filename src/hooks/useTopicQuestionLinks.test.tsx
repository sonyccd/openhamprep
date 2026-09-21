import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAllQuestionsForLinking, useTopicQuestionLinkMutations } from './useTopicQuestionLinks';
import { queryKeys } from '@/services/queryKeys';

const mockRange = vi.fn();
const mockInsert = vi.fn();
const mockDeleteEq = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) =>
      table === 'questions'
        ? { select: () => ({ order: () => ({ range: (...args: unknown[]) => mockRange(...args) }) }) }
        : {
            insert: (...args: unknown[]) => mockInsert(...args),
            delete: () => ({ eq: (...a: unknown[]) => ({ eq: (...b: unknown[]) => mockDeleteEq(...a, ...b) }) }),
          },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const row = (i: number) => ({ id: `id-${i}`, display_name: `T${i}`, question: `q${i}` });
const page = (n: number, offset = 0) => Array.from({ length: n }, (_, i) => row(offset + i));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

describe('useAllQuestionsForLinking', () => {
  beforeEach(() => vi.clearAllMocks());

  /** PostgREST caps a response at 1000 rows; the bank is larger than that. */
  it('keeps paging while a page comes back full', async () => {
    mockRange
      .mockResolvedValueOnce({ data: page(1000), error: null })
      .mockResolvedValueOnce({ data: page(1000, 1000), error: null })
      .mockResolvedValueOnce({ data: page(7, 2000), error: null });

    const { result } = renderHook(() => useAllQuestionsForLinking(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRange.mock.calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
    expect(result.current.data).toHaveLength(2007);
  });

  it('stops after one short page', async () => {
    mockRange.mockResolvedValueOnce({ data: page(3), error: null });

    const { result } = renderHook(() => useAllQuestionsForLinking(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRange).toHaveBeenCalledTimes(1);
    expect(result.current.data).toHaveLength(3);
  });

  it('stops on an empty first page', async () => {
    mockRange.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useAllQuestionsForLinking(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useTopicQuestionLinkMutations', () => {
  const setUp = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(client, 'invalidateQueries');
    const w = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useTopicQuestionLinkMutations('topic-1'), { wrapper: w });
    return { result, invalidated: () => spy.mock.calls.map((c) => c[0]?.queryKey) };
  };

  const expectRefreshed = (keys: unknown[]) => {
    expect(keys).toContainEqual(queryKeys.topics.linkedQuestionIds('topic-1'));
    expect(keys).toContainEqual(queryKeys.topics.questions('topic-1'));
    expect(keys).toContainEqual(queryKeys.questions.admin());
  };

  it('refreshes the topic and admin question lists after a link', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const { result, invalidated } = setUp();

    result.current.linkQuestion.mutate('q-1');

    await waitFor(() => expect(result.current.linkQuestion.isSuccess).toBe(true));
    expect(mockInsert).toHaveBeenCalledWith({ topic_id: 'topic-1', question_id: 'q-1' });
    expectRefreshed(invalidated());
  });

  it('refreshes the same lists after an unlink, scoped to the topic and question', async () => {
    mockDeleteEq.mockResolvedValue({ error: null });
    const { result, invalidated } = setUp();

    result.current.unlinkQuestion.mutate('q-1');

    await waitFor(() => expect(result.current.unlinkQuestion.isSuccess).toBe(true));
    expect(mockDeleteEq).toHaveBeenCalledWith('topic_id', 'topic-1', 'question_id', 'q-1');
    expectRefreshed(invalidated());
  });
});
