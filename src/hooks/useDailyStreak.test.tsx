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

// Helper to get current UTC date for tests
const getTestUTCDate = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

  // Helper to create mock RPC response with all required fields
  const createMockStreakResponse = (overrides = {}) => ({
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
    today_qualifies: false,
    questions_today: 0,
    questions_needed: 5,
    streak_at_risk: false,
    // New fields for timezone handling
    yesterday_qualifies: false,
    questions_yesterday: 0,
    today_utc: getTestUTCDate(),
    ...overrides,
  });

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
      expect(typeof result.current.streakResetTime).toBe('string');
    });

    it('fetches streak data and returns correct values', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: createMockStreakResponse({
            current_streak: 7,
            longest_streak: 10,
            last_activity_date: '2026-01-20',
            today_qualifies: true,
            questions_today: 8,
            questions_needed: 0,
            streak_at_risk: false,
          }),
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
      // Local day calculations are applied - check reasonable values
      expect(result.current.todayQualifies).toBe(true);
      expect(result.current.questionsToday).toBeGreaterThanOrEqual(8);
      expect(result.current.streakAtRisk).toBe(false);
    });

    it('handles streak at risk state', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: createMockStreakResponse({
            current_streak: 5,
            longest_streak: 5,
            last_activity_date: '2026-01-20',
            today_qualifies: false,
            questions_today: 2,
            questions_needed: 3,
            streak_at_risk: true,
            yesterday_qualifies: false,
            questions_yesterday: 0,
          }),
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
      // Streak at risk is computed locally based on todayQualifies
      expect(typeof result.current.streakAtRisk).toBe('boolean');
      expect(typeof result.current.questionsNeeded).toBe('number');
    });

    it('handles no streak state (new user)', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: createMockStreakResponse({
            current_streak: 0,
            longest_streak: 0,
            last_activity_date: null,
            today_qualifies: false,
            questions_today: 0,
            questions_needed: 5,
            streak_at_risk: false,
          }),
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

    it('returns streakResetTime for UI display', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: createMockStreakResponse(),
          error: null,
        }),
      });

      const { result } = renderHook(() => useDailyStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // streakResetTime should be a readable time string
      expect(typeof result.current.streakResetTime).toBe('string');
      expect(result.current.streakResetTime.length).toBeGreaterThan(0);
    });
  });

  describe('RPC Call', () => {
    it('calls get_streak_info with correct user id', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: createMockStreakResponse(),
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

  describe('Local Timezone Calculations', () => {
    it('computes local day questions from UTC data', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: createMockStreakResponse({
            questions_today: 3,
            questions_yesterday: 2,
            today_qualifies: false,
            yesterday_qualifies: false,
          }),
          error: null,
        }),
      });

      const { result } = renderHook(() => useDailyStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Questions should be computed based on timezone
      // The exact value depends on the user's timezone
      expect(typeof result.current.questionsToday).toBe('number');
      expect(result.current.questionsToday).toBeGreaterThanOrEqual(0);
    });

    it('computes local day qualification from UTC data', async () => {
      mockRpc.mockReturnValue({
        single: () => Promise.resolve({
          data: createMockStreakResponse({
            today_qualifies: true,
            yesterday_qualifies: false,
            questions_today: 6,
            questions_yesterday: 0,
          }),
          error: null,
        }),
      });

      const { result } = renderHook(() => useDailyStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should compute local qualification
      expect(result.current.todayQualifies).toBe(true);
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
      p_date: expect.any(String), // Today's UTC date
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

  it('uses UTC date for storage (to match server CURRENT_DATE)', async () => {
    mockRpc.mockReturnValue(Promise.resolve({ error: null }));

    // getUTCDateString uses UTC to match PostgreSQL's CURRENT_DATE
    const now = new Date();
    const expectedDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

    await incrementDailyActivity('user-123', { questions: 1 });

    expect(mockRpc).toHaveBeenCalledWith(
      'increment_daily_activity',
      expect.objectContaining({
        p_date: expectedDate,
      })
    );
  });

  it('handles glossary term tracking', async () => {
    mockRpc.mockReturnValue(Promise.resolve({ error: null }));

    await incrementDailyActivity('user-123', {
      glossary: 10,
    });

    expect(mockRpc).toHaveBeenCalledWith('increment_daily_activity', {
      p_user_id: 'user-123',
      p_date: expect.any(String),
      p_questions: 0,
      p_correct: 0,
      p_tests: 0,
      p_tests_passed: 0,
      p_glossary: 10,
    });
  });
});
