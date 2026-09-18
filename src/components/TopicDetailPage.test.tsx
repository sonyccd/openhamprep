import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TopicDetailPage } from './TopicDetailPage';
import { muiWrapper } from '@/test/utils/testWrappers';
import { Topic } from '@/hooks/useTopics';
import { AppNavigationProvider } from '@/hooks/useAppNavigation';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const { framerMotionMock } = await import('@/test/mocks/framerMotion');
  return framerMotionMock();
});

// Mock child components to simplify testing
vi.mock('./TopicContent', () => ({
  TopicContent: ({ content }: { content: string }) => (
    <div data-testid="topic-content">{content}</div>
  ),
}));

vi.mock('./TopicResourcePanel', () => ({
  TopicResourcePanel: ({ resources }: { resources?: unknown[] }) => (
    <div data-testid="resource-panel">Resources: {resources?.length || 0}</div>
  ),
}));

vi.mock('./TopicQuestionsPanel', () => ({
  TopicQuestionsPanel: ({ topicId }: { topicId: string }) => (
    <div data-testid="questions-panel">Questions for: {topicId}</div>
  ),
}));

vi.mock('./TopicProgressButton', () => ({
  TopicProgressButton: ({ topicId }: { topicId: string }) => (
    <button data-testid="progress-button">Progress: {topicId}</button>
  ),
}));

// Mock topic data
const mockTopic: Topic = {
  id: 'topic-123',
  slug: 'amateur-radio-basics',
  title: 'Amateur Radio Basics',
  description: 'Introduction to amateur radio',
  thumbnail_url: null,
  display_order: 1,
  is_published: true,
  license_types: ['technician', 'general'],
  content_path: 'articles/amateur-radio-basics.md',
  content: '# Amateur Radio Basics\n\nThis is the content.',
  edit_history: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  subelements: [
    { id: 'sub-1', subelement: 'T1A', topic_id: 'topic-123' },
    { id: 'sub-2', subelement: 'T1B', topic_id: 'topic-123' },
  ],
  resources: [
    { id: 'r1', topic_id: 'topic-123', resource_type: 'video', title: 'Video', url: null, storage_path: null, description: null, display_order: 1, created_at: '' },
  ],
};

let mockTopicData: Topic | null = mockTopic;
let mockTopicLoading = false;
let mockTopicError: Error | null = null;
let mockTopicQuestions: Array<{ id: string }> = [];

vi.mock('@/hooks/useTopics', () => ({
  useTopic: () => ({
    data: mockTopicData,
    isLoading: mockTopicLoading,
    error: mockTopicError,
  }),
  useTopicQuestions: () => ({
    data: mockTopicQuestions,
    isLoading: false,
  }),
  useTopicCompleted: () => false,
  useToggleTopicComplete: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock('@/hooks/useQuestions', () => ({
  useQuestionsByIds: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
  }),
}));

describe('TopicDetailPage', () => {
  let queryClient: QueryClient;
  const mockOnBack = vi.fn();

  const renderComponent = (slug: string = 'amateur-radio-basics') => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AppNavigationProvider>
            <TopicDetailPage slug={slug} onBack={mockOnBack} />
          </AppNavigationProvider>
        </QueryClientProvider>
      </BrowserRouter>,
      { wrapper: muiWrapper }
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTopicData = mockTopic;
    mockTopicLoading = false;
    mockTopicError = null;
    mockTopicQuestions = [];
  });

  describe('Loading State', () => {
    it('should show loading skeleton when topic is loading', () => {
      mockTopicLoading = true;
      renderComponent();

      // MUI's Skeleton has no role and no testid; its root class is public API.
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should show error state when topic not found', () => {
      mockTopicData = null;
      renderComponent();

      expect(screen.getByText('Topic not found')).toBeInTheDocument();
      expect(screen.getByText("The topic you're looking for doesn't exist or has been removed.")).toBeInTheDocument();
    });

    it('should show error state when there is an error', () => {
      mockTopicError = new Error('Failed to load');
      renderComponent();

      expect(screen.getByText('Topic not found')).toBeInTheDocument();
    });

    it('should show Back to Topics button in error state', () => {
      mockTopicData = null;
      renderComponent();

      expect(screen.getByText('Back to Topics')).toBeInTheDocument();
    });

    it('should call onBack when Back to Topics is clicked in error state', () => {
      mockTopicData = null;
      renderComponent();

      fireEvent.click(screen.getByText('Back to Topics'));
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    it('should render topic title', () => {
      renderComponent();
      expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
    });

    it('should render topic description', () => {
      renderComponent();
      expect(screen.getByText('Introduction to amateur radio')).toBeInTheDocument();
    });

    it('should render subelement badges', () => {
      renderComponent();
      expect(screen.getByText('T1A')).toBeInTheDocument();
      expect(screen.getByText('T1B')).toBeInTheDocument();
    });

    it('should render Back to Topics button in header', () => {
      renderComponent();
      const backButtons = screen.getAllByText('Back to Topics');
      expect(backButtons.length).toBeGreaterThan(0);
    });

    it('should render topic content', () => {
      renderComponent();
      expect(screen.getByTestId('topic-content')).toBeInTheDocument();
    });

    it('should render resource panel', () => {
      renderComponent();
      expect(screen.getByTestId('resource-panel')).toBeInTheDocument();
    });

    it('should render questions panel', () => {
      renderComponent();
      expect(screen.getByTestId('questions-panel')).toBeInTheDocument();
    });

    it('should render progress button', () => {
      renderComponent();
      expect(screen.getAllByTestId('progress-button').length).toBeGreaterThan(0);
    });
  });

  describe('Navigation', () => {
    it('should call onBack when back button is clicked', () => {
      renderComponent();

      const backButtons = screen.getAllByText('Back to Topics');
      fireEvent.click(backButtons[0]);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Default Content', () => {
    it('should show default content when topic has no content', () => {
      mockTopicData = { ...mockTopic, content: null };
      renderComponent();

      const content = screen.getByTestId('topic-content');
      expect(content.textContent).toContain('Amateur Radio Basics');
      expect(content.textContent).toContain('Introduction to amateur radio');
    });

    it('should show "Content coming soon" message when no content and no description', () => {
      mockTopicData = { ...mockTopic, content: null, description: null };
      renderComponent();

      const content = screen.getByTestId('topic-content');
      expect(content.textContent).toContain('Content coming soon');
    });
  });

  describe('No Subelements', () => {
    it('should not show subelement section when empty', () => {
      mockTopicData = { ...mockTopic, subelements: [] };
      renderComponent();

      expect(screen.queryByText('T1A')).not.toBeInTheDocument();
    });
  });

  describe('No Description', () => {
    it('should not show description when null', () => {
      mockTopicData = { ...mockTopic, description: null };
      renderComponent();

      expect(screen.queryByText('Introduction to amateur radio')).not.toBeInTheDocument();
    });
  });

  describe('Collapsible sidebar', () => {
    /**
     * happy-dom does not evaluate media queries, so the desktop column
     * template is read from the rule the grid emits rather than computed.
     * The test used to be named for the grid narrowing without asserting it,
     * which let the sidebar stop reporting its state without a failure.
     */
    const desktopColumns = () => {
      const grid = screen.getByTestId('topic-layout-grid');
      const own = Array.from(grid.classList).find((c) => c.startsWith('css-'));
      const css = Array.from(document.querySelectorAll('style'))
        .map((tag) => tag.textContent ?? '')
        .join('\n');
      const rule = css
        .split('}')
        .filter((r) => own && r.includes(`.${own}`) && r.includes('grid-template-columns'))
        .at(-1);
      return rule?.match(/grid-template-columns:([^;]+)/)?.[1].trim() ?? null;
    };

    it('should be collapsed by default, showing the rail and narrowing the grid', () => {
      renderComponent();

      // Rail (expand control) is present when collapsed
      const rail = screen.getByRole('button', { name: 'Show Questions & Resources' });
      expect(rail).toBeInTheDocument();
      expect(rail).toHaveAttribute('aria-expanded', 'false');
      expect(desktopColumns()).toBe('1fr auto');
    });

    it('should expand to the wide sidebar when the rail is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: 'Show Questions & Resources' }));

      // Rail is gone; hide control is now the expanded toggle
      expect(
        screen.queryByRole('button', { name: 'Show Questions & Resources' })
      ).not.toBeInTheDocument();
      const hide = screen.getByRole('button', { name: 'Hide Questions & Resources' });
      expect(hide).toHaveAttribute('aria-expanded', 'true');
      expect(desktopColumns()).toBe('1fr 280px');
    });

    it('should collapse again when the hide control is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: 'Show Questions & Resources' }));
      fireEvent.click(screen.getByRole('button', { name: 'Hide Questions & Resources' }));

      expect(
        screen.getByRole('button', { name: 'Show Questions & Resources' })
      ).toBeInTheDocument();
    });

    it('should point both toggles at the panel region via aria-controls', () => {
      renderComponent();

      const rail = screen.getByRole('button', { name: 'Show Questions & Resources' });
      expect(rail).toHaveAttribute('aria-controls', 'topic-sidebar-panels');
      expect(document.getElementById('topic-sidebar-panels')).toBeInTheDocument();
    });

    it('should label the sidebar landmark', () => {
      renderComponent();
      expect(
        screen.getByRole('complementary', { name: 'Questions and resources' })
      ).toBeInTheDocument();
    });
  });

  describe('Sidebar focus management', () => {
    it('should move focus to the hide control when expanding', () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: 'Show Questions & Resources' }));

      expect(screen.getByRole('button', { name: 'Hide Questions & Resources' })).toHaveFocus();
    });

    it('should move focus back to the rail when collapsing', () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: 'Show Questions & Resources' }));
      fireEvent.click(screen.getByRole('button', { name: 'Hide Questions & Resources' }));

      expect(screen.getByRole('button', { name: 'Show Questions & Resources' })).toHaveFocus();
    });

    it('should not steal focus on the initial collapsed render', () => {
      renderComponent();

      // Nothing should be auto-focused before the user interacts
      expect(document.body).toHaveFocus();
    });
  });

  describe('Empty sidebar', () => {
    it('should not render the sidebar or rail when there are no questions and no resources', () => {
      mockTopicData = { ...mockTopic, resources: [] };
      mockTopicQuestions = [];
      renderComponent();

      expect(
        screen.queryByRole('button', { name: 'Show Questions & Resources' })
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('questions-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('resource-panel')).not.toBeInTheDocument();

    });

    it('should render the sidebar when there are questions but no resources', () => {
      // Exercises the `questionCount > 0` branch of hasSidebarContent
      mockTopicData = { ...mockTopic, resources: [] };
      mockTopicQuestions = [{ id: 'T1A01' }];
      renderComponent();

      expect(
        screen.getByRole('button', { name: 'Show Questions & Resources' })
      ).toBeInTheDocument();
      expect(screen.getByTestId('questions-panel')).toBeInTheDocument();

    });

    it('should render the sidebar when there are resources but no questions', () => {
      // Exercises the `resources.length > 0` branch of hasSidebarContent
      mockTopicData = { ...mockTopic }; // mockTopic has one resource
      mockTopicQuestions = [];
      renderComponent();

      expect(
        screen.getByRole('button', { name: 'Show Questions & Resources' })
      ).toBeInTheDocument();
      expect(screen.getByTestId('resource-panel')).toBeInTheDocument();

    });
  });

  describe('Topic navigation', () => {
    it('should collapse the sidebar again when navigating to a different topic', () => {
      const { rerender } = renderComponent('topic-a');

      // Expand on the first topic
      fireEvent.click(screen.getByRole('button', { name: 'Show Questions & Resources' }));
      expect(
        screen.queryByRole('button', { name: 'Show Questions & Resources' })
      ).not.toBeInTheDocument();

      // Navigate to a different topic (component reconciles in place, no remount)
      rerender(
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AppNavigationProvider>
              <TopicDetailPage slug="topic-b" onBack={mockOnBack} />
            </AppNavigationProvider>
          </QueryClientProvider>
        </BrowserRouter>
      );

      // Sidebar is collapsed again, and focus was not yanked to the rail
      expect(
        screen.getByRole('button', { name: 'Show Questions & Resources' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Show Questions & Resources' })
      ).not.toHaveFocus();
    });
  });

  /**
   * A guest arriving from a lesson sees its later topics locked. The quiz CTA
   * is gated on `user`, so before this they saw neither the quiz nor any
   * reason the topics were locked. The prompt names the mechanism.
   */
  describe('guest quiz prompt', () => {
    it('tells a guest what completing the topic takes, and where the account comes in', () => {
      mockTopicQuestions = [{ id: 'T1A01' }, { id: 'T1A02' }, { id: 'T1A03' }];
      renderComponent();

      const prompt = screen.getByRole('status');
      expect(prompt).toHaveTextContent('3-question quiz');
      expect(prompt).toHaveTextContent('Scoring 80% marks the topic complete and unlocks the next one');
      expect(prompt).toHaveTextContent('needs an account');
      expect(screen.getByRole('link', { name: 'Create free account' })).toHaveAttribute(
        'href',
        '/auth?returnTo=/dashboard'
      );
    });

    /** No quiz to be had, so nothing to explain. */
    it('says nothing when the topic has no questions', () => {
      mockTopicQuestions = [];
      renderComponent();

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    /** It is a status note beside the content, never something that gates it. */
    it('does not use the interrupting alert role', () => {
      mockTopicQuestions = [{ id: 'T1A01' }];
      renderComponent();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
