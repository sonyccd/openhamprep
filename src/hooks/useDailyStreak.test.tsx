import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useDailyStreak, incrementDailyActivity } from './useDailyStreak';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

// Mock supabase
const mockRpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe('useDailyStreak', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  describe('Hook Data Fetching', () => {
    it('returns default values while loading', () => {
      mockRpc.mockReturnValue({
        single: () => new Promise(() => {}), // Never resolves
      });

      const { result } = renderHook(() => useDailyStreak(), {
        wrapper: createWrapper(),
      });

      expect(result.current.currentStreak).toBe(0);
      expect(result.current.longestStreak).toBe(0);
      expect(result.current.todayQualifies).toBe(false);
      expect(result.current.questionsToday).toBe(0);
      expect(result.current.questionsNeeded).toBe(5);
      expect(result.current.streakAtRisk).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });

    it('fetches streak data and returns correct values', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: {
            current_streak: 7,
            longest_streak: 10,
            last_activity_date: '2026-01-20',
            today_qualifies: true,
            questions_today: 8,
            questions_needed: 0,
            streak_at_risk: false,
          },
          error: null,
        }),
      });

      const { result } = renderHook(() => useDailyStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentStreak).toBe(7);
      expect(result.current.longestStreak).toBe(10);
      expect(result.current.todayQualifies).toBe(true);
      expect(result.current.questionsToday).toBe(8);
      expect(result.current.questionsNeeded).toBe(0);
      expect(result.current.streakAtRisk).toBe(false);
    });

    it('handles streak at risk state', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: {
            current_streak: 5,
            longest_streak: 5,
            last_activity_date: '2026-01-20',
            today_qualifies: false,
            questions_today: 2,
            questions_needed: 3,
            streak_at_risk: true,
          },
          error: null,
        }),
      });

      const { result } = renderHook(() => useDailyStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentStreak).toBe(5);
      expect(result.current.streakAtRisk).toBe(true);
      expect(result.current.questionsNeeded).toBe(3);
      expect(result.current.todayQualifies).toBe(false);
    });

    it('handles no streak state (new user)', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: {
            current_streak: 0,
            longest_streak: 0,
            last_activity_date: null,
            today_qualifies: false,
            questions_today: 0,
            questions_needed: 5,
            streak_at_risk: false,
          },
          error: null,
        }),
      });

      const { result } = renderHook(() => useDailyStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentStreak).toBe(0);
      expect(result.current.longestStreak).toBe(0);
      expect(result.current.lastActivityDate).toBeNull();
      expect(result.current.streakAtRisk).toBe(false);
    });

    it('handles error state gracefully', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const { result } = renderHook(() => useDailyStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Should still return safe defaults on error
      expect(result.current.currentStreak).toBe(0);
      expect(result.current.todayQualifies).toBe(false);
    });
  });

  describe('RPC Call', () => {
    it('calls get_streak_info with correct user id', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: {
            current_streak: 0,
            longest_streak: 0,
            last_activity_date: null,
            today_qualifies: false,
            questions_today: 0,
            questions_needed: 5,
            streak_at_risk: false,
          },
          error: null,
        }),
      });

      renderHook(() => useDailyStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('get_streak_info', {
          p_user_id: 'test-user-id',
        });
      });
    });
  });
});

describe('incrementDailyActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls increment_daily_activity RPC with correct parameters', async () => {
    mockRpc.mockReturnValue(Promise.resolve({ error: null }));

    const result = await incrementDailyActivity('user-123', {
      questions: 5,
      correct: 4,
    });

    expect(result).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('increment_daily_activity', {
      p_user_id: 'user-123',
      p_date: expect.any(String), // Today's date
      p_questions: 5,
      p_correct: 4,
      p_tests: 0,
      p_tests_passed: 0,
      p_glossary: 0,
    });
  });

  it('handles test completion tracking', async () => {
    mockRpc.mockReturnValue(Promise.resolve({ error: null }));

    await incrementDailyActivity('user-123', {
      questions: 35,
      correct: 30,
      tests: 1,
      testsPassed: 1,
    });

    expect(mockRpc).toHaveBeenCalledWith('increment_daily_activity', {
      p_user_id: 'user-123',
      p_date: expect.any(String),
      p_questions: 35,
      p_correct: 30,
      p_tests: 1,
      p_tests_passed: 1,
      p_glossary: 0,
    });
  });

  it('returns false on error', async () => {
    mockRpc.mockReturnValue(Promise.resolve({
      error: { message: 'Database error' },
    }));

    const result = await incrementDailyActivity('user-123', {
      questions: 1,
    });

    expect(result).toBe(false);
  });

  it('uses current date for activity', async () => {
    mockRpc.mockReturnValue(Promise.resolve({ error: null }));

    const today = new Date().toISOString().split('T')[0];

    await incrementDailyActivity('user-123', { questions: 1 });

    expect(mockRpc).toHaveBeenCalledWith(
      'increment_daily_activity',
      expect.objectContaining({
        p_date: today,
      })
    );
  });
});
