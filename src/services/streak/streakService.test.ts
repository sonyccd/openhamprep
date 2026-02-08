import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streakService } from './streakService';

// RPC mock — supabase.rpc() returns a builder with .single()
const mockSingle = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const userId = 'user-123';

beforeEach(() => {
  vi.clearAllMocks();
  // Default: rpc returns a builder with .single()
  mockRpc.mockReturnValue({ single: mockSingle });
});

const makeRawStreak = (overrides = {}) => ({
  current_streak: 5,
  longest_streak: 10,
  last_activity_date: '2024-06-15',
  today_qualifies: true,
  questions_today: 8,
  questions_needed: 0,
  streak_at_risk: false,
  yesterday_qualifies: true,
  questions_yesterday: 12,
  today_utc: '2024-06-16',
  ...overrides,
});

describe('StreakService', () => {
  describe('getStreakInfo', () => {
    it('returns raw streak data on success', async () => {
      const mockData = makeRawStreak();
      mockSingle.mockResolvedValue({ data: mockData, error: null });

      const result = await streakService.getStreakInfo(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.current_streak).toBe(5);
        expect(result.data.longest_streak).toBe(10);
        expect(result.data.today_qualifies).toBe(true);
      }
      expect(mockRpc).toHaveBeenCalledWith('get_streak_info', { p_user_id: userId });
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await streakService.getStreakInfo('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('returns failure on RPC error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'function not found', code: '42883', details: '', hint: '' },
      });

      const result = await streakService.getStreakInfo(userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('incrementActivity', () => {
    it('calls increment_daily_activity RPC with correct params', async () => {
      // For void mutations, rpc returns a thenable directly (no .single())
      mockRpc.mockResolvedValue({ error: null });

      const result = await streakService.incrementActivity(userId, '2024-06-16', {
        questions: 5,
        correct: 3,
        tests: 1,
        testsPassed: 1,
        glossary: 0,
      });

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('increment_daily_activity', {
        p_user_id: userId,
        p_date: '2024-06-16',
        p_questions: 5,
        p_correct: 3,
        p_tests: 1,
        p_tests_passed: 1,
        p_glossary: 0,
      });
    });

    it('defaults optional options to 0', async () => {
      mockRpc.mockResolvedValue({ error: null });

      const result = await streakService.incrementActivity(userId, '2024-06-16', {
        questions: 1,
      });

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('increment_daily_activity', {
        p_user_id: userId,
        p_date: '2024-06-16',
        p_questions: 1,
        p_correct: 0,
        p_tests: 0,
        p_tests_passed: 0,
        p_glossary: 0,
      });
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await streakService.incrementActivity('', '2024-06-16', { questions: 1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('returns failure on RPC error', async () => {
      mockRpc.mockResolvedValue({
        error: { message: 'connection refused', code: '08006', details: '', hint: '' },
      });

      const result = await streakService.incrementActivity(userId, '2024-06-16', {
        questions: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });
});
