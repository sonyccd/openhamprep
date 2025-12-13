import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useAdmin } from './useAdmin';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('./useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Supabase
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: user is logged in
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' },
      loading: false,
    });

    // Set up the mock chain
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockEq.mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }) });
    mockSelect.mockReturnValue({ eq: mockEq });
  });

  describe('when user is not logged in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });
    });

    it('returns isAdmin as false', async () => {
      const { result } = renderHook(() => useAdmin(), {
        wrapper: createWrapper(),
      });

      // Query should not be enabled when user is null
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('when user is logged in', () => {
    it('returns isAdmin as false when user has no admin role', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useAdmin(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAdmin).toBe(false);
    });

    it('returns isAdmin as true when user has admin role', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { role: 'admin', user_id: 'test-user-id' },
        error: null,
      });

      const { result } = renderHook(() => useAdmin(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isAdmin).toBe(true));

      expect(result.current.isAdmin).toBe(true);
    });

    it('returns isAdmin as false on query error', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAdmin(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAdmin).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking admin role:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('returns loading state while query is pending', () => {
      // Make the query take longer
      mockMaybeSingle.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useAdmin(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('query configuration', () => {
    it('does not run query when user id is undefined', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: undefined },
        loading: false,
      });

      const { result } = renderHook(() => useAdmin(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAdmin).toBe(false);
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });
});
