import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { formatTestDate, useRecentTestHistory } from './useRecentTestHistory';
import { createTestQueryClient } from '@/test/utils/testWrappers';

const mockIn = vi.fn();
const mockRows = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          in: (column: string, values: string[]) => {
            mockIn(column, values);
            return {
              order: () => ({
                limit: () => Promise.resolve({ data: mockRows(), error: null }),
              }),
            };
          },
        }),
      }),
    }),
  },
}));

const mockAuth = { user: { id: 'u1' } as { id: string } | null };
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockAuth }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
);

describe('useRecentTestHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.user = { id: 'u1' };
    mockRows.mockReturnValue([]);
  });

  /**
   * Technician results were stored as test_type 'practice' before the app
   * had test types at all. Dropping the alias would hide every result from
   * before that change.
   */
  it('reads legacy "practice" rows alongside technician ones', async () => {
    const { result } = renderHook(() => useRecentTestHistory('technician'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockIn).toHaveBeenCalledWith('test_type', ['practice', 'technician']);
  });

  it('does not extend the alias to the other exams', async () => {
    const { result } = renderHook(() => useRecentTestHistory('general'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockIn).toHaveBeenCalledWith('test_type', ['general']);
  });

  /** Guests have nothing to fetch, and the query must not fire with no id. */
  it('does not run for a guest', async () => {
    mockAuth.user = null;

    const { result } = renderHook(() => useRecentTestHistory('technician'), { wrapper });

    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockIn).not.toHaveBeenCalled();
  });
});

describe('formatTestDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-17T15:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('names today with the time', () => {
    expect(formatTestDate('2026-09-17T09:30:00')).toMatch(/^Today at 9:30/);
  });

  it('names yesterday', () => {
    expect(formatTestDate('2026-09-16T14:00:00')).toBe('Yesterday');
  });

  it('counts days inside a week', () => {
    expect(formatTestDate('2026-09-13T15:00:00')).toBe('4 days ago');
  });

  it('falls back to a short date beyond a week', () => {
    expect(formatTestDate('2026-09-01T15:00:00')).toMatch(/^Sep 1$/);
  });

  /**
   * The day count floors elapsed milliseconds, so a result from 23 hours ago
   * is "today" and one from 25 hours ago is "yesterday" — the boundary is
   * 24 hours from now, not midnight.
   */
  it('measures days as 24-hour spans from now, not calendar days', () => {
    expect(formatTestDate('2026-09-16T16:00:00')).toMatch(/^Today at/);
    expect(formatTestDate('2026-09-16T14:00:00')).toBe('Yesterday');
  });
});
