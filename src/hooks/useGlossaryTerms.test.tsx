import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useGlossaryTerms } from './useGlossaryTerms';

// Mock Supabase
const mockOrder = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

const mockTerms = [
  { id: '1', term: 'Amateur Radio', definition: 'Non-commercial radio communication' },
  { id: '2', term: 'Band', definition: 'A range of frequencies' },
  { id: '3', term: 'CW', definition: 'Continuous Wave (Morse code)' },
];

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

describe('useGlossaryTerms', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock chain
    mockOrder.mockResolvedValue({ data: mockTerms, error: null });
    mockSelect.mockReturnValue({ order: mockOrder });
  });

  describe('fetching terms', () => {
    it('fetches glossary terms successfully', async () => {
      const { result } = renderHook(() => useGlossaryTerms(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTerms);
    });

    it('returns loading state initially', () => {
      const { result } = renderHook(() => useGlossaryTerms(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('orders terms alphabetically by term', async () => {
      const { result } = renderHook(() => useGlossaryTerms(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSelect).toHaveBeenCalledWith('id, term, definition');
      expect(mockOrder).toHaveBeenCalledWith('term', { ascending: true });
    });
  });

  describe('error handling', () => {
    it('returns error state when query fails', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      const { result } = renderHook(() => useGlossaryTerms(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('empty results', () => {
    it('returns empty array when no terms exist', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useGlossaryTerms(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });

  describe('data shape', () => {
    it('returns terms with correct shape', async () => {
      const { result } = renderHook(() => useGlossaryTerms(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const term = result.current.data?.[0];
      expect(term).toHaveProperty('id');
      expect(term).toHaveProperty('term');
      expect(term).toHaveProperty('definition');
    });
  });

  describe('caching', () => {
    it('uses correct query key', async () => {
      const wrapper = createWrapper();

      const { result } = renderHook(() => useGlossaryTerms(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // The query should have been made once
      expect(mockSelect).toHaveBeenCalledTimes(1);

      // Re-render with same wrapper should use cached data
      const { result: result2 } = renderHook(() => useGlossaryTerms(), { wrapper });

      // Should still only have one call (cached)
      expect(mockSelect).toHaveBeenCalledTimes(1);
    });
  });
});
