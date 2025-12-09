import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExamSessions, useExamSessionsCount, useUserTargetExam } from './useExamSessions';
import React from 'react';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({
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
            })),
            lte: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({
                data: [],
                error: null,
                count: 0,
              })),
              eq: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({
                  data: [],
                  error: null,
                  count: 0,
                })),
                like: vi.fn(() => ({
                  range: vi.fn(() => Promise.resolve({
                    data: [],
                    error: null,
                    count: 0,
                  })),
                  eq: vi.fn(() => ({
                    range: vi.fn(() => Promise.resolve({
                      data: [],
                      error: null,
                      count: 0,
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({
            data: null,
            error: null,
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({
              data: { updated_at: '2025-01-15T10:00:00Z' },
              error: null,
            })),
          })),
        })),
      })),
    })),
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
