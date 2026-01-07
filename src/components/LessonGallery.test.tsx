import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LessonGallery } from './LessonGallery';
import { Lesson } from '@/types/lessons';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
}));

// Mock useAppNavigation
const mockNavigateToLesson = vi.fn();
vi.mock('@/hooks/useAppNavigation', () => ({
  useAppNavigation: () => ({
    navigateToLesson: mockNavigateToLesson,
  }),
}));

// Mock data
const mockLessons: Lesson[] = [
  {
    id: 'lesson-1',
    slug: 'getting-started',
    title: 'Getting Started with Ham Radio',
    description: 'Learn the basics of amateur radio',
    thumbnail_url: null,
    display_order: 1,
    is_published: true,
    license_types: ['technician'],
    edit_history: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    topics: [
      { id: 'lt-1', lesson_id: 'lesson-1', topic_id: 'topic-1', display_order: 0, created_at: '' },
      { id: 'lt-2', lesson_id: 'lesson-1', topic_id: 'topic-2', display_order: 1, created_at: '' },
    ],
  },
  {
    id: 'lesson-2',
    slug: 'radio-waves',
    title: 'Understanding Radio Waves',
    description: 'Dive deep into radio wave propagation',
    thumbnail_url: null,
    display_order: 2,
    is_published: true,
    license_types: ['technician', 'general'],
    edit_history: [],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    topics: [
      { id: 'lt-3', lesson_id: 'lesson-2', topic_id: 'topic-3', display_order: 0, created_at: '' },
    ],
  },
];

const mockTopicProgress = [
  { id: 'tp-1', user_id: 'user-1', topic_id: 'topic-1', is_completed: true, completed_at: '2024-01-15T00:00:00Z' },
  { id: 'tp-2', user_id: 'user-1', topic_id: 'topic-2', is_completed: true, completed_at: '2024-01-16T00:00:00Z' },
];

let mockLessonsData: Lesson[] | undefined = mockLessons;
let mockProgressData = mockTopicProgress;
let mockIsLoading = false;
let mockError: Error | null = null;

vi.mock('@/hooks/useLessons', () => ({
  useLessons: () => ({
    data: mockLessonsData,
    isLoading: mockIsLoading,
    error: mockError,
  }),
}));

vi.mock('@/hooks/useTopics', () => ({
  useTopicProgress: () => ({
    data: mockProgressData,
  }),
}));

describe('LessonGallery', () => {
  let queryClient: QueryClient;

  const renderComponent = (testType?: 'technician' | 'general' | 'extra') => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <LessonGallery testType={testType} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLessonsData = mockLessons;
    mockProgressData = mockTopicProgress;
    mockIsLoading = false;
    mockError = null;
  });

  describe('Rendering', () => {
    it('should render the Lessons heading', () => {
      renderComponent();
      expect(screen.getByText('Lessons')).toBeInTheDocument();
    });

    it('should render lesson cards', () => {
      renderComponent();
      expect(screen.getByText('Getting Started with Ham Radio')).toBeInTheDocument();
      expect(screen.getByText('Understanding Radio Waves')).toBeInTheDocument();
    });

    it('should show completion stats', () => {
      renderComponent();
      // Lesson 1 has 2 topics (both completed = 100%), Lesson 2 has 1 topic (0 completed)
      expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('Search lessons...')).toBeInTheDocument();
    });

    it('should render Route icon in header', () => {
      renderComponent();
      expect(document.querySelector('.lucide-route')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeletons when loading', () => {
      mockIsLoading = true;
      const { container } = renderComponent();

      // Check for skeleton elements
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show lessons when loading', () => {
      mockIsLoading = true;
      renderComponent();

      expect(screen.queryByText('Getting Started with Ham Radio')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message on error', () => {
      mockError = new Error('Failed to load');
      renderComponent();

      expect(screen.getByText('Failed to load lessons. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no lessons', () => {
      mockLessonsData = [];
      renderComponent();

      expect(screen.getByText('No lessons available')).toBeInTheDocument();
      expect(screen.getByText("Lessons will appear here once they're published.")).toBeInTheDocument();
    });

    it('should show no results message when search has no matches', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search lessons...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No lessons found')).toBeInTheDocument();
      expect(screen.getByText(/No lessons match "nonexistent"/)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter lessons by title', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search lessons...');
      fireEvent.change(searchInput, { target: { value: 'Getting' } });

      expect(screen.getByText('Getting Started with Ham Radio')).toBeInTheDocument();
      expect(screen.queryByText('Understanding Radio Waves')).not.toBeInTheDocument();
    });

    it('should filter lessons by description', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search lessons...');
      fireEvent.change(searchInput, { target: { value: 'propagation' } });

      expect(screen.queryByText('Getting Started with Ham Radio')).not.toBeInTheDocument();
      expect(screen.getByText('Understanding Radio Waves')).toBeInTheDocument();
    });

    it('should be case-insensitive', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search lessons...');
      fireEvent.change(searchInput, { target: { value: 'RADIO' } });

      expect(screen.getByText('Getting Started with Ham Radio')).toBeInTheDocument();
      expect(screen.getByText('Understanding Radio Waves')).toBeInTheDocument();
    });

    it('should update completion stats after filtering', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search lessons...');
      fireEvent.change(searchInput, { target: { value: 'Getting' } });

      // Only lesson 1 matches, which is 100% complete
      expect(screen.getByText('1 of 1 completed')).toBeInTheDocument();
    });
  });

  describe('Lesson Navigation', () => {
    it('should navigate to lesson when card is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Getting Started with Ham Radio'));

      expect(mockNavigateToLesson).toHaveBeenCalledWith('getting-started');
    });
  });

  describe('Completion Tracking', () => {
    it('should show completed badge on 100% completed lessons', () => {
      renderComponent();

      // Lesson 1 has all topics completed
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should show progress for partially completed lessons', () => {
      renderComponent();

      // Lesson 1: 2/2 topics = 100%
      expect(screen.getByText('2/2 topics')).toBeInTheDocument();
      expect(screen.getByText('100% complete')).toBeInTheDocument();

      // Lesson 2: 0/1 topics
      expect(screen.getByText('0/1 topics')).toBeInTheDocument();
      expect(screen.getByText('0% complete')).toBeInTheDocument();
    });

    it('should update completion count when all lessons completed', () => {
      mockProgressData = [
        { id: 'tp-1', user_id: 'user-1', topic_id: 'topic-1', is_completed: true, completed_at: '' },
        { id: 'tp-2', user_id: 'user-1', topic_id: 'topic-2', is_completed: true, completed_at: '' },
        { id: 'tp-3', user_id: 'user-1', topic_id: 'topic-3', is_completed: true, completed_at: '' },
      ];
      renderComponent();

      expect(screen.getByText('2 of 2 completed')).toBeInTheDocument();
    });

    it('should show 0 completed when no topics completed', () => {
      mockProgressData = [];
      renderComponent();

      expect(screen.getByText('0 of 2 completed')).toBeInTheDocument();
    });
  });

  describe('Lesson Completion Calculation', () => {
    it('should calculate completion percentage correctly', () => {
      // Lesson 1 has 2 topics, both completed = 100%
      // Lesson 2 has 1 topic, 0 completed = 0%
      renderComponent();

      expect(screen.getByText('100% complete')).toBeInTheDocument();
      expect(screen.getByText('0% complete')).toBeInTheDocument();
    });

    it('should handle lessons with no topics', () => {
      mockLessonsData = [
        {
          ...mockLessons[0],
          topics: [],
        },
      ];
      renderComponent();

      // 0% when no topics
      expect(screen.getByText('0% complete')).toBeInTheDocument();
      expect(screen.getByText('0/0 topics')).toBeInTheDocument();
    });
  });
});
