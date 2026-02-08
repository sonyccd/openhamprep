import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readinessService } from './readinessService';

// Mock supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockFrom = vi.fn();
const mockGetSession = vi.fn();
const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { getSession: () => mockGetSession() },
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}));

const userId = 'user-123';
const examType = 'technician' as const;

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
});

const makeReadinessData = (overrides = {}) => ({
  id: 'r1',
  user_id: userId,
  exam_type: examType,
  recent_accuracy: 0.85,
  overall_accuracy: 0.80,
  coverage: 0.60,
  mastery: 0.55,
  tests_passed: 3,
  tests_taken: 5,
  last_study_at: '2024-01-01',
  readiness_score: 72,
  pass_probability: 0.78,
  expected_exam_score: 28,
  subelement_metrics: {},
  total_attempts: 100,
  unique_questions_seen: 50,
  config_version: 'v1',
  calculated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('ReadinessService', () => {
  describe('getScore', () => {
    it('returns readiness data on success', async () => {
      const mockData = makeReadinessData();
      mockMaybeSingle.mockResolvedValue({ data: mockData, error: null });

      const result = await readinessService.getScore(userId, examType);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockData);
        expect(result.data!.readiness_score).toBe(72);
      }
      expect(mockFrom).toHaveBeenCalledWith('user_readiness_cache');
    });

    it('returns null when no cache exists', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await readinessService.getScore(userId, examType);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await readinessService.getScore('', examType);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });

    it('returns failure on database error', async () => {
      const dbError = {
        message: 'permission denied',
        code: '42501',
        details: '',
        hint: '',
      };
      mockMaybeSingle.mockResolvedValue({ data: null, error: dbError });

      const result = await readinessService.getScore(userId, examType);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('recalculate', () => {
    it('succeeds when edge function returns success: true', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });
      mockInvoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await readinessService.recalculate(examType);

      expect(result.success).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('calculate-readiness', {
        body: { exam_type: examType },
      });
    });

    it('returns AUTH_REQUIRED when not authenticated', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });

      const result = await readinessService.recalculate(examType);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('returns failure when edge function errors', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });
      mockInvoke.mockResolvedValue({
        data: null,
        error: new Error('Edge function timeout'),
      });

      const result = await readinessService.recalculate(examType);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EDGE_FUNCTION_ERROR');
      }
    });

    it('returns EDGE_FUNCTION_ERROR when calculation returns success: false', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });
      mockInvoke.mockResolvedValue({
        data: { success: false },
        error: null,
      });

      const result = await readinessService.recalculate(examType);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EDGE_FUNCTION_ERROR');
        expect(result.error.message).toContain('calculation returned unsuccessful');
      }
    });
  });
});
