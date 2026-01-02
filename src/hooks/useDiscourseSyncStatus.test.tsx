import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useDiscourseSyncStatus } from './useDiscourseSyncStatus';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock overview data
const mockOverviewData = [
  {
    license_type: 'Technician',
    total_questions: 423,
    with_forum_url: 400,
    without_forum_url: 23,
    synced: 380,
    errors: 5,
    pending: 10,
    needs_verification: 5,
  },
  {
    license_type: 'General',
    total_questions: 462,
    with_forum_url: 450,
    without_forum_url: 12,
    synced: 440,
    errors: 2,
    pending: 5,
    needs_verification: 3,
  },
  {
    license_type: 'Extra',
    total_questions: 712,
    with_forum_url: 700,
    without_forum_url: 12,
    synced: 690,
    errors: 3,
    pending: 4,
    needs_verification: 3,
  },
];

// Mock verify result
const mockVerifyResult = {
  success: true,
  action: 'verify',
  summary: {
    totalQuestionsInDb: 1597,
    totalTopicsInDiscourse: 1550,
    questionsWithForumUrl: 1550,
    questionsWithoutForumUrl: 47,
    syncedCorrectly: 1510,
  },
  discrepancies: {
    orphanedInDiscourse: [
      {
        questionDisplayName: 'T1A05',
        topicId: 123,
        topicUrl: 'https://forum.example.com/t/t1a05/123',
      },
    ],
    brokenForumUrl: [],
    missingStatus: [
      {
        questionId: 'uuid-t1a06',
        questionDisplayName: 'T1A06',
        forumUrl: 'https://forum.example.com/t/t1a06/124',
      },
    ],
  },
};

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

describe('useDiscourseSyncStatus', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: { rpc: any; functions: { invoke: any } };
  let mockRpc: ReturnType<typeof vi.fn>;
  let mockInvoke: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the mocked supabase
    const module = await import('@/integrations/supabase/client');
    supabase = module.supabase;

    // Setup the mock chain
    mockRpc = vi.fn().mockResolvedValue({ data: mockOverviewData, error: null });
    mockInvoke = vi.fn().mockResolvedValue({ data: mockVerifyResult, error: null });

    vi.mocked(supabase.rpc).mockImplementation(mockRpc);
    vi.mocked(supabase.functions.invoke).mockImplementation(mockInvoke);
  });

  describe('overview query', () => {
    it('fetches overview data on mount', async () => {
      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.overview).toEqual(mockOverviewData);
    });

    it('returns error state when query fails', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });

    it('returns error when accessed by non-admin user', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Access denied: admin role required' },
      });

      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toHaveProperty('message', 'Access denied: admin role required');
    });
  });

  describe('totals computation', () => {
    it('computes totals correctly from overview data', async () => {
      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.totals).toEqual({
        totalQuestions: 1597, // 423 + 462 + 712
        withForumUrl: 1550, // 400 + 450 + 700
        withoutForumUrl: 47, // 23 + 12 + 12
        synced: 1510, // 380 + 440 + 690
        errors: 10, // 5 + 2 + 3
        pending: 19, // 10 + 5 + 4
        needsVerification: 11, // 5 + 3 + 3
      });
    });

    it('returns undefined totals when overview is loading', () => {
      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      // While loading, totals should be undefined
      expect(result.current.isLoading).toBe(true);
      expect(result.current.totals).toBeUndefined();
    });

    it('handles empty overview data', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.overview).toEqual([]);
      // totals reduce on empty array produces the initial values
      expect(result.current.totals).toEqual({
        totalQuestions: 0,
        withForumUrl: 0,
        withoutForumUrl: 0,
        synced: 0,
        errors: 0,
        pending: 0,
        needsVerification: 0,
      });
    });
  });

  describe('verify mutation', () => {
    it('calls verify-discourse-sync with verify action', async () => {
      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.verify.mutateAsync();
      });

      expect(mockInvoke).toHaveBeenCalledWith('verify-discourse-sync', {
        body: { action: 'verify', license: undefined },
      });
    });

    it('passes license filter when provided', async () => {
      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.verify.mutateAsync('technician');
      });

      expect(mockInvoke).toHaveBeenCalledWith('verify-discourse-sync', {
        body: { action: 'verify', license: 'technician' },
      });
    });

    it('returns verification result on success', async () => {
      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let verifyResult;
      await act(async () => {
        verifyResult = await result.current.verify.mutateAsync();
      });

      expect(verifyResult).toEqual(mockVerifyResult);
    });

    it('throws error on verification failure', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Edge function error' },
      });

      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => {
          await result.current.verify.mutateAsync();
        })
      ).rejects.toEqual({ message: 'Edge function error' });
    });
  });

  describe('repair mutation', () => {
    it('calls verify-discourse-sync with repair action', async () => {
      const repairResult = { ...mockVerifyResult, action: 'repair', repaired: 5 };
      mockInvoke.mockResolvedValueOnce({ data: repairResult, error: null });

      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.repair.mutateAsync();
      });

      expect(mockInvoke).toHaveBeenCalledWith('verify-discourse-sync', {
        body: { action: 'repair', license: undefined },
      });
    });

    it('passes license filter when provided', async () => {
      const repairResult = { ...mockVerifyResult, action: 'repair', repaired: 3 };
      mockInvoke.mockResolvedValueOnce({ data: repairResult, error: null });

      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.repair.mutateAsync('general');
      });

      expect(mockInvoke).toHaveBeenCalledWith('verify-discourse-sync', {
        body: { action: 'repair', license: 'general' },
      });
    });

    it('returns repair result with repaired count', async () => {
      const repairResult = { ...mockVerifyResult, action: 'repair', repaired: 5 };
      mockInvoke.mockResolvedValueOnce({ data: repairResult, error: null });

      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let resultData: typeof repairResult | undefined;
      await act(async () => {
        resultData = await result.current.repair.mutateAsync();
      });

      expect(resultData).toEqual(repairResult);
      expect(resultData?.repaired).toBe(5);
    });
  });

  describe('refreshOverview', () => {
    it('invalidates the overview query', async () => {
      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Clear mocks to track new calls
      mockRpc.mockClear();

      act(() => {
        result.current.refreshOverview();
      });

      // The query should be invalidated and refetched
      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalled();
      });
    });
  });

  describe('return value structure', () => {
    it('returns all expected properties', async () => {
      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current).toHaveProperty('overview');
      expect(result.current).toHaveProperty('totals');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('verify');
      expect(result.current).toHaveProperty('repair');
      expect(result.current).toHaveProperty('refreshOverview');
    });

    it('verify and repair are mutation objects', async () => {
      const { result } = renderHook(() => useDiscourseSyncStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.verify).toHaveProperty('mutateAsync');
      expect(result.current.verify).toHaveProperty('isPending');
      expect(result.current.repair).toHaveProperty('mutateAsync');
      expect(result.current.repair).toHaveProperty('isPending');
    });
  });
});
