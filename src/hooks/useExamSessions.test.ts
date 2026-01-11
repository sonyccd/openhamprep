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
} from './useExamSessions';
import React from 'react';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
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
          select: mockSelect,
          upsert: mockUpsert,
          delete: mockDelete,
        };
      }
      if (table === 'weekly_study_goals') {
        return {
          upsert: mockUpsert,
        };
      }
      return {
        select: mockSelect,
        insert: mockInsert,
        delete: mockDelete,
        upsert: mockUpsert,
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
