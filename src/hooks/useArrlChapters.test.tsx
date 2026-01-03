import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Use vi.hoisted to declare mocks that can be used in vi.mock factories
const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
}));

import {
  useArrlChapters,
  useArrlChaptersWithCounts,
  useArrlChapter,
  useChapterMutations,
} from './useArrlChapters';

const mockChaptersData = [
  {
    id: 'chapter-1',
    license_type: 'T',
    chapter_number: 1,
    title: 'Welcome to Amateur Radio',
    description: 'Introduction to ham radio',
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'chapter-2',
    license_type: 'T',
    chapter_number: 2,
    title: 'Radio and Signals Fundamentals',
    description: null,
    display_order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockQuestionCounts = [
  { chapter_id: 'chapter-1', question_count: 15 },
  { chapter_id: 'chapter-2', question_count: 20 },
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

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe('useArrlChapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useArrlChapters hook', () => {
    beforeEach(() => {
      // Set up mock chain for basic select
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockChaptersData, error: null }),
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockChaptersData, error: null }),
            }),
          }),
        }),
      });
    });

    it('fetches all chapters successfully', async () => {
      const { result } = renderHook(() => useArrlChapters(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]).toMatchObject({
        id: 'chapter-1',
        licenseType: 'T',
        chapterNumber: 1,
        title: 'Welcome to Amateur Radio',
      });
    });

    it('filters chapters by license type', async () => {
      // Set up mock chain for select with eq (when license type is provided)
      const mockEq = vi.fn().mockResolvedValue({ data: mockChaptersData, error: null });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: mockEq,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useArrlChapters('T'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockFrom).toHaveBeenCalledWith('arrl_chapters');
      expect(mockEq).toHaveBeenCalledWith('license_type', 'T');
    });

    it('returns loading state initially', () => {
      const { result } = renderHook(() => useArrlChapters(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('transforms database rows to ArrlChapter interface', async () => {
      const { result } = renderHook(() => useArrlChapters(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const chapter = result.current.data?.[0];
      expect(chapter).toHaveProperty('licenseType'); // camelCase
      expect(chapter).toHaveProperty('chapterNumber'); // camelCase
      expect(chapter).toHaveProperty('displayOrder'); // camelCase
      expect(chapter).toHaveProperty('createdAt'); // camelCase
      expect(chapter).toHaveProperty('updatedAt'); // camelCase
    });

    it('handles fetch error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
          }),
        }),
      });

      const { result } = renderHook(() => useArrlChapters(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useArrlChaptersWithCounts hook', () => {
    beforeEach(() => {
      // Mock the chapter fetch
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockChaptersData, error: null }),
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockChaptersData, error: null }),
            }),
          }),
        }),
      });

      // Mock the RPC call
      mockRpc.mockResolvedValue({ data: mockQuestionCounts, error: null });
    });

    it('fetches chapters with question counts', async () => {
      const { result } = renderHook(() => useArrlChaptersWithCounts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]).toMatchObject({
        id: 'chapter-1',
        questionCount: 15,
      });
      expect(result.current.data?.[1]).toMatchObject({
        id: 'chapter-2',
        questionCount: 20,
      });
    });

    it('returns 0 for chapters with no questions', async () => {
      mockRpc.mockResolvedValue({
        data: [{ chapter_id: 'chapter-1', question_count: 10 }],
        error: null,
      });

      const { result } = renderHook(() => useArrlChaptersWithCounts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Chapter 2 has no count entry, should default to 0
      expect(result.current.data?.[1]?.questionCount).toBe(0);
    });

    it('calls RPC with license type filter', async () => {
      // Set up mock chain for select with eq (when license type is provided)
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockChaptersData, error: null }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useArrlChaptersWithCounts('T'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockRpc).toHaveBeenCalledWith('get_chapter_question_counts', {
        license_prefix: 'T',
      });
    });

    it('handles RPC error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: new Error('RPC failed'),
      });

      const { result } = renderHook(() => useArrlChaptersWithCounts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('handles chapter fetch error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('Chapters error') }),
          }),
        }),
      });

      const { result } = renderHook(() => useArrlChaptersWithCounts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useArrlChapter hook', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockChaptersData[0], error: null }),
          }),
        }),
      });
    });

    it('fetches a single chapter by ID', async () => {
      const { result } = renderHook(() => useArrlChapter('chapter-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toMatchObject({
        id: 'chapter-1',
        title: 'Welcome to Amateur Radio',
      });
    });

    it('is disabled when ID is undefined', () => {
      const { result } = renderHook(() => useArrlChapter(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('handles error when chapter not found', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Chapter not found'),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useArrlChapter('nonexistent'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useChapterMutations', () => {
    let queryClient: QueryClient;
    let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

    beforeEach(async () => {
      queryClient = createTestQueryClient();
      wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      // Clear toast mocks
      const { toast } = await import('sonner');
      vi.mocked(toast.success).mockClear();
      vi.mocked(toast.error).mockClear();
    });

    describe('addChapter mutation', () => {
      it('adds a chapter successfully', async () => {
        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockChaptersData[0], error: null }),
          }),
        });
        mockFrom.mockReturnValue({ insert: mockInsert });

        const { result } = renderHook(() => useChapterMutations(), { wrapper });

        await act(async () => {
          result.current.addChapter.mutate({
            licenseType: 'T',
            chapterNumber: 3,
            title: 'New Chapter',
            description: 'Test description',
          });
        });

        await waitFor(() => expect(result.current.addChapter.isSuccess).toBe(true));

        const { toast } = await import('sonner');
        expect(toast.success).toHaveBeenCalledWith('Chapter added successfully');
      });

      it('handles duplicate key error', async () => {
        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'duplicate key value violates unique constraint' },
            }),
          }),
        });
        mockFrom.mockReturnValue({ insert: mockInsert });

        const { result } = renderHook(() => useChapterMutations(), { wrapper });

        await act(async () => {
          result.current.addChapter.mutate({
            licenseType: 'T',
            chapterNumber: 1,
            title: 'Duplicate Chapter',
          });
        });

        await waitFor(() => expect(result.current.addChapter.isError).toBe(true));

        const { toast } = await import('sonner');
        expect(toast.error).toHaveBeenCalledWith(
          'A chapter with this number already exists for this license type'
        );
      });

      it('handles generic error', async () => {
        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        });
        mockFrom.mockReturnValue({ insert: mockInsert });

        const { result } = renderHook(() => useChapterMutations(), { wrapper });

        await act(async () => {
          result.current.addChapter.mutate({
            licenseType: 'T',
            chapterNumber: 3,
            title: 'New Chapter',
          });
        });

        await waitFor(() => expect(result.current.addChapter.isError).toBe(true));

        const { toast } = await import('sonner');
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to add chapter')
        );
      });

      it('uses chapter number as display order when not specified', async () => {
        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockChaptersData[0], error: null }),
          }),
        });
        mockFrom.mockReturnValue({ insert: mockInsert });

        const { result } = renderHook(() => useChapterMutations(), { wrapper });

        await act(async () => {
          result.current.addChapter.mutate({
            licenseType: 'T',
            chapterNumber: 5,
            title: 'New Chapter',
          });
        });

        await waitFor(() => expect(result.current.addChapter.isSuccess).toBe(true));

        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            display_order: 5,
          })
        );
      });
    });

    describe('updateChapter mutation', () => {
      it('updates a chapter successfully', async () => {
        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockChaptersData[0], error: null }),
            }),
          }),
        });
        mockFrom.mockReturnValue({ update: mockUpdate });

        const { result } = renderHook(() => useChapterMutations(), { wrapper });

        await act(async () => {
          result.current.updateChapter.mutate({
            id: 'chapter-1',
            title: 'Updated Title',
          });
        });

        await waitFor(() => expect(result.current.updateChapter.isSuccess).toBe(true));

        const { toast } = await import('sonner');
        expect(toast.success).toHaveBeenCalledWith('Chapter updated successfully');
      });

      it('handles update error', async () => {
        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' },
              }),
            }),
          }),
        });
        mockFrom.mockReturnValue({ update: mockUpdate });

        const { result } = renderHook(() => useChapterMutations(), { wrapper });

        await act(async () => {
          result.current.updateChapter.mutate({
            id: 'chapter-1',
            title: 'Updated Title',
          });
        });

        await waitFor(() => expect(result.current.updateChapter.isError).toBe(true));
      });

      it('handles duplicate key error on update', async () => {
        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'duplicate key value violates unique constraint' },
              }),
            }),
          }),
        });
        mockFrom.mockReturnValue({ update: mockUpdate });

        const { result } = renderHook(() => useChapterMutations(), { wrapper });

        await act(async () => {
          result.current.updateChapter.mutate({
            id: 'chapter-1',
            chapterNumber: 2, // Already exists
            title: 'Updated Title',
          });
        });

        await waitFor(() => expect(result.current.updateChapter.isError).toBe(true));

        const { toast } = await import('sonner');
        expect(toast.error).toHaveBeenCalledWith(
          'A chapter with this number already exists for this license type'
        );
      });
    });

    describe('deleteChapter mutation', () => {
      it('deletes a chapter successfully', async () => {
        const mockDelete = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        });
        mockFrom.mockReturnValue({ delete: mockDelete });

        const { result } = renderHook(() => useChapterMutations(), { wrapper });

        await act(async () => {
          result.current.deleteChapter.mutate('chapter-1');
        });

        await waitFor(() => expect(result.current.deleteChapter.isSuccess).toBe(true));

        const { toast } = await import('sonner');
        expect(toast.success).toHaveBeenCalledWith('Chapter deleted successfully');
      });

      it('handles delete error', async () => {
        const mockDelete = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        });
        mockFrom.mockReturnValue({ delete: mockDelete });

        const { result } = renderHook(() => useChapterMutations(), { wrapper });

        await act(async () => {
          result.current.deleteChapter.mutate('chapter-1');
        });

        await waitFor(() => expect(result.current.deleteChapter.isError).toBe(true));

        const { toast } = await import('sonner');
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to delete chapter')
        );
      });
    });

    describe('cache invalidation', () => {
      it('invalidates related queries on successful add', async () => {
        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockChaptersData[0], error: null }),
          }),
        });
        mockFrom.mockReturnValue({ insert: mockInsert });

        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useChapterMutations(), { wrapper });

        await act(async () => {
          result.current.addChapter.mutate({
            licenseType: 'T',
            chapterNumber: 3,
            title: 'New Chapter',
          });
        });

        await waitFor(() => expect(result.current.addChapter.isSuccess).toBe(true));

        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['arrl-chapters-with-counts'],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['arrl-chapters'],
        });
      });

      it('invalidates arrl-chapter query on successful update', async () => {
        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockChaptersData[0], error: null }),
            }),
          }),
        });
        mockFrom.mockReturnValue({ update: mockUpdate });

        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useChapterMutations(), { wrapper });

        await act(async () => {
          result.current.updateChapter.mutate({
            id: 'chapter-1',
            title: 'Updated Title',
          });
        });

        await waitFor(() => expect(result.current.updateChapter.isSuccess).toBe(true));

        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['arrl-chapter'],
        });
      });
    });
  });
});
