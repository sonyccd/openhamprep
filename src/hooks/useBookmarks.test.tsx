import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useBookmarks } from './useBookmarks';

// Mock dependencies
const mockUser = { id: 'test-user-id', email: 'test@example.com' };

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    loading: false,
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock usePostHog
vi.mock('@/hooks/usePostHog', () => ({
  usePostHog: vi.fn(() => ({
    capture: vi.fn(),
    isReady: true,
  })),
  ANALYTICS_EVENTS: {
    QUESTION_BOOKMARKED: 'question_bookmarked',
    BOOKMARK_REMOVED: 'bookmark_removed',
    BOOKMARKED_QUESTION_REVIEWED: 'bookmarked_question_reviewed',
  },
}));

// Mock Supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
      update: mockUpdate,
    })),
  },
}));

// Raw data from Supabase (with joined questions table)
const mockRawBookmarks = [
  { id: '1', user_id: 'test-user-id', question_id: 'T1A01', note: 'Test note', created_at: '2024-01-01', questions: { display_name: 'T1A01' } },
  { id: '2', user_id: 'test-user-id', question_id: 'T1A02', note: null, created_at: '2024-01-02', questions: { display_name: 'T1A02' } },
];

// Flattened data (what the hook returns after mapping)
const mockBookmarks = [
  { id: '1', user_id: 'test-user-id', question_id: 'T1A01', note: 'Test note', created_at: '2024-01-01', questions: { display_name: 'T1A01' }, display_name: 'T1A01' },
  { id: '2', user_id: 'test-user-id', question_id: 'T1A02', note: null, created_at: '2024-01-02', questions: { display_name: 'T1A02' }, display_name: 'T1A02' },
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

describe('useBookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock chain for select (returns raw data with joined questions)
    mockOrder.mockResolvedValue({ data: mockRawBookmarks, error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    // Set up mock chain for insert
    mockSingle.mockResolvedValue({ data: mockBookmarks[0], error: null });
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({ single: mockSingle })
    });

    // Set up mock chain for delete
    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    });

    // Set up mock chain for update
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    });
  });

  describe('fetching bookmarks', () => {
    it('fetches bookmarks successfully', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.bookmarks).toEqual(mockBookmarks);
    });

    it('returns loading state initially', () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('flattens display_name from joined questions table', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Each bookmark should have display_name at top level (for filtering by test type)
      expect(result.current.bookmarks?.[0]).toHaveProperty('display_name', 'T1A01');
      expect(result.current.bookmarks?.[1]).toHaveProperty('display_name', 'T1A02');
    });
  });

  describe('isBookmarked', () => {
    it('returns true for bookmarked questions', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isBookmarked('T1A01')).toBe(true);
      expect(result.current.isBookmarked('T1A02')).toBe(true);
    });

    it('returns false for non-bookmarked questions', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isBookmarked('T1A99')).toBe(false);
    });
  });

  describe('getBookmarkNote', () => {
    it('returns note for bookmarked question with note', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.getBookmarkNote('T1A01')).toBe('Test note');
    });

    it('returns null for bookmarked question without note', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.getBookmarkNote('T1A02')).toBe(null);
    });

    it('returns null for non-bookmarked question', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.getBookmarkNote('T1A99')).toBe(null);
    });
  });

  describe('addBookmark mutation', () => {
    it('provides addBookmark mutation function', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.addBookmark).toBeDefined();
      expect(typeof result.current.addBookmark.mutateAsync).toBe('function');
    });

    it('calls insert with correct parameters', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addBookmark.mutateAsync({ questionId: 'T1A03', note: 'New note' });
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'test-user-id',
        question_id: 'T1A03',
        note: 'New note',
      }));
    });

    it('calls insert with null note when not provided', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.addBookmark.mutateAsync({ questionId: 'T1A03' });
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'test-user-id',
        question_id: 'T1A03',
        note: null,
      }));
    });
  });

  describe('removeBookmark mutation', () => {
    it('provides removeBookmark mutation function', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.removeBookmark).toBeDefined();
      expect(typeof result.current.removeBookmark.mutateAsync).toBe('function');
    });

    it('calls delete on remove', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.removeBookmark.mutateAsync('T1A01');
      });

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('updateNote mutation', () => {
    it('provides updateNote mutation function', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.updateNote).toBeDefined();
      expect(typeof result.current.updateNote.mutateAsync).toBe('function');
    });

    it('calls update with correct note', async () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.updateNote.mutateAsync({ questionId: 'T1A01', note: 'Updated note' });
      });

      expect(mockUpdate).toHaveBeenCalledWith({ note: 'Updated note' });
    });
  });

  describe('when user is not authenticated', () => {
    it('returns empty bookmarks', async () => {
      const { useAuth } = await import('./useAuth');
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      // Query should be disabled, so bookmarks should be undefined
      expect(result.current.bookmarks).toBeUndefined();
    });
  });
});
