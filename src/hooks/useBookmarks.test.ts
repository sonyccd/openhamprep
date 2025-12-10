import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBookmarks } from './useBookmarks';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
  })),
}));

vi.mock('./usePostHog', () => ({
  usePostHog: vi.fn(() => ({
    capture: vi.fn(),
  })),
  ANALYTICS_EVENTS: {
    QUESTION_BOOKMARKED: 'question_bookmarked',
    BOOKMARK_REMOVED: 'bookmark_removed',
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockBookmarks = [
  {
    id: '1',
    user_id: 'test-user-id',
    question_id: 'T1A01',
    note: 'Important question',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'test-user-id',
    question_id: 'T1A02',
    note: null,
    created_at: '2024-01-02T00:00:00Z',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useBookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches bookmarks for authenticated user', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockBookmarks,
          error: null,
        }),
      }),
    });
    (supabase.from as any).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useBookmarks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bookmarks).toEqual(mockBookmarks);
  });

  it('does not fetch when user is not authenticated', () => {
    const { useAuth } = vi.mocked(await import('./useAuth'));
    useAuth.mockReturnValue({ user: null } as any);

    const { result } = renderHook(() => useBookmarks(), {
      wrapper: createWrapper(),
    });

    expect(result.current.bookmarks).toBeUndefined();
  });

  describe('addBookmark', () => {
    it('adds a bookmark successfully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { toast } = await import('sonner');
      const { usePostHog } = await import('./usePostHog');

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockBookmarks[0],
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: mockInsert,
      });

      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.addBookmark.mutateAsync({
          questionId: 'T1A01',
          note: 'Test note',
        });
      });

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        question_id: 'T1A01',
        note: 'Test note',
      });
      expect(toast.success).toHaveBeenCalledWith('Question bookmarked!');
      expect(usePostHog().capture).toHaveBeenCalled();
    });

    it('handles bookmark without note', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockBookmarks[1],
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: mockInsert,
      });

      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.addBookmark.mutateAsync({
          questionId: 'T1A02',
        });
      });

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        question_id: 'T1A02',
        note: null,
      });
    });

    it('handles errors when adding bookmark', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { toast } = await import('sonner');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockError = new Error('Database error');
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.addBookmark.mutateAsync({
            questionId: 'T1A01',
          });
        } catch (e) {
          // Expected
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to bookmark question');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeBookmark', () => {
    it('removes a bookmark successfully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { toast } = await import('sonner');

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockBookmarks,
              error: null,
            }),
          }),
        }),
        delete: mockDelete,
      });

      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.bookmarks).toBeDefined());

      await act(async () => {
        await result.current.removeBookmark.mutateAsync('T1A01');
      });

      expect(mockDelete).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Bookmark removed');
    });
  });

  describe('updateNote', () => {
    it('updates bookmark note successfully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { toast } = await import('sonner');

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockBookmarks,
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
      });

      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.bookmarks).toBeDefined());

      await act(async () => {
        await result.current.updateNote.mutateAsync({
          questionId: 'T1A01',
          note: 'Updated note',
        });
      });

      expect(mockUpdate).toHaveBeenCalledWith({ note: 'Updated note' });
      expect(toast.success).toHaveBeenCalledWith('Note updated');
    });
  });

  describe('helper functions', () => {
    it('isBookmarked returns true for bookmarked questions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockBookmarks,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.bookmarks).toBeDefined());

      expect(result.current.isBookmarked('T1A01')).toBe(true);
      expect(result.current.isBookmarked('T1A02')).toBe(true);
      expect(result.current.isBookmarked('T1A03')).toBe(false);
    });

    it('getBookmarkNote returns correct note', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockBookmarks,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.bookmarks).toBeDefined());

      expect(result.current.getBookmarkNote('T1A01')).toBe('Important question');
      expect(result.current.getBookmarkNote('T1A02')).toBeNull();
      expect(result.current.getBookmarkNote('T1A03')).toBeNull();
    });
  });
});
