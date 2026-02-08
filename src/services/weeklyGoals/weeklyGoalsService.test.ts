import { describe, it, expect, vi, beforeEach } from 'vitest';
import { weeklyGoalsService } from './weeklyGoalsService';

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
    'select', 'insert', 'update', 'upsert',
    'eq', 'single', 'maybeSingle',
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

describe('WeeklyGoalsService', () => {
  describe('getGoals', () => {
    it('returns goals when they exist', async () => {
      const mockGoals = {
        user_id: userId,
        questions_goal: 100,
        tests_goal: 3,
      };
      mockResult = { data: mockGoals, error: null };

      const result = await weeklyGoalsService.getGoals(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockGoals);
      }
    });

    it('returns null when no goals exist', async () => {
      mockResult = { data: null, error: null };

      const result = await weeklyGoalsService.getGoals(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await weeklyGoalsService.getGoals('');

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

      const result = await weeklyGoalsService.getGoals(userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('upsertGoals', () => {
    it('upserts goals successfully', async () => {
      mockResult = { error: null };

      const result = await weeklyGoalsService.upsertGoals(userId, 150, 4);

      expect(result.success).toBe(true);
      expect(chain.upsert).toHaveBeenCalledWith(
        {
          user_id: userId,
          questions_goal: 150,
          tests_goal: 4,
        },
        { onConflict: 'user_id' }
      );
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await weeklyGoalsService.upsertGoals('', 50, 2);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });

    it('returns failure on database error', async () => {
      mockResult = {
        error: { message: 'check violation', code: '23514', details: '', hint: '' },
      };

      const result = await weeklyGoalsService.upsertGoals(userId, 50, 2);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });
});
