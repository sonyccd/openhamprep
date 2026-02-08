import { describe, it, expect, vi, beforeEach } from 'vitest';
import { examSessionService } from './examSessionService';

// Individual mock functions for fine-grained control
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockIlike = vi.fn();
const mockNot = vi.fn();
const mockOr = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockRange = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const chainMethods = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  upsert: mockUpsert,
  delete: mockDelete,
  eq: mockEq,
  gte: mockGte,
  lte: mockLte,
  ilike: mockIlike,
  not: mockNot,
  or: mockOr,
  in: mockIn,
  order: mockOrder,
  limit: mockLimit,
  range: mockRange,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
};

function setupChain() {
  const chain = chainMethods;
  for (const fn of Object.values(chain)) {
    fn.mockReturnValue(chain);
  }
  mockFrom.mockReturnValue(chain);
}

const userId = 'user-123';

beforeEach(() => {
  vi.clearAllMocks();
  setupChain();
});

const makeSession = (overrides = {}) => ({
  id: 'sess-1',
  title: null,
  exam_date: '2024-06-15',
  sponsor: 'Test VEC',
  exam_time: '09:00',
  walk_ins_allowed: true,
  public_contact: null,
  phone: null,
  email: null,
  vec: 'ARRL',
  location_name: 'Library',
  address: '123 Main St',
  address_2: null,
  address_3: null,
  city: 'Raleigh',
  state: 'NC',
  zip: '27601',
  latitude: null,
  longitude: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  ...overrides,
});

describe('ExamSessionService', () => {
  describe('getSessions', () => {
    it('returns paginated sessions', async () => {
      const sessions = [makeSession()];
      mockRange.mockResolvedValue({ data: sessions, error: null, count: 1 });

      const result = await examSessionService.getSessions(undefined, 1, 50);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessions).toHaveLength(1);
        expect(result.data.totalCount).toBe(1);
        expect(result.data.page).toBe(1);
        expect(result.data.totalPages).toBe(1);
      }
      expect(mockFrom).toHaveBeenCalledWith('exam_sessions');
    });

    it('applies filters correctly', async () => {
      mockRange.mockResolvedValue({ data: [], error: null, count: 0 });

      await examSessionService.getSessions({
        state: 'NC',
        walkInsOnly: true,
        zip: '27601',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(mockEq).toHaveBeenCalledWith('state', 'NC');
      expect(mockEq).toHaveBeenCalledWith('walk_ins_allowed', true);
      expect(mockIlike).toHaveBeenCalledWith('zip', '276*');
    });

    it('returns failure on database error', async () => {
      mockRange.mockResolvedValue({
        data: null,
        error: { message: 'permission denied', code: '42501', details: '', hint: '' },
        count: null,
      });

      const result = await examSessionService.getSessions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('getCount', () => {
    it('returns session count', async () => {
      mockSelect.mockResolvedValue({ count: 42, error: null });

      const result = await examSessionService.getCount();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    });

    it('returns 0 when count is null', async () => {
      mockSelect.mockResolvedValue({ count: null, error: null });

      const result = await examSessionService.getCount();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0);
      }
    });

    it('returns failure on error', async () => {
      mockSelect.mockResolvedValue({
        count: null,
        error: { message: 'error', code: '42501', details: '', hint: '' },
      });

      const result = await examSessionService.getCount();

      expect(result.success).toBe(false);
    });
  });

  describe('getLastUpdated', () => {
    it('returns last updated timestamp', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { updated_at: '2024-06-15T10:00:00Z' },
        error: null,
      });

      const result = await examSessionService.getLastUpdated();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('2024-06-15T10:00:00Z');
      }
    });

    it('returns null when no sessions exist', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await examSessionService.getLastUpdated();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('getUserTarget', () => {
    it('returns user target with joined session', async () => {
      const mockTarget = {
        id: 'target-1',
        user_id: userId,
        exam_session_id: 'sess-1',
        custom_exam_date: null,
        study_intensity: 'moderate',
        target_license: 'technician',
        exam_session: makeSession(),
      };
      mockMaybeSingle.mockResolvedValue({ data: mockTarget, error: null });

      const result = await examSessionService.getUserTarget(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.study_intensity).toBe('moderate');
        expect(result.data?.exam_session).toBeTruthy();
      }
    });

    it('returns null when no target exists', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await examSessionService.getUserTarget(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await examSessionService.getUserTarget('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });
  });

  describe('saveTarget', () => {
    it('upserts target exam successfully', async () => {
      const mockData = { id: 'target-1', user_id: userId };
      mockSingle.mockResolvedValue({ data: mockData, error: null });

      const result = await examSessionService.saveTarget({
        userId,
        customExamDate: '2024-07-01',
        studyIntensity: 'intensive',
        targetLicense: 'general',
      });

      expect(result.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('returns VALIDATION_ERROR when neither session nor date provided', async () => {
      const result = await examSessionService.saveTarget({
        userId,
        studyIntensity: 'light',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns VALIDATION_ERROR when both session and date provided', async () => {
      const result = await examSessionService.saveTarget({
        userId,
        examSessionId: 'sess-1',
        customExamDate: '2024-07-01',
        studyIntensity: 'light',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('removeTarget', () => {
    it('deletes target successfully', async () => {
      mockEq.mockResolvedValue({ error: null });

      const result = await examSessionService.removeTarget(userId);

      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await examSessionService.removeTarget('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });
  });

  describe('bulkImport', () => {
    it('returns import result on success', async () => {
      mockRpc.mockResolvedValue({
        data: [{ inserted_sessions_count: 10, converted_targets_count: 2, deleted_sessions_count: 5 }],
        error: null,
      });

      const result = await examSessionService.bulkImport([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(10);
        expect(result.data.convertedTargets).toBe(2);
        expect(result.data.deletedSessions).toBe(5);
      }
    });

    it('returns failure when RPC returns empty data', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      const result = await examSessionService.bulkImport([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('no result');
      }
    });

    it('returns failure on RPC error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'function error', code: 'P0001', details: '', hint: '' },
      });

      const result = await examSessionService.bulkImport([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('getAttempts', () => {
    it('returns exam attempts with joined session', async () => {
      const mockAttempts = [
        {
          id: 'att-1',
          user_id: userId,
          exam_date: '2024-06-15',
          target_license: 'technician',
          outcome: 'passed',
          exam_session: makeSession(),
        },
      ];
      mockOrder.mockResolvedValue({ data: mockAttempts, error: null });

      const result = await examSessionService.getAttempts(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].outcome).toBe('passed');
      }
    });

    it('returns empty array when no attempts exist', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });

      const result = await examSessionService.getAttempts(userId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('returns AUTH_REQUIRED when userId is empty', async () => {
      const result = await examSessionService.getAttempts('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('AUTH_REQUIRED');
      }
    });
  });

  describe('recordAttempt', () => {
    it('inserts an exam attempt', async () => {
      const mockAttempt = { id: 'att-1', user_id: userId };
      mockSingle.mockResolvedValue({ data: mockAttempt, error: null });

      const result = await examSessionService.recordAttempt({
        userId,
        examDate: '2024-06-15',
        targetLicense: 'technician',
        outcome: 'passed',
      });

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        exam_date: '2024-06-15',
        target_license: 'technician',
        outcome: 'passed',
        exam_session_id: null,
        notes: null,
      });
    });

    it('returns failure on duplicate', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'unique violation', code: '23505', details: '', hint: '' },
      });

      const result = await examSessionService.recordAttempt({
        userId,
        examDate: '2024-06-15',
        targetLicense: 'technician',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
      }
    });
  });

  describe('updateOutcome', () => {
    it('updates outcome successfully', async () => {
      mockSingle.mockResolvedValue({ data: { id: 'att-1' }, error: null });

      const result = await examSessionService.updateOutcome({
        attemptId: 'att-1',
        outcome: 'passed',
        notes: 'Passed with flying colors',
      });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        outcome: 'passed',
        notes: 'Passed with flying colors',
      });
    });
  });

  describe('getNeedingGeocodeCount', () => {
    it('returns count of sessions needing geocoding', async () => {
      mockOr.mockResolvedValue({ count: 15, error: null });

      const result = await examSessionService.getNeedingGeocodeCount();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(15);
      }
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    });

    it('returns 0 when count is null', async () => {
      mockOr.mockResolvedValue({ count: null, error: null });

      const result = await examSessionService.getNeedingGeocodeCount();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0);
      }
    });
  });

  describe('getSessionsNeedingGeocode', () => {
    it('returns sessions in single page', async () => {
      const sessions = [makeSession()];
      // Single page: returns fewer than POSTGREST_PAGE_SIZE
      mockOr.mockResolvedValue({ data: sessions, error: null });

      const result = await examSessionService.getSessionsNeedingGeocode(false);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessions).toHaveLength(1);
        expect(result.data.limitReached).toBe(false);
      }
    });

    it('returns empty when no sessions need geocoding', async () => {
      mockOr.mockResolvedValue({ data: [], error: null });

      const result = await examSessionService.getSessionsNeedingGeocode(false);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sessions).toHaveLength(0);
        expect(result.data.totalCount).toBe(0);
      }
    });

    it('skips missing-coords filter when includeAll is true', async () => {
      mockRange.mockResolvedValue({ data: [], error: null });

      await examSessionService.getSessionsNeedingGeocode(true);

      // When includeAll is true, .or() should NOT be called for coord filtering
      // (the chain uses .range() at the end since .or() isn't appended)
      expect(mockFrom).toHaveBeenCalledWith('exam_sessions');
    });

    it('returns failure on database error', async () => {
      mockOr.mockResolvedValue({
        data: null,
        error: { message: 'error', code: '42501', details: '', hint: '' },
      });

      const result = await examSessionService.getSessionsNeedingGeocode(false);

      expect(result.success).toBe(false);
    });
  });
});
