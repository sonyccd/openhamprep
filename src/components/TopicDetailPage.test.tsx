import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TopicDetailPage } from './TopicDetailPage';
import { Topic } from '@/hooks/useTopics';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
    aside: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <aside {...props}>{children}</aside>,
    main: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <main {...props}>{children}</main>,
  },
}));

// Mock child components to simplify testing
vi.mock('./TopicTableOfContents', () => ({
  TopicTableOfContents: ({ content }: { content?: string }) => (
    <div data-testid="table-of-contents">TOC for content length: {content?.length || 0}</div>
  ),
}));

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

const mockContent = '# Amateur Radio Basics\n\nThis is the content.';

let mockTopicData: Topic | null = mockTopic;
let mockContentData: string | null = mockContent;
let mockTopicLoading = false;
let mockContentLoading = false;
let mockTopicError: Error | null = null;

vi.mock('@/hooks/useTopics', () => ({
  useTopic: () => ({
    data: mockTopicData,
    isLoading: mockTopicLoading,
    error: mockTopicError,
  }),
  useTopicContent: () => ({
    data: mockContentData,
    isLoading: mockContentLoading,
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
          <TopicDetailPage slug={slug} onBack={mockOnBack} />
        </QueryClientProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTopicData = mockTopic;
    mockContentData = mockContent;
    mockTopicLoading = false;
    mockContentLoading = false;
    mockTopicError = null;
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

    it('should render table of contents', () => {
      renderComponent();
      expect(screen.getByTestId('table-of-contents')).toBeInTheDocument();
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
    it('should show default content when no markdown is available', () => {
      mockContentData = null;
      renderComponent();

      const content = screen.getByTestId('topic-content');
      expect(content.textContent).toContain('Amateur Radio Basics');
      expect(content.textContent).toContain('Introduction to amateur radio');
    });

    it('should show "Content coming soon" message when no content and no description', () => {
      mockContentData = null;
      mockTopicData = { ...mockTopic, description: null };
      renderComponent();

      const content = screen.getByTestId('topic-content');
      expect(content.textContent).toContain('Content coming soon');
    });
  });

  describe('Content Loading', () => {
    it('should show skeleton when content is loading', () => {
      mockContentLoading = true;
      const { container } = renderComponent();

      // The content area should show loading skeleton
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
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
});
