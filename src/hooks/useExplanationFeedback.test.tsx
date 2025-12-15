import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock useAuth
const mockUser = { id: 'user-123', email: 'test@example.com' };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}));

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
      delete: mockDelete,
    })),
  },
}));

import { useExplanationFeedback, useExplanationFeedbackStats } from './useExplanationFeedback';
import { useAuth } from '@/hooks/useAuth';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useExplanationFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the useAuth mock to return a user by default
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as ReturnType<typeof useAuth>);

    // Default mock chain for select query
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    // Default mock for upsert
    mockUpsert.mockResolvedValue({ error: null });

    // Default mock for delete
    mockDelete.mockReturnValue({ eq: mockEq });
  });

  describe('userFeedback query', () => {
    it('returns null when questionId is not provided', async () => {
      const { result } = renderHook(() => useExplanationFeedback(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.userFeedback).toBe(undefined);
      });
    });

    it('returns null when user is not logged in', async () => {
      vi.mocked(useAuth).mockReturnValueOnce({ user: null } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useExplanationFeedback('question-1'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.userFeedback).toBe(undefined);
      });
    });

    it('fetches user feedback when questionId and user are present', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: { is_helpful: true }, error: null });

      const { result } = renderHook(() => useExplanationFeedback('question-1'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.userFeedback).toEqual({ is_helpful: true });
      });

      expect(mockSelect).toHaveBeenCalledWith('is_helpful');
    });
  });

  describe('submitFeedback mutation', () => {
    it('provides submitFeedback function', () => {
      const { result } = renderHook(() => useExplanationFeedback('question-1'), {
        wrapper: createWrapper()
      });

      expect(result.current.submitFeedback).toBeDefined();
      expect(typeof result.current.submitFeedback.mutate).toBe('function');
    });

    it('calls upsert with correct data', async () => {
      mockUpsert.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useExplanationFeedback('question-1'), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.submitFeedback.mutateAsync({
          question_id: 'question-1',
          is_helpful: true,
        });
      });

      expect(mockUpsert).toHaveBeenCalledWith(
        {
          question_id: 'question-1',
          user_id: 'user-123',
          is_helpful: true,
        },
        { onConflict: 'question_id,user_id' }
      );
    });

    it('throws error when user is not logged in', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useExplanationFeedback('question-1'), {
        wrapper: createWrapper()
      });

      await expect(
        result.current.submitFeedback.mutateAsync({
          question_id: 'question-1',
          is_helpful: true,
        })
      ).rejects.toThrow('Must be logged in');
    });
  });

  describe('removeFeedback mutation', () => {
    it('provides removeFeedback function', () => {
      const { result } = renderHook(() => useExplanationFeedback('question-1'), {
        wrapper: createWrapper()
      });

      expect(result.current.removeFeedback).toBeDefined();
      expect(typeof result.current.removeFeedback.mutate).toBe('function');
    });

    it('calls delete with correct question_id', async () => {
      mockEq.mockReturnValue({ eq: mockEq, error: null });

      const { result } = renderHook(() => useExplanationFeedback('question-1'), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.removeFeedback.mutateAsync('question-1');
      });

      expect(mockDelete).toHaveBeenCalled();
    });

    it('throws error when user is not logged in', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useExplanationFeedback('question-1'), {
        wrapper: createWrapper()
      });

      await expect(
        result.current.removeFeedback.mutateAsync('question-1')
      ).rejects.toThrow('Must be logged in');
    });
  });
});

describe('useExplanationFeedbackStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue({ data: [], error: null });
  });

  it('fetches and aggregates feedback stats', async () => {
    mockSelect.mockResolvedValueOnce({
      data: [
        { question_id: 'q1', is_helpful: true },
        { question_id: 'q1', is_helpful: true },
        { question_id: 'q1', is_helpful: false },
        { question_id: 'q2', is_helpful: false },
        { question_id: 'q2', is_helpful: false },
      ],
      error: null,
    });

    const { result } = renderHook(() => useExplanationFeedbackStats(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toEqual({
      q1: { helpful: 2, notHelpful: 1 },
      q2: { helpful: 0, notHelpful: 2 },
    });
  });

  it('returns empty object when no feedback exists', async () => {
    mockSelect.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useExplanationFeedbackStats(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({});
    });
  });

  it('handles single feedback entry', async () => {
    mockSelect.mockResolvedValueOnce({
      data: [{ question_id: 'q1', is_helpful: true }],
      error: null,
    });

    const { result } = renderHook(() => useExplanationFeedbackStats(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({
        q1: { helpful: 1, notHelpful: 0 },
      });
    });
  });
});
