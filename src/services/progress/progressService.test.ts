import { describe, it, expect, vi, beforeEach } from 'vitest';
import { progressService } from './progressService';

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
    'select', 'insert', 'delete', 'update',
    'eq', 'order', 'single', 'maybeSingle', 'in', 'like', 'ilike',
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

describe('ProgressService', () => {
  describe('createTestResult', () => {
    it('inserts a test result and returns the row', async () => {
      const mockRow = {
        id: 'tr-1',
        user_id: userId,
        score: 30,
        total_questions: 35,
        percentage: 86,
        passed: true,
        test_type: 'technician',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockResult = { data: mockRow, error: null };

      const result = await progressService.createTestResult({
        userId,
        score: 30,
        totalQuestions: 35,
        percentage: 86,
        passed: true,
        testType: 'technician',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockRow);
        expect(result.data.id).toBe('tr-1');
      }
      expect(chain.insert).toHaveBeenCalledWith({
        user_id: userId,
        score: 30,
        total_questions: 35,
        percentage: 86,
        passed: true,
        test_type: 'technician',
      });
      expect(chain.select).toHaveBeenCalled();
      expect(chain.single).toHaveBeenCalled();
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await progressService.createTestResult({
        userId: '',
        score: 30,
        totalQuestions: 35,
        percentage: 86,
        passed: true,
        testType: 'technician',
      });

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

      const result = await progressService.createTestResult({
        userId,
        score: 30,
        totalQuestions: 35,
        percentage: 86,
        passed: true,
        testType: 'technician',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('createAttempts', () => {
    it('bulk inserts attempt records', async () => {
      mockResult = { error: null };

      const records = [
        {
          user_id: userId,
          question_id: 'T1A01',
          selected_answer: 0,
          is_correct: true,
          attempt_type: 'practice_test',
          test_result_id: 'tr-1',
        },
        {
          user_id: userId,
          question_id: 'T1A02',
          selected_answer: 2,
          is_correct: false,
          attempt_type: 'practice_test',
          test_result_id: 'tr-1',
        },
      ];

      const result = await progressService.createAttempts(records);

      expect(result.success).toBe(true);
      expect(chain.insert).toHaveBeenCalledWith(records);
    });

    it('returns success for empty array without calling Supabase', async () => {
      const result = await progressService.createAttempts([]);

      expect(result.success).toBe(true);
      expect(chain.insert).not.toHaveBeenCalled();
    });

    it('returns failure on database error', async () => {
      mockResult = {
        error: { message: 'not null violation', code: '23502', details: '', hint: '' },
      };

      const result = await progressService.createAttempts([
        {
          user_id: userId,
          question_id: 'T1A01',
          selected_answer: 0,
          is_correct: true,
          attempt_type: 'random_practice',
        },
      ]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });
});
