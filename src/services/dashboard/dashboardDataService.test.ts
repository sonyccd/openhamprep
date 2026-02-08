import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardDataService } from './dashboardDataService';

// Chainable Supabase mock
let mockResult: { data?: unknown; error: unknown };

const chain: Record<string, ReturnType<typeof vi.fn>> & {
  then?: (resolve: (v: unknown) => void) => void;
} = {} as never;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => chain,
  },
}));

function buildChain() {
  const methods = [
    'select', 'eq', 'in', 'order', 'single', 'maybeSingle',
  ];

  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }

  chain.then = (resolve: (v: unknown) => void) => resolve(mockResult);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResult = { data: null, error: null };
  buildChain();
});

const userId = 'user-123';

describe('DashboardDataService', () => {
  describe('getTestResults', () => {
    it('returns test results filtered by test types', async () => {
      const mockResults = [
        { id: 'r1', user_id: userId, score: 30, percentage: 85.7, passed: true },
        { id: 'r2', user_id: userId, score: 28, percentage: 80.0, passed: true },
      ];
      mockResult = { data: mockResults, error: null };

      const result = await dashboardDataService.getTestResults(userId, ['technician', 'practice']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
      expect(chain.in).toHaveBeenCalledWith('test_type', ['technician', 'practice']);
    });

    it('returns empty array when no results exist', async () => {
      mockResult = { data: null, error: null };

      const result = await dashboardDataService.getTestResults(userId, ['technician']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await dashboardDataService.getTestResults('', ['technician']);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });

    it('returns failure on database error', async () => {
      mockResult = {
        data: null,
        error: { message: 'permission denied', code: '42501', details: '', hint: '' },
      };

      const result = await dashboardDataService.getTestResults(userId, ['technician']);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('getAttemptsWithDisplayName', () => {
    it('returns attempts with flattened display_name', async () => {
      const mockAttempts = [
        {
          id: 'a1',
          user_id: userId,
          question_id: 'q1',
          is_correct: true,
          attempt_type: 'practice_test',
          attempted_at: '2024-01-01',
          questions: { display_name: 'T1A01' },
        },
      ];
      mockResult = { data: mockAttempts, error: null };

      const result = await dashboardDataService.getAttemptsWithDisplayName(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].display_name).toBe('T1A01');
      }
    });

    it('returns empty array when no attempts exist', async () => {
      mockResult = { data: null, error: null };

      const result = await dashboardDataService.getAttemptsWithDisplayName(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await dashboardDataService.getAttemptsWithDisplayName('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });
  });

  describe('getProfileStats', () => {
    it('returns profile stats', async () => {
      mockResult = { data: { best_streak: 7 }, error: null };

      const result = await dashboardDataService.getProfileStats(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ best_streak: 7 });
      }
    });

    it('returns null when profile stats dont exist', async () => {
      mockResult = { data: null, error: null };

      const result = await dashboardDataService.getProfileStats(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await dashboardDataService.getProfileStats('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });
  });

  describe('getFullProfile', () => {
    it('returns full profile data', async () => {
      const mockProfile = {
        id: userId,
        display_name: 'Test User',
        forum_username: null,
        best_streak: 5,
      };
      mockResult = { data: mockProfile, error: null };

      const result = await dashboardDataService.getFullProfile(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.display_name).toBe('Test User');
      }
    });

    it('returns NOT_FOUND when profile does not exist', async () => {
      mockResult = { data: null, error: null };

      const result = await dashboardDataService.getFullProfile(userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await dashboardDataService.getFullProfile('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });

    it('returns failure on database error', async () => {
      mockResult = {
        data: null,
        error: { message: 'not found', code: 'PGRST116', details: '', hint: '' },
      };

      const result = await dashboardDataService.getFullProfile(userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
