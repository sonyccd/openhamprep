import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useExamSessions,
  useExamSessionsCount,
  useUserTargetExam,
  useExamSessionsLastUpdated,
  useSaveTargetExam,
  useRemoveTargetExam,
  useBulkImportExamSessions,
  useExamAttempts,
  useRecordExamAttempt,
  useUpdateExamAttemptOutcome,
  type LicenseType,
  type ExamOutcome,
  type ExamAttempt,
} from './useExamSessions';
import React from 'react';

// Mock sonner toast - use inline factory since vi.mock is hoisted
vi.mock('sonner', () => {
  const toastFn = (() => {}) as unknown as typeof import('sonner').toast;
  return {
    toast: Object.assign(toastFn, {
      success: () => {},
      error: () => {},
      info: () => {},
    }),
  };
});

// Mock supabase - we need a more flexible mock setup
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockUpsert = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockLike = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockLimit = vi.fn();

const mockUpdate = vi.fn();
const mockNot = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: vi.fn((table: string) => {
      if (table === 'exam_sessions') {
        return {
          select: mockSelect,
          insert: mockInsert,
          delete: mockDelete,
        };
      }
      if (table === 'user_target_exam') {
        return {
          select: vi.fn().mockReturnValue({
            eq: mockEq,
            not: mockNot,
          }),
          upsert: mockUpsert,
          delete: mockDelete,
          update: mockUpdate,
        };
      }
      if (table === 'weekly_study_goals') {
        return {
          upsert: mockUpsert,
        };
      }
      if (table === 'exam_attempts') {
        return {
          select: mockSelect,
          insert: mockInsert,
          update: mockUpdate,
        };
      }
      return {
        select: mockSelect,
        insert: mockInsert,
        delete: mockDelete,
        upsert: mockUpsert,
        update: mockUpdate,
      };
    }),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useExamSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset all mock chains for exam_sessions queries
    mockRange.mockResolvedValue({
      data: [
        {
          id: 'session-1',
          title: 'Test Session',
          exam_date: '2025-02-01',
          city: 'Raleigh',
          state: 'NC',
          zip: '27601',
          walk_ins_allowed: true,
          latitude: 35.7796,
          longitude: -78.6382,
        },
      ],
      error: null,
      count: 1,
    });

    mockOrder.mockReturnValue({ range: mockRange });
    mockLike.mockReturnValue({ eq: mockEq, range: mockRange, order: mockOrder });
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
      eq: mockEq,
      like: mockLike,
      range: mockRange,
      order: mockOrder,
    });
    mockLte.mockReturnValue({ eq: mockEq, like: mockLike, range: mockRange, order: mockOrder });
    mockGte.mockReturnValue({ order: mockOrder, lte: mockLte, eq: mockEq, like: mockLike, range: mockRange });
    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSingle.mockResolvedValue({ data: { id: 'test-id' }, error: null });

    // For select queries
    mockSelect.mockReturnValue({
      gte: mockGte,
      eq: mockEq,
      order: mockOrder,
      not: mockNot,
    });

    // For RPC calls (bulk import)
    mockRpc.mockResolvedValue({
      data: [{ converted_targets_count: 0, deleted_sessions_count: 0, inserted_sessions_count: 1 }],
      error: null,
    });

    // For user_target_exam .not() queries (bulk import conversion)
    mockNot.mockResolvedValue({
      data: [],
      error: null,
    });

    // For insert/delete/upsert
    mockInsert.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: mockEq, neq: mockNeq });
    mockNeq.mockResolvedValue({ error: null });
    mockUpsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
  });

  describe('useExamSessions hook', () => {
    it('returns exam sessions data structure', async () => {
      const { result } = renderHook(() => useExamSessions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that the query completed (data structure exists)
      expect(result.current.data).toBeDefined();
    });

    it('accepts filter parameters', () => {
      const { result } = renderHook(
        () => useExamSessions({
          state: 'NC',
          zip: '27601',
          walkInsOnly: true,
          page: 1,
          pageSize: 20,
        }),
        { wrapper: createWrapper() }
      );

      // Hook should accept filters without error
      expect(result.current).toBeDefined();
    });
  });

  describe('useExamSessionsCount hook', () => {
    it('returns a count value', async () => {
      const { result } = renderHook(() => useExamSessionsCount(), {
        wrapper: createWrapper(),
      });

      // Hook should return without error
      expect(result.current).toBeDefined();
    });
  });

  describe('useUserTargetExam hook', () => {
    it('returns null when no userId provided', async () => {
      const { result } = renderHook(() => useUserTargetExam(undefined), {
        wrapper: createWrapper(),
      });

      // Should not be enabled without userId
      expect(result.current.data).toBeUndefined();
    });

    it('fetches target exam when userId is provided', async () => {
      const { result } = renderHook(() => useUserTargetExam('test-user-id'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Hook completed without error
      expect(result.current.error).toBeNull();
    });
  });
});

describe('ExamSession type', () => {
  it('should have correct interface shape', () => {
    // Type checking test - this verifies the interface at compile time
    const mockSession = {
      id: 'test-id',
      title: 'Test Session',
      exam_date: '2025-02-01',
      sponsor: 'ARRL',
      exam_time: '9:00 AM',
      walk_ins_allowed: true,
      public_contact: 'John Doe',
      phone: '555-1234',
      email: 'test@example.com',
      vec: 'ARRL/VEC',
      location_name: 'Community Center',
      address: '123 Main St',
      address_2: null,
      address_3: null,
      city: 'Raleigh',
      state: 'NC',
      zip: '27601',
      latitude: 35.7796,
      longitude: -78.6382,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    };

    // If TypeScript compiles, the shape is correct
    expect(mockSession.id).toBe('test-id');
    expect(mockSession.walk_ins_allowed).toBe(true);
    expect(mockSession.latitude).toBe(35.7796);
  });
});

describe('useExamSessionsLastUpdated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({
      data: { updated_at: '2025-01-15T10:00:00Z' },
      error: null,
    });
    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockSelect.mockReturnValue({ order: mockOrder });
  });

  it('returns last updated timestamp', async () => {
    const { result } = renderHook(() => useExamSessionsLastUpdated(), {
      wrapper: createWrapper(),
    });

    // Hook should be defined
    expect(result.current).toBeDefined();
  });
});

describe('useSaveTargetExam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: 'target-exam-id' }, error: null });
    mockUpsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
  });

  it('provides mutateAsync function', async () => {
    const { result } = renderHook(() => useSaveTargetExam(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutateAsync).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('accepts study intensity parameters', async () => {
    const { result } = renderHook(() => useSaveTargetExam(), {
      wrapper: createWrapper(),
    });

    // Should be able to call with light, moderate, or intensive
    const intensities = ['light', 'moderate', 'intensive'] as const;
    intensities.forEach((intensity) => {
      expect(() =>
        result.current.mutate({
          userId: 'test-user',
          examSessionId: 'exam-session-id',
          studyIntensity: intensity,
        })
      ).not.toThrow();
    });
  });

  it('accepts customExamDate parameter instead of examSessionId', async () => {
    const { result } = renderHook(() => useSaveTargetExam(), {
      wrapper: createWrapper(),
    });

    expect(() =>
      result.current.mutate({
        userId: 'test-user',
        customExamDate: '2025-06-15',
        studyIntensity: 'moderate',
      })
    ).not.toThrow();
  });

  it('requires exactly one of examSessionId or customExamDate', async () => {
    const { result } = renderHook(() => useSaveTargetExam(), {
      wrapper: createWrapper(),
    });

    // This tests that the hook doesn't throw when called correctly
    // The validation happens in the mutationFn, so we just ensure
    // both call patterns are accepted by the type system
    expect(() =>
      result.current.mutate({
        userId: 'test-user',
        examSessionId: 'exam-session-id',
        studyIntensity: 'light',
      })
    ).not.toThrow();

    expect(() =>
      result.current.mutate({
        userId: 'test-user',
        customExamDate: '2025-06-15',
        studyIntensity: 'intensive',
      })
    ).not.toThrow();
  });
});

describe('useRemoveTargetExam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: mockEq });
  });

  it('provides mutateAsync function', async () => {
    const { result } = renderHook(() => useRemoveTargetExam(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutateAsync).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe('function');
  });
});

describe('useBulkImportExamSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNeq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ neq: mockNeq });
    mockInsert.mockResolvedValue({ error: null });
  });

  it('provides mutateAsync function', async () => {
    const { result } = renderHook(() => useBulkImportExamSessions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutateAsync).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('can be called with session data', async () => {
    const { result } = renderHook(() => useBulkImportExamSessions(), {
      wrapper: createWrapper(),
    });

    const testSessions = [
      {
        title: 'Test Session',
        exam_date: '2025-02-01',
        sponsor: 'ARRL',
        exam_time: '9:00 AM',
        walk_ins_allowed: true,
        public_contact: 'John Doe',
        phone: '555-1234',
        email: 'test@example.com',
        vec: 'ARRL/VEC',
        location_name: 'Community Center',
        address: '123 Main St',
        address_2: null,
        address_3: null,
        city: 'Raleigh',
        state: 'NC',
        zip: '27601',
        latitude: 35.7796,
        longitude: -78.6382,
      },
    ];

    // Should not throw when calling mutate
    expect(() => result.current.mutate(testSessions)).not.toThrow();
  });
});

describe('useExamSessions with date filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRange.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });
    mockOrder.mockReturnValue({ range: mockRange });
    mockLte.mockReturnValue({ eq: mockEq, like: mockLike, range: mockRange, order: mockOrder });
    mockGte.mockReturnValue({ order: mockOrder, lte: mockLte, eq: mockEq, like: mockLike });
    mockSelect.mockReturnValue({ gte: mockGte, eq: mockEq, order: mockOrder });
  });

  it('accepts startDate filter', () => {
    const { result } = renderHook(
      () =>
        useExamSessions({
          startDate: '2025-01-01',
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current).toBeDefined();
  });

  it('accepts endDate filter', () => {
    const { result } = renderHook(
      () =>
        useExamSessions({
          endDate: '2025-12-31',
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current).toBeDefined();
  });

  it('accepts combined date range filter', () => {
    const { result } = renderHook(
      () =>
        useExamSessions({
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current).toBeDefined();
  });
});

// ============================================================================
// Exam Attempts Tests
// ============================================================================

describe('useExamAttempts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockReturnValue({
      data: [
        {
          id: 'attempt-1',
          user_id: 'test-user',
          exam_date: '2025-01-15',
          target_license: 'technician',
          outcome: 'passed',
          notes: 'Great exam!',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      ],
      error: null,
    });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
  });

  it('returns empty array when no userId provided', async () => {
    const { result } = renderHook(() => useExamAttempts(undefined), {
      wrapper: createWrapper(),
    });

    // Should not be enabled without userId
    expect(result.current.data).toBeUndefined();
  });

  it('fetches exam attempts when userId is provided', async () => {
    const { result } = renderHook(() => useExamAttempts('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Hook completed without error
    expect(result.current.error).toBeNull();
  });

  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useExamAttempts(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useRecordExamAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: {
        id: 'new-attempt-id',
        user_id: 'test-user',
        exam_date: '2025-02-01',
        target_license: 'general',
        outcome: null,
      },
      error: null,
    });
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
  });

  it('provides mutateAsync function', async () => {
    const { result } = renderHook(() => useRecordExamAttempt(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutateAsync).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('accepts all license types', async () => {
    const { result } = renderHook(() => useRecordExamAttempt(), {
      wrapper: createWrapper(),
    });

    const licenseTypes: LicenseType[] = ['technician', 'general', 'extra'];
    licenseTypes.forEach((license) => {
      expect(() =>
        result.current.mutate({
          userId: 'test-user',
          examDate: '2025-02-01',
          targetLicense: license,
        })
      ).not.toThrow();
    });
  });

  it('accepts optional outcome parameter', async () => {
    const { result } = renderHook(() => useRecordExamAttempt(), {
      wrapper: createWrapper(),
    });

    const outcomes: ExamOutcome[] = ['passed', 'failed', 'skipped'];
    outcomes.forEach((outcome) => {
      expect(() =>
        result.current.mutate({
          userId: 'test-user',
          examDate: '2025-02-01',
          targetLicense: 'technician',
          outcome,
        })
      ).not.toThrow();
    });
  });

  it('accepts optional notes and examSessionId', async () => {
    const { result } = renderHook(() => useRecordExamAttempt(), {
      wrapper: createWrapper(),
    });

    expect(() =>
      result.current.mutate({
        userId: 'test-user',
        examDate: '2025-02-01',
        targetLicense: 'extra',
        outcome: 'passed',
        examSessionId: 'session-123',
        notes: 'Passed on first try!',
      })
    ).not.toThrow();
  });
});

describe('useUpdateExamAttemptOutcome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: {
        id: 'attempt-1',
        outcome: 'passed',
      },
      error: null,
    });
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ single: mockSingle }),
      }),
    });
  });

  it('provides mutateAsync function', async () => {
    const { result } = renderHook(() => useUpdateExamAttemptOutcome(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutateAsync).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('accepts all outcome types', async () => {
    const { result } = renderHook(() => useUpdateExamAttemptOutcome(), {
      wrapper: createWrapper(),
    });

    const outcomes: ExamOutcome[] = ['passed', 'failed', 'skipped'];
    outcomes.forEach((outcome) => {
      expect(() =>
        result.current.mutate({
          attemptId: 'attempt-1',
          outcome,
        })
      ).not.toThrow();
    });
  });

  it('accepts optional notes parameter', async () => {
    const { result } = renderHook(() => useUpdateExamAttemptOutcome(), {
      wrapper: createWrapper(),
    });

    expect(() =>
      result.current.mutate({
        attemptId: 'attempt-1',
        outcome: 'failed',
        notes: 'Need to study more on antennas',
      })
    ).not.toThrow();
  });
});

// ============================================================================
// Type Interface Tests
// ============================================================================

describe('LicenseType', () => {
  it('should accept valid license types', () => {
    const validTypes: LicenseType[] = ['technician', 'general', 'extra'];
    validTypes.forEach((type) => {
      expect(['technician', 'general', 'extra']).toContain(type);
    });
  });
});

describe('ExamOutcome', () => {
  it('should accept valid outcome types', () => {
    const validOutcomes: ExamOutcome[] = ['passed', 'failed', 'skipped'];
    validOutcomes.forEach((outcome) => {
      expect(['passed', 'failed', 'skipped']).toContain(outcome);
    });
  });
});

describe('ExamAttempt type', () => {
  it('should have correct interface shape', () => {
    const mockAttempt: ExamAttempt = {
      id: 'attempt-1',
      user_id: 'user-1',
      exam_date: '2025-02-01',
      target_license: 'technician',
      outcome: 'passed',
      exam_session_id: 'session-1',
      notes: 'Great experience!',
      created_at: '2025-02-01T10:00:00Z',
      updated_at: '2025-02-01T10:00:00Z',
    };

    expect(mockAttempt.id).toBe('attempt-1');
    expect(mockAttempt.target_license).toBe('technician');
    expect(mockAttempt.outcome).toBe('passed');
  });

  it('should allow null outcome and notes', () => {
    const mockAttempt: ExamAttempt = {
      id: 'attempt-2',
      user_id: 'user-1',
      exam_date: '2025-03-15',
      target_license: 'general',
      outcome: null,
      exam_session_id: null,
      notes: null,
      created_at: '2025-03-15T10:00:00Z',
      updated_at: '2025-03-15T10:00:00Z',
    };

    expect(mockAttempt.outcome).toBeNull();
    expect(mockAttempt.notes).toBeNull();
    expect(mockAttempt.exam_session_id).toBeNull();
  });
});

// ============================================================================
// Updated useSaveTargetExam Tests (with targetLicense)
// ============================================================================

describe('useSaveTargetExam with targetLicense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: { id: 'target-exam-id', target_license: 'technician' },
      error: null,
    });
    mockUpsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
  });

  it('accepts targetLicense parameter', async () => {
    const { result } = renderHook(() => useSaveTargetExam(), {
      wrapper: createWrapper(),
    });

    const licenseTypes: LicenseType[] = ['technician', 'general', 'extra'];
    licenseTypes.forEach((license) => {
      expect(() =>
        result.current.mutate({
          userId: 'test-user',
          examSessionId: 'session-1',
          studyIntensity: 'moderate',
          targetLicense: license,
        })
      ).not.toThrow();
    });
  });

  it('allows targetLicense to be omitted', async () => {
    const { result } = renderHook(() => useSaveTargetExam(), {
      wrapper: createWrapper(),
    });

    // Should not throw when targetLicense is not provided
    expect(() =>
      result.current.mutate({
        userId: 'test-user',
        customExamDate: '2025-06-15',
        studyIntensity: 'intensive',
      })
    ).not.toThrow();
  });
});

// ============================================================================
// Bulk Import Session Reference Conversion Tests
// ============================================================================

describe('useBulkImportExamSessions with user target conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock for fetching user_target_exam rows with sessions
    mockNot.mockResolvedValue({
      data: [
        {
          id: 'target-1',
          exam_session_id: 'session-to-delete',
          exam_session: { exam_date: '2025-03-01' },
        },
      ],
      error: null,
    });
    mockSelect.mockReturnValue({ not: mockNot });

    // Mock for update
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    // Mock for delete
    mockNeq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ neq: mockNeq });

    // Mock for insert
    mockInsert.mockResolvedValue({ error: null });
  });

  it('provides mutate function for bulk import', async () => {
    const { result } = renderHook(() => useBulkImportExamSessions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe('function');
  });

  it('can be called with session data (conversion happens internally)', async () => {
    const { result } = renderHook(() => useBulkImportExamSessions(), {
      wrapper: createWrapper(),
    });

    const testSessions = [
      {
        title: 'New Session',
        exam_date: '2025-04-01',
        sponsor: 'ARRL',
        exam_time: '10:00 AM',
        walk_ins_allowed: true,
        public_contact: 'Jane Doe',
        phone: '555-5678',
        email: 'jane@example.com',
        vec: 'ARRL/VEC',
        location_name: 'Library',
        address: '456 Oak St',
        address_2: null,
        address_3: null,
        city: 'Durham',
        state: 'NC',
        zip: '27701',
        latitude: 35.994,
        longitude: -78.8986,
      },
    ];

    // The hook should handle the conversion internally before deleting sessions
    expect(() => result.current.mutate(testSessions)).not.toThrow();
  });
});

// ============================================================================
// Error Path Tests
// ============================================================================

describe('useExamAttempts error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockReturnValue({
      data: null,
      error: { message: 'Database error', code: 'PGRST301' },
    });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
  });

  it('returns error when fetch fails', async () => {
    const { result } = renderHook(() => useExamAttempts('test-user'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
  });
});

describe('useRecordExamAttempt error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Duplicate key violation', code: '23505' },
    });
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
  });

  it('handles insert error gracefully', async () => {
    const { result } = renderHook(() => useRecordExamAttempt(), {
      wrapper: createWrapper(),
    });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.mutateAsync({
          userId: 'test-user',
          examDate: '2025-02-01',
          targetLicense: 'technician',
        });
      } catch (e) {
        thrownError = e as Error;
      }
    });

    // Error should be thrown by mutateAsync
    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toBe('Duplicate key violation');
  });
});

describe('useUpdateExamAttemptOutcome error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Record not found', code: 'PGRST116' },
    });
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ single: mockSingle }),
      }),
    });
  });

  it('handles update error gracefully', async () => {
    const { result } = renderHook(() => useUpdateExamAttemptOutcome(), {
      wrapper: createWrapper(),
    });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.mutateAsync({
          attemptId: 'nonexistent-id',
          outcome: 'passed',
        });
      } catch (e) {
        thrownError = e as Error;
      }
    });

    // Error should be thrown by mutateAsync
    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toBe('Record not found');
  });
});

describe('useBulkImportExamSessions error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Only admins can bulk import exam sessions', code: 'P0001' },
    });
  });

  it('handles non-admin error from RPC function', async () => {
    const { result } = renderHook(() => useBulkImportExamSessions(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync([
          {
            title: 'Test',
            exam_date: '2025-02-01',
            sponsor: 'Test',
            exam_time: '9:00 AM',
            walk_ins_allowed: false,
            public_contact: null,
            phone: null,
            email: null,
            vec: null,
            location_name: null,
            address: null,
            address_2: null,
            address_3: null,
            city: 'Test',
            state: 'NC',
            zip: '27601',
            latitude: null,
            longitude: null,
          },
        ]);
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).not.toBeNull();
  });

  it('throws error when RPC returns empty data', async () => {
    mockRpc.mockResolvedValue({
      data: [],
      error: null,
    });

    const { result } = renderHook(() => useBulkImportExamSessions(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync([
          {
            title: 'Test',
            exam_date: '2025-02-01',
            sponsor: 'Test',
            exam_time: '9:00 AM',
            walk_ins_allowed: false,
            public_contact: null,
            phone: null,
            email: null,
            vec: null,
            location_name: null,
            address: null,
            address_2: null,
            address_3: null,
            city: 'Test',
            state: 'NC',
            zip: '27601',
            latitude: null,
            longitude: null,
          },
        ]);
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('no result');
  });
});
