import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TopicDetailPage } from './TopicDetailPage';
import { Topic } from '@/hooks/useTopics';
import { AppNavigationProvider } from '@/hooks/useAppNavigation';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <aside {...props}>{children}</aside>,
    main: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <main {...props}>{children}</main>,
  },
}));

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
      </BrowserRouter>
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
      const { container } = renderComponent();

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
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
    const getGrid = (container: HTMLElement) =>
      container.querySelector('div.grid') as HTMLElement;

    it('should be collapsed by default, showing the rail and narrowing the grid', () => {
      const { container } = renderComponent();

      // Rail (expand control) is present when collapsed
      const rail = screen.getByRole('button', { name: 'Show Questions & Resources' });
      expect(rail).toBeInTheDocument();
      expect(rail).toHaveAttribute('aria-expanded', 'false');

      // Grid uses the collapsed (auto) template, not the 280px one
      expect(getGrid(container).className).toContain('lg:grid-cols-[1fr_auto]');
      expect(getGrid(container).className).not.toContain('lg:grid-cols-[1fr_280px]');
    });

    it('should expand to the wide sidebar when the rail is clicked', () => {
      const { container } = renderComponent();

      fireEvent.click(screen.getByRole('button', { name: 'Show Questions & Resources' }));

      // Rail is gone; hide control is now the expanded toggle
      expect(
        screen.queryByRole('button', { name: 'Show Questions & Resources' })
      ).not.toBeInTheDocument();
      const hide = screen.getByRole('button', { name: 'Hide Questions & Resources' });
      expect(hide).toHaveAttribute('aria-expanded', 'true');

      // Grid switches to the fixed 280px template
      expect(getGrid(container).className).toContain('lg:grid-cols-[1fr_280px]');
    });

    it('should collapse again when the hide control is clicked', () => {
      const { container } = renderComponent();

      fireEvent.click(screen.getByRole('button', { name: 'Show Questions & Resources' }));
      fireEvent.click(screen.getByRole('button', { name: 'Hide Questions & Resources' }));

      expect(
        screen.getByRole('button', { name: 'Show Questions & Resources' })
      ).toBeInTheDocument();
      expect(getGrid(container).className).toContain('lg:grid-cols-[1fr_auto]');
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
      const { container } = renderComponent();

      expect(
        screen.queryByRole('button', { name: 'Show Questions & Resources' })
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('questions-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('resource-panel')).not.toBeInTheDocument();

      // Grid reserves no sidebar column
      const grid = container.querySelector('div.grid') as HTMLElement;
      expect(grid.className).not.toContain('lg:grid-cols-[1fr_280px]');
      expect(grid.className).not.toContain('lg:grid-cols-[1fr_auto]');
    });

    it('should render the sidebar when there are questions but no resources', () => {
      // Exercises the `questionCount > 0` branch of hasSidebarContent
      mockTopicData = { ...mockTopic, resources: [] };
      mockTopicQuestions = [{ id: 'T1A01' }];
      const { container } = renderComponent();

      expect(
        screen.getByRole('button', { name: 'Show Questions & Resources' })
      ).toBeInTheDocument();
      expect(screen.getByTestId('questions-panel')).toBeInTheDocument();

      // Grid reserves the collapsed sidebar column
      const grid = container.querySelector('div.grid') as HTMLElement;
      expect(grid.className).toContain('lg:grid-cols-[1fr_auto]');
    });

    it('should render the sidebar when there are resources but no questions', () => {
      // Exercises the `resources.length > 0` branch of hasSidebarContent
      mockTopicData = { ...mockTopic }; // mockTopic has one resource
      mockTopicQuestions = [];
      const { container } = renderComponent();

      expect(
        screen.getByRole('button', { name: 'Show Questions & Resources' })
      ).toBeInTheDocument();
      expect(screen.getByTestId('resource-panel')).toBeInTheDocument();

      // Grid reserves the collapsed sidebar column
      const grid = container.querySelector('div.grid') as HTMLElement;
      expect(grid.className).toContain('lg:grid-cols-[1fr_auto]');
    });
  });
});
