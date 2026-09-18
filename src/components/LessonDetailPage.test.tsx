import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LessonDetailPage } from './LessonDetailPage';
import { muiWrapper } from '@/test/utils/testWrappers';
import { Lesson, LessonTopic } from '@/types/lessons';
import { TopicProgress } from '@/hooks/useTopics';
import { AppNavigationProvider } from '@/hooks/useAppNavigation';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const { framerMotionMock } = await import('@/test/mocks/framerMotion');
  return framerMotionMock();
});

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
      </BrowserRouter>,
      { wrapper: muiWrapper }
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
      renderComponent();

      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show multiple skeleton placeholders', () => {
      mockLessonLoading = true;
      renderComponent();

      // Title, description, progress and topic items each get a skeleton.
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
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

    it('should render the progress ring as a named meter', () => {
      renderComponent();
      expect(screen.getByRole('meter', { name: 'Lesson progress' })).toBeInTheDocument();
    });

    it('should pass correct topic count to LessonPath', () => {
      renderComponent();
      expect(screen.getByText('Topics: 2')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate completion percentage correctly', () => {
      renderComponent();

      // 1 of 2 topics completed = 50%
      const meter = screen.getByRole('meter', { name: 'Lesson progress' });
      expect(meter).toHaveAttribute('aria-valuenow', '50');
      expect(meter).toHaveAttribute('aria-valuetext', '1 of 2 topics completed');
    });

    it('should show 0% when no topics completed', () => {
      mockProgressData = [];
      renderComponent();

      expect(screen.getByRole('meter', { name: 'Lesson progress' })).toHaveAttribute(
        'aria-valuenow',
        '0'
      );
    });

    /**
     * #296. The old ring took its arc colour from a progressClassName prop, and
     * this page passed className instead — which landed on the wrapper and
     * never reached the arc, so the ring stayed amber at 100%. ScoreRing's
     * colour is a theme callback applied to the arc's fill; this reads the
     * rule it emits rather than trusting the prop.
     */
    const valueArcFill = () => {
      // ScoreRing sets the fill through sx on the chart's SvgLayer, as a
      // descendant rule that outranks Gauge's own default on the arc class.
      // Emotion's style tags also accumulate across this file's tests, so the
      // lookup is scoped to this render's layer class, not the first match.
      //
      // This is coupled to MUI X Gauge's class names and to how Emotion
      // serialises sx. If it starts returning null after a dependency bump,
      // the likely fix is re-deriving the selector (probe the DOM for where
      // the fill rule now lands), not a real regression in the ring's colour.
      const layer = document.querySelector('.MuiChartsSvgLayer-root');
      const own = Array.from(layer?.classList ?? []).find((c) => c.startsWith('css-'));
      const css = Array.from(document.querySelectorAll('style'))
        .map((tag) => tag.textContent ?? '')
        .join('\n');
      const rule = css
        .split('}')
        .find((r) => own && r.includes(`.${own}`) && r.includes('MuiGauge-valueArc') && r.includes('fill:'));
      return rule?.match(/fill:([^;]+)/)?.[1] ?? null;
    };

    it('draws the ring in the primary colour while incomplete', () => {
      renderComponent();

      expect(valueArcFill()).toContain('--mui-palette-primary-main');
    });

    it('turns the ring green once every topic is complete', () => {
      mockProgressData = [
        { topic_id: 'topic-1', is_completed: true },
        { topic_id: 'topic-2', is_completed: true },
      ];
      renderComponent();

      expect(valueArcFill()).toContain('--mui-palette-success-main');
    });

    it('should show 100% when all topics completed', () => {
      mockProgressData = [
        { id: 'p1', user_id: 'user-1', topic_id: 'topic-1', is_completed: true, completed_at: '2024-01-01' },
        { id: 'p2', user_id: 'user-1', topic_id: 'topic-2', is_completed: true, completed_at: '2024-01-02' },
      ];
      renderComponent();

      expect(screen.getByRole('meter', { name: 'Lesson progress' })).toHaveAttribute(
        'aria-valuenow',
        '100'
      );
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

      expect(screen.getByRole('meter', { name: 'Lesson progress' })).toHaveAttribute(
        'aria-valuenow',
        '0'
      );
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
      expect(screen.getByRole('meter', { name: 'Lesson progress' })).toHaveAttribute(
        'aria-valuenow',
        '0'
      );
    });
  });
});
