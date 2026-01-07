import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LessonDetailPage } from './LessonDetailPage';
import { Lesson, LessonTopic } from '@/types/lessons';
import { TopicProgress } from '@/hooks/useTopics';
import { AppNavigationProvider } from '@/hooks/useAppNavigation';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
}));

// Mock LessonPath component
vi.mock('./LessonPath', () => ({
  LessonPath: ({ topics, currentTopicIndex, onTopicClick }: { topics: LessonTopic[], currentTopicIndex: number, onTopicClick: (slug: string) => void }) => (
    <div data-testid="lesson-path">
      <span>Topics: {topics.length}</span>
      <span>Current: {currentTopicIndex}</span>
      <button onClick={() => onTopicClick('test-topic')}>Navigate</button>
    </div>
  ),
}));

// Mock CircularProgress component
vi.mock('@/components/ui/circular-progress', () => ({
  CircularProgress: ({ value, children }: { value: number; children: React.ReactNode }) => (
    <div data-testid="circular-progress" data-value={value}>
      {children}
    </div>
  ),
}));

// Sample test data
const mockTopics: LessonTopic[] = [
  {
    id: 'lt-1',
    lesson_id: 'lesson-1',
    topic_id: 'topic-1',
    display_order: 0,
    topic: {
      id: 'topic-1',
      slug: 'amateur-radio-basics',
      title: 'Amateur Radio Basics',
      description: 'Introduction to amateur radio',
      thumbnail_url: null,
      display_order: 1,
      is_published: true,
      license_types: ['technician'],
      content_path: null,
      edit_history: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      subelements: [],
      resources: [],
    },
  },
  {
    id: 'lt-2',
    lesson_id: 'lesson-1',
    topic_id: 'topic-2',
    display_order: 1,
    topic: {
      id: 'topic-2',
      slug: 'frequency-bands',
      title: 'Frequency Bands',
      description: 'Understanding frequency allocations',
      thumbnail_url: null,
      display_order: 2,
      is_published: true,
      license_types: ['technician', 'general'],
      content_path: null,
      edit_history: [],
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      subelements: [],
      resources: [],
    },
  },
];

const mockLesson: Lesson = {
  id: 'lesson-1',
  slug: 'getting-started',
  title: 'Getting Started with Ham Radio',
  description: 'Your first steps into amateur radio',
  thumbnail_url: null,
  display_order: 1,
  is_published: true,
  license_types: ['technician'],
  edit_history: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  topics: mockTopics,
};

const mockTopicProgress: TopicProgress[] = [
  {
    id: 'progress-1',
    user_id: 'user-1',
    topic_id: 'topic-1',
    is_completed: true,
    completed_at: '2024-01-01T00:00:00Z',
  },
];

let mockLessonData: Lesson | null = mockLesson;
let mockLessonLoading = false;
let mockLessonError: Error | null = null;
let mockProgressData: TopicProgress[] = mockTopicProgress;

vi.mock('@/hooks/useLessons', () => ({
  useLesson: () => ({
    data: mockLessonData,
    isLoading: mockLessonLoading,
    error: mockLessonError,
  }),
}));

vi.mock('@/hooks/useTopics', () => ({
  useTopicProgress: () => ({
    data: mockProgressData,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
  }),
}));

describe('LessonDetailPage', () => {
  let queryClient: QueryClient;
  const mockOnBack = vi.fn();

  const renderComponent = (slug: string = 'getting-started') => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AppNavigationProvider>
            <LessonDetailPage slug={slug} onBack={mockOnBack} />
          </AppNavigationProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLessonData = mockLesson;
    mockLessonLoading = false;
    mockLessonError = null;
    mockProgressData = mockTopicProgress;
  });

  describe('Loading State', () => {
    it('should show loading skeleton when lesson is loading', () => {
      mockLessonLoading = true;
      const { container } = renderComponent();

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show multiple skeleton placeholders', () => {
      mockLessonLoading = true;
      const { container } = renderComponent();

      // Should have skeleton for title, description, progress, and topic items
      const skeletons = container.querySelectorAll('.rounded-full');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should show error state when lesson not found', () => {
      mockLessonData = null;
      renderComponent();

      expect(screen.getByText('Lesson not found')).toBeInTheDocument();
      expect(screen.getByText("The lesson you're looking for doesn't exist or has been removed.")).toBeInTheDocument();
    });

    it('should show error state when there is an error', () => {
      mockLessonError = new Error('Failed to load');
      renderComponent();

      expect(screen.getByText('Lesson not found')).toBeInTheDocument();
    });

    it('should show Back to Lessons button in error state', () => {
      mockLessonData = null;
      renderComponent();

      expect(screen.getByText('Back to Lessons')).toBeInTheDocument();
    });

    it('should call onBack when Back to Lessons is clicked in error state', () => {
      mockLessonData = null;
      renderComponent();

      fireEvent.click(screen.getByText('Back to Lessons'));
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    it('should render lesson title', () => {
      renderComponent();
      expect(screen.getByText('Getting Started with Ham Radio')).toBeInTheDocument();
    });

    it('should render lesson description', () => {
      renderComponent();
      expect(screen.getByText('Your first steps into amateur radio')).toBeInTheDocument();
    });

    it('should render Back to Lessons button in header', () => {
      renderComponent();
      expect(screen.getByText('Back to Lessons')).toBeInTheDocument();
    });

    it('should render LessonPath component', () => {
      renderComponent();
      expect(screen.getByTestId('lesson-path')).toBeInTheDocument();
    });

    it('should render CircularProgress component', () => {
      renderComponent();
      expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
    });

    it('should pass correct topic count to LessonPath', () => {
      renderComponent();
      expect(screen.getByText('Topics: 2')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate completion percentage correctly', () => {
      renderComponent();

      const progress = screen.getByTestId('circular-progress');
      // 1 of 2 topics completed = 50%
      expect(progress.getAttribute('data-value')).toBe('50');
    });

    it('should show 0% when no topics completed', () => {
      mockProgressData = [];
      renderComponent();

      const progress = screen.getByTestId('circular-progress');
      expect(progress.getAttribute('data-value')).toBe('0');
    });

    it('should show 100% when all topics completed', () => {
      mockProgressData = [
        { id: 'p1', user_id: 'user-1', topic_id: 'topic-1', is_completed: true, completed_at: '2024-01-01' },
        { id: 'p2', user_id: 'user-1', topic_id: 'topic-2', is_completed: true, completed_at: '2024-01-02' },
      ];
      renderComponent();

      const progress = screen.getByTestId('circular-progress');
      expect(progress.getAttribute('data-value')).toBe('100');
    });

    it('should display completed count in progress text', () => {
      renderComponent();
      expect(screen.getByText('1/2')).toBeInTheDocument();
      expect(screen.getByText('topics completed')).toBeInTheDocument();
    });

    it('should identify current topic index correctly', () => {
      renderComponent();
      // First topic is completed, so current should be index 1 (second topic)
      expect(screen.getByText('Current: 1')).toBeInTheDocument();
    });

    it('should set current index to total when all completed', () => {
      mockProgressData = [
        { id: 'p1', user_id: 'user-1', topic_id: 'topic-1', is_completed: true, completed_at: '2024-01-01' },
        { id: 'p2', user_id: 'user-1', topic_id: 'topic-2', is_completed: true, completed_at: '2024-01-02' },
      ];
      renderComponent();

      // All completed, so currentTopicIndex should be 2 (totalCount)
      expect(screen.getByText('Current: 2')).toBeInTheDocument();
    });
  });

  describe('Lesson Completion', () => {
    it('should show completion celebration when all topics completed', () => {
      mockProgressData = [
        { id: 'p1', user_id: 'user-1', topic_id: 'topic-1', is_completed: true, completed_at: '2024-01-01' },
        { id: 'p2', user_id: 'user-1', topic_id: 'topic-2', is_completed: true, completed_at: '2024-01-02' },
      ];
      renderComponent();

      expect(screen.getByText('Lesson Complete!')).toBeInTheDocument();
      expect(screen.getByText("You've completed all 2 topics in this lesson.")).toBeInTheDocument();
    });

    it('should not show completion celebration when not all topics completed', () => {
      renderComponent();

      expect(screen.queryByText('Lesson Complete!')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should call onBack when back button is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Back to Lessons'));
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('No Description', () => {
    it('should not show description when null', () => {
      mockLessonData = { ...mockLesson, description: null };
      renderComponent();

      expect(screen.queryByText('Your first steps into amateur radio')).not.toBeInTheDocument();
    });
  });

  describe('Empty Topics', () => {
    it('should handle lesson with no topics', () => {
      mockLessonData = { ...mockLesson, topics: [] };
      renderComponent();

      // Should show 0/0 completed
      expect(screen.getByText('0/0')).toBeInTheDocument();
      expect(screen.getByText('Topics: 0')).toBeInTheDocument();
    });

    it('should show 0% when no topics', () => {
      mockLessonData = { ...mockLesson, topics: [] };
      renderComponent();

      const progress = screen.getByTestId('circular-progress');
      expect(progress.getAttribute('data-value')).toBe('0');
    });

    it('should not show completion celebration when no topics', () => {
      mockLessonData = { ...mockLesson, topics: [] };
      renderComponent();

      expect(screen.queryByText('Lesson Complete!')).not.toBeInTheDocument();
    });
  });

  describe('No Progress Data', () => {
    it('should handle undefined topic progress gracefully', () => {
      mockProgressData = undefined as unknown as TopicProgress[];
      renderComponent();

      // Should show 0% progress
      const progress = screen.getByTestId('circular-progress');
      expect(progress.getAttribute('data-value')).toBe('0');
    });
  });
});
