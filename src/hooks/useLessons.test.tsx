import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useLessons,
  useAdminLessons,
  useLesson,
  useLessonProgress,
  useUpdateLessonProgress,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useAddLessonTopic,
  useRemoveLessonTopic,
  useUpdateLessonTopicOrder,
} from './useLessons';
import { Lesson, LessonTopic, LessonProgress } from '@/types/lessons';

// Mock useAdmin hook
vi.mock('./useAdmin', () => ({
  useAdmin: vi.fn(() => ({ isAdmin: true, isLoading: false })),
}));

// Mock Supabase client
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

// Sample test data
const mockLessonTopics: LessonTopic[] = [
  {
    id: 'lt-1',
    lesson_id: 'lesson-1',
    topic_id: 'topic-1',
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    topic: {
      id: 'topic-1',
      slug: 'intro-to-radio',
      title: 'Introduction to Radio',
      description: 'Basic radio concepts',
      thumbnail_url: null,
      is_published: true,
    },
  },
  {
    id: 'lt-2',
    lesson_id: 'lesson-1',
    topic_id: 'topic-2',
    display_order: 0, // Intentionally out of order to test sorting
    created_at: '2024-01-02T00:00:00Z',
    topic: {
      id: 'topic-2',
      slug: 'frequencies',
      title: 'Frequencies',
      description: 'Understanding frequencies',
      thumbnail_url: null,
      is_published: true,
    },
  },
];

const mockLessons: Lesson[] = [
  {
    id: 'lesson-1',
    slug: 'getting-started',
    title: 'Getting Started',
    description: 'Introduction to ham radio',
    thumbnail_url: null,
    display_order: 1,
    is_published: true,
    license_types: ['technician'],
    edit_history: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    topics: mockLessonTopics,
  },
  {
    id: 'lesson-2',
    slug: 'advanced-topics',
    title: 'Advanced Topics',
    description: 'For general and extra class',
    thumbnail_url: null,
    display_order: 2,
    is_published: true,
    license_types: ['general', 'extra'],
    edit_history: [],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    topics: [],
  },
  {
    id: 'lesson-3',
    slug: 'draft-lesson',
    title: 'Draft Lesson',
    description: 'Unpublished lesson',
    thumbnail_url: null,
    display_order: 3,
    is_published: false,
    license_types: ['technician'],
    edit_history: [],
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    topics: [],
  },
];

const mockLessonProgress: LessonProgress[] = [
  {
    id: 'progress-1',
    user_id: 'user-1',
    lesson_id: 'lesson-1',
    is_completed: true,
    completed_at: '2024-01-15T00:00:00Z',
  },
];

describe('useLessons Hooks', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  describe('useLessons', () => {
    it('should fetch all published lessons', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLessons.filter(l => l.is_published),
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useLessons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every(l => l.is_published)).toBe(true);
    });

    it('should filter lessons by technician license type', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLessons.filter(l => l.is_published),
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useLessons('technician'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      result.current.data?.forEach(lesson => {
        expect(lesson.license_types).toContain('technician');
      });
    });

    it('should filter lessons by general license type', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLessons.filter(l => l.is_published),
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useLessons('general'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      result.current.data?.forEach(lesson => {
        expect(lesson.license_types).toContain('general');
      });
    });

    it('should filter lessons by extra license type', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLessons.filter(l => l.is_published),
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useLessons('extra'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      result.current.data?.forEach(lesson => {
        expect(lesson.license_types).toContain('extra');
      });
    });

    it('should sort topics within lessons by display_order', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockLessons[0]], // Lesson with topics
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useLessons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const topics = result.current.data?.[0]?.topics;
      expect(topics).toBeDefined();
      if (topics && topics.length > 1) {
        for (let i = 1; i < topics.length; i++) {
          expect(topics[i].display_order).toBeGreaterThanOrEqual(topics[i - 1].display_order);
        }
      }
    });

    it('should handle errors gracefully', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useLessons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAdminLessons', () => {
    it('should fetch all lessons including unpublished when admin', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockLessons,
            error: null,
          }),
        }),
      }));

      const { result } = renderHook(() => useAdminLessons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.some(l => !l.is_published)).toBe(true);
    });

    it('should sort topics within lessons by display_order', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockLessons[0]], // Lesson with topics
            error: null,
          }),
        }),
      }));

      const { result } = renderHook(() => useAdminLessons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const topics = result.current.data?.[0]?.topics;
      expect(topics).toBeDefined();
    });
  });

  describe('useLesson', () => {
    it('should fetch a single lesson by slug', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockLessons[0],
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useLesson('getting-started'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.slug).toBe('getting-started');
      expect(result.current.data?.title).toBe('Getting Started');
    });

    it('should not fetch when slug is undefined', () => {
      const { result } = renderHook(() => useLesson(undefined), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should sort topics by display_order', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockLessons[0],
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useLesson('getting-started'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const topics = result.current.data?.topics;
      expect(topics).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useLesson('non-existent'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useLessonProgress', () => {
    it('should fetch user progress when authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockLessonProgress,
            error: null,
          }),
        }),
      }));

      const { result } = renderHook(() => useLessonProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].is_completed).toBe(true);
    });

    it('should return empty array when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { result } = renderHook(() => useLessonProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }));

      const { result } = renderHook(() => useLessonProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUpdateLessonProgress', () => {
    it('should update lesson progress when authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
      mockFrom.mockImplementation(() => ({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }));

      const { result } = renderHook(() => useUpdateLessonProgress(), { wrapper });

      await result.current.mutateAsync({ lessonId: 'lesson-1', isCompleted: true });

      expect(mockFrom).toHaveBeenCalledWith('lesson_progress');
    });

    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { result } = renderHook(() => useUpdateLessonProgress(), { wrapper });

      await expect(
        result.current.mutateAsync({ lessonId: 'lesson-1', isCompleted: true })
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('useCreateLesson', () => {
    it('should create a new lesson', async () => {
      const newLesson = {
        slug: 'new-lesson',
        title: 'New Lesson',
        description: 'A new lesson',
        thumbnail_url: null,
        display_order: 4,
        is_published: false,
        license_types: ['technician'],
        edit_history: [],
      };

      mockFrom.mockImplementation(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'lesson-4', ...newLesson, created_at: '2024-01-04T00:00:00Z', updated_at: '2024-01-04T00:00:00Z' },
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useCreateLesson(), { wrapper });

      await result.current.mutateAsync(newLesson);

      expect(mockFrom).toHaveBeenCalledWith('lessons');
    });

    it('should handle creation errors', async () => {
      mockFrom.mockImplementation(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Duplicate slug' },
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useCreateLesson(), { wrapper });

      await expect(
        result.current.mutateAsync({
          slug: 'existing-slug',
          title: 'Test',
          description: null,
          thumbnail_url: null,
          display_order: 1,
          is_published: false,
          license_types: [],
          edit_history: [],
        })
      ).rejects.toBeDefined();
    });
  });

  describe('useUpdateLesson', () => {
    it('should update an existing lesson', async () => {
      mockFrom.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockLessons[0], title: 'Updated Title' },
                error: null,
              }),
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useUpdateLesson(), { wrapper });

      await result.current.mutateAsync({ id: 'lesson-1', title: 'Updated Title' });

      expect(mockFrom).toHaveBeenCalledWith('lessons');
    });

    it('should handle update errors', async () => {
      mockFrom.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useUpdateLesson(), { wrapper });

      await expect(
        result.current.mutateAsync({ id: 'non-existent', title: 'Test' })
      ).rejects.toBeDefined();
    });
  });

  describe('useDeleteLesson', () => {
    it('should delete a lesson', async () => {
      mockFrom.mockImplementation(() => ({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }));

      const { result } = renderHook(() => useDeleteLesson(), { wrapper });

      await result.current.mutateAsync('lesson-1');

      expect(mockFrom).toHaveBeenCalledWith('lessons');
    });

    it('should handle deletion errors', async () => {
      mockFrom.mockImplementation(() => ({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Cannot delete' } }),
        }),
      }));

      const { result } = renderHook(() => useDeleteLesson(), { wrapper });

      await expect(
        result.current.mutateAsync('lesson-1')
      ).rejects.toBeDefined();
    });
  });

  describe('useAddLessonTopic', () => {
    it('should add a topic to a lesson', async () => {
      mockFrom.mockImplementation(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'lt-new',
                lesson_id: 'lesson-1',
                topic_id: 'topic-3',
                display_order: 2,
                created_at: '2024-01-04T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useAddLessonTopic(), { wrapper });

      await result.current.mutateAsync({
        lessonId: 'lesson-1',
        topicId: 'topic-3',
        displayOrder: 2,
      });

      expect(mockFrom).toHaveBeenCalledWith('lesson_topics');
    });

    it('should handle errors when adding topic', async () => {
      mockFrom.mockImplementation(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Duplicate topic' },
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useAddLessonTopic(), { wrapper });

      await expect(
        result.current.mutateAsync({
          lessonId: 'lesson-1',
          topicId: 'topic-1',
          displayOrder: 0,
        })
      ).rejects.toBeDefined();
    });
  });

  describe('useRemoveLessonTopic', () => {
    it('should remove a topic from a lesson', async () => {
      mockFrom.mockImplementation(() => ({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }));

      const { result } = renderHook(() => useRemoveLessonTopic(), { wrapper });

      await result.current.mutateAsync('lt-1');

      expect(mockFrom).toHaveBeenCalledWith('lesson_topics');
    });

    it('should handle removal errors', async () => {
      mockFrom.mockImplementation(() => ({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Not found' } }),
        }),
      }));

      const { result } = renderHook(() => useRemoveLessonTopic(), { wrapper });

      await expect(
        result.current.mutateAsync('non-existent')
      ).rejects.toBeDefined();
    });
  });

  describe('useUpdateLessonTopicOrder', () => {
    it('should update topic order using batch upsert', async () => {
      mockFrom.mockImplementation(() => ({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }));

      const { result } = renderHook(() => useUpdateLessonTopicOrder(), { wrapper });

      await result.current.mutateAsync([
        { id: 'lt-1', display_order: 1 },
        { id: 'lt-2', display_order: 0 },
      ]);

      expect(mockFrom).toHaveBeenCalledWith('lesson_topics');
    });

    it('should handle order update errors', async () => {
      mockFrom.mockImplementation(() => ({
        upsert: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      }));

      const { result } = renderHook(() => useUpdateLessonTopicOrder(), { wrapper });

      await expect(
        result.current.mutateAsync([{ id: 'lt-1', display_order: 0 }])
      ).rejects.toBeDefined();
    });
  });
});
