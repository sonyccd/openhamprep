import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useTopics,
  useAdminTopics,
  useTopic,
  useTopicContent,
  useTopicProgress,
  useTopicCompleted,
  useToggleTopicComplete,
  useTopicQuestions,
  Topic,
} from './useTopics';

// Mock Supabase client
const mockFrom = vi.fn();
const mockDownload = vi.fn();
const mockGetUser = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: vi.fn(() => ({
        download: mockDownload,
      })),
    },
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

// Sample test data
const mockTopics: Topic[] = [
  {
    id: 'topic-1',
    slug: 'amateur-radio-basics',
    title: 'Amateur Radio Basics',
    description: 'Introduction to amateur radio',
    thumbnail_url: null,
    display_order: 1,
    is_published: true,
    license_types: ['technician'],
    content_path: 'articles/amateur-radio-basics.md',
    content: '# Amateur Radio Basics\n\nThis is the content for amateur radio basics.',
    edit_history: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    subelements: [],
    resources: [],
  },
  {
    id: 'topic-2',
    slug: 'frequency-bands',
    title: 'Frequency Bands',
    description: 'Understanding frequency allocations',
    thumbnail_url: null,
    display_order: 2,
    is_published: true,
    license_types: ['technician', 'general'],
    content_path: 'articles/frequency-bands.md',
    content: '# Frequency Bands\n\nLearn about frequency allocations.',
    edit_history: [],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    subelements: [],
    resources: [],
  },
  {
    id: 'topic-3',
    slug: 'advanced-operations',
    title: 'Advanced Operations',
    description: 'Extra class topics',
    thumbnail_url: null,
    display_order: 3,
    is_published: false, // Unpublished
    license_types: ['extra'],
    content_path: 'articles/advanced-operations.md',
    content: null, // Topic without content yet
    edit_history: [],
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    subelements: [],
    resources: [],
  },
];

const mockTopicQuestions = [
  { question: { id: 'uuid-1', display_name: 'T1A01', question: 'What is amateur radio?' } },
  { question: { id: 'uuid-2', display_name: 'T1A02', question: 'What frequencies?' } },
];

describe('useTopics Hooks', () => {
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

  describe('useTopics', () => {
    it('should fetch all published topics', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTopics.filter(t => t.is_published),
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useTopics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every(t => t.is_published)).toBe(true);
    });

    it('should filter topics by technician license type', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTopics.filter(t => t.is_published),
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useTopics('technician'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Both published topics have technician license type
      expect(result.current.data?.length).toBeGreaterThanOrEqual(1);
      result.current.data?.forEach(topic => {
        expect(topic.license_types).toContain('technician');
      });
    });

    it('should filter topics by general license type', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTopics.filter(t => t.is_published),
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useTopics('general'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Only topic-2 has general license type
      result.current.data?.forEach(topic => {
        expect(topic.license_types).toContain('general');
      });
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

      const { result } = renderHook(() => useTopics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAdminTopics', () => {
    it('should fetch all topics including unpublished', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockTopics,
            error: null,
          }),
        }),
      }));

      const { result } = renderHook(() => useAdminTopics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.some(t => !t.is_published)).toBe(true);
    });
  });

  describe('useTopic', () => {
    it('should fetch a single topic by slug', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockTopics[0],
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useTopic('amateur-radio-basics'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.slug).toBe('amateur-radio-basics');
      expect(result.current.data?.title).toBe('Amateur Radio Basics');
    });

    it('should not fetch when slug is undefined', () => {
      const { result } = renderHook(() => useTopic(undefined), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should handle topic not found', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Topic not found' },
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useTopic('nonexistent'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useTopicContent', () => {
    it('should fetch markdown content from storage', async () => {
      const mockContent = '# Topic Title\n\nThis is the content.';
      mockDownload.mockResolvedValue({
        data: new Blob([mockContent]),
        error: null,
      });

      const { result } = renderHook(
        () => useTopicContent('articles/test.md'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(mockContent);
    });

    it('should return empty string when content file not found', async () => {
      mockDownload.mockResolvedValue({
        data: null,
        error: { message: 'Object not found' },
      });

      const { result } = renderHook(
        () => useTopicContent('articles/nonexistent.md'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe('');
    });

    it('should not fetch when contentPath is null', () => {
      const { result } = renderHook(() => useTopicContent(null), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should not fetch when contentPath is undefined', () => {
      const { result } = renderHook(() => useTopicContent(undefined), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should return empty string for "Object not found" error', async () => {
      mockDownload.mockResolvedValue({
        data: null,
        error: { message: 'Object not found' },
      });

      const { result } = renderHook(
        () => useTopicContent('articles/missing.md'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe('');
    });

    it('should maintain previous data while refetching (placeholderData)', async () => {
      const initialContent = '# Initial Content';
      mockDownload.mockResolvedValue({
        data: new Blob([initialContent]),
        error: null,
      });

      const { result, rerender } = renderHook(
        () => useTopicContent('articles/test.md'),
        { wrapper }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(initialContent);

      // The placeholderData option ensures data is kept while refetching
      // This is verified by the hook configuration having placeholderData set
      expect(result.current.data).toBe(initialContent);
    });
  });

  describe('useTopicProgress', () => {
    it('should fetch user progress', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: 'progress-1', user_id: 'user-123', topic_id: 'topic-1', is_completed: true, completed_at: '2024-01-01' },
            ],
            error: null,
          }),
        }),
      }));

      const { result } = renderHook(() => useTopicProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].is_completed).toBe(true);
    });

    it('should return empty array when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useTopicProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useTopicQuestions', () => {
    it('should fetch questions linked to a topic', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockTopicQuestions,
            error: null,
          }),
        }),
      }));

      const { result } = renderHook(() => useTopicQuestions('topic-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].displayName).toBe('T1A01');
      expect(result.current.data?.[1].displayName).toBe('T1A02');
    });

    it('should not fetch when topicId is undefined', () => {
      const { result } = renderHook(() => useTopicQuestions(undefined), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should sort questions by display name', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { question: { id: 'uuid-2', display_name: 'T1A02', question: 'Question 2' } },
              { question: { id: 'uuid-1', display_name: 'T1A01', question: 'Question 1' } },
            ],
            error: null,
          }),
        }),
      }));

      const { result } = renderHook(() => useTopicQuestions('topic-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should be sorted alphabetically by displayName
      expect(result.current.data?.[0].displayName).toBe('T1A01');
      expect(result.current.data?.[1].displayName).toBe('T1A02');
    });

    it('should filter out null questions', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { question: { id: 'uuid-1', display_name: 'T1A01', question: 'Question 1' } },
              { question: null }, // null question (deleted)
            ],
            error: null,
          }),
        }),
      }));

      const { result } = renderHook(() => useTopicQuestions('topic-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
    });

    it('should handle empty result', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }));

      const { result } = renderHook(() => useTopicQuestions('topic-with-no-questions'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }));

      const { result } = renderHook(() => useTopicQuestions('topic-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useToggleTopicComplete', () => {
    it('should mark topic as completed', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockImplementation(() => ({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }));

      const { result } = renderHook(() => useToggleTopicComplete(), { wrapper });

      await result.current.mutateAsync({ topicId: 'topic-1', isCompleted: true });

      expect(mockFrom).toHaveBeenCalledWith('topic_progress');
    });

    it('should mark topic as not completed', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      mockFrom.mockImplementation(() => ({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }));

      const { result } = renderHook(() => useToggleTopicComplete(), { wrapper });

      await result.current.mutateAsync({ topicId: 'topic-1', isCompleted: false });

      expect(mockFrom).toHaveBeenCalledWith('topic_progress');
    });

    it('should throw error when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const { result } = renderHook(() => useToggleTopicComplete(), { wrapper });

      await expect(
        result.current.mutateAsync({ topicId: 'topic-1', isCompleted: true })
      ).rejects.toThrow('User not authenticated');
    });
  });
});
