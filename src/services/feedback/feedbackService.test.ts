import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedbackService } from './feedbackService';

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
    'select', 'insert', 'delete', 'update', 'upsert',
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
const questionId = 'T1A01';

describe('FeedbackService', () => {
  describe('getUserFeedback', () => {
    it('returns feedback when it exists', async () => {
      mockResult = { data: { is_helpful: true }, error: null };

      const result = await feedbackService.getUserFeedback(questionId, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ is_helpful: true });
      }
      expect(chain.select).toHaveBeenCalledWith('is_helpful');
      expect(chain.maybeSingle).toHaveBeenCalled();
    });

    it('returns null when no feedback exists', async () => {
      mockResult = { data: null, error: null };

      const result = await feedbackService.getUserFeedback(questionId, userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await feedbackService.getUserFeedback(questionId, '');

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

      const result = await feedbackService.getUserFeedback(questionId, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('submitFeedback', () => {
    it('upserts feedback with correct conflict target', async () => {
      mockResult = { error: null };

      const result = await feedbackService.submitFeedback(questionId, userId, true);

      expect(result.success).toBe(true);
      expect(chain.upsert).toHaveBeenCalledWith(
        {
          question_id: questionId,
          user_id: userId,
          is_helpful: true,
        },
        { onConflict: 'question_id,user_id' }
      );
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await feedbackService.submitFeedback(questionId, '', true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });

    it('returns failure on database error', async () => {
      mockResult = {
        error: { message: 'constraint violation', code: '23514', details: '', hint: '' },
      };

      const result = await feedbackService.submitFeedback(questionId, userId, true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('removeFeedback', () => {
    it('deletes feedback successfully', async () => {
      mockResult = { error: null };

      const result = await feedbackService.removeFeedback(questionId, userId);

      expect(result.success).toBe(true);
      expect(chain.delete).toHaveBeenCalled();
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await feedbackService.removeFeedback(questionId, '');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });

    it('returns failure on database error', async () => {
      mockResult = {
        error: { message: 'permission denied', code: '42501', details: '', hint: '' },
      };

      const result = await feedbackService.removeFeedback(questionId, userId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('getAllFeedback', () => {
    it('returns all feedback records', async () => {
      const records = [
        { question_id: 'T1A01', is_helpful: true },
        { question_id: 'T1A02', is_helpful: false },
        { question_id: 'T1A01', is_helpful: false },
      ];

      mockResult = { data: records, error: null };

      const result = await feedbackService.getAllFeedback();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(3);
      }
      expect(chain.select).toHaveBeenCalledWith('question_id, is_helpful');
    });

    it('returns empty array when no feedback exists', async () => {
      mockResult = { data: null, error: null };

      const result = await feedbackService.getAllFeedback();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('returns failure on database error', async () => {
      mockResult = {
        data: null,
        error: { message: 'internal error', code: '50000', details: '', hint: '' },
      };

      const result = await feedbackService.getAllFeedback();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });
});
