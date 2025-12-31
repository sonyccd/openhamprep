import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicGallery } from './TopicGallery';
import { Topic } from '@/hooks/useTopics';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock useAppNavigation
const mockNavigateToTopic = vi.fn();
vi.mock('@/hooks/useAppNavigation', () => ({
  useAppNavigation: () => ({
    navigateToTopic: mockNavigateToTopic,
  }),
}));

// Mock data
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
    edit_history: [],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    subelements: [],
    resources: [],
  },
];

const mockProgress = [
  { id: 'progress-1', user_id: 'user-1', topic_id: 'topic-1', is_completed: true, completed_at: '2024-01-15T00:00:00Z' },
];

let mockTopicsData: Topic[] | undefined = mockTopics;
let mockProgressData = mockProgress;
let mockIsLoading = false;
let mockError: Error | null = null;

vi.mock('@/hooks/useTopics', () => ({
  useTopics: () => ({
    data: mockTopicsData,
    isLoading: mockIsLoading,
    error: mockError,
  }),
  useTopicProgress: () => ({
    data: mockProgressData,
  }),
}));

describe('TopicGallery', () => {
  let queryClient: QueryClient;

  const renderComponent = (testType?: 'technician' | 'general' | 'extra') => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TopicGallery testType={testType} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTopicsData = mockTopics;
    mockProgressData = mockProgress;
    mockIsLoading = false;
    mockError = null;
  });

  describe('Rendering', () => {
    it('should render the Topics heading', () => {
      renderComponent();
      expect(screen.getByText('Topics')).toBeInTheDocument();
    });

    it('should render topic cards', () => {
      renderComponent();
      expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
      expect(screen.getByText('Frequency Bands')).toBeInTheDocument();
    });

    it('should show completion stats', () => {
      renderComponent();
      expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('Search topics...')).toBeInTheDocument();
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
  });

  describe('Error State', () => {
    it('should show error message on error', () => {
      mockError = new Error('Failed to load');
      renderComponent();

      expect(screen.getByText('Failed to load topics. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no topics', () => {
      mockTopicsData = [];
      renderComponent();

      expect(screen.getByText('No topics available')).toBeInTheDocument();
      expect(screen.getByText("Topics will appear here once they're published.")).toBeInTheDocument();
    });

    it('should show no results message when search has no matches', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search topics...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No topics found')).toBeInTheDocument();
      expect(screen.getByText(/No topics match "nonexistent"/)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter topics by title', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search topics...');
      fireEvent.change(searchInput, { target: { value: 'Amateur' } });

      expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
      expect(screen.queryByText('Frequency Bands')).not.toBeInTheDocument();
    });

    it('should filter topics by description', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search topics...');
      fireEvent.change(searchInput, { target: { value: 'allocations' } });

      expect(screen.queryByText('Amateur Radio Basics')).not.toBeInTheDocument();
      expect(screen.getByText('Frequency Bands')).toBeInTheDocument();
    });

    it('should be case-insensitive', () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search topics...');
      fireEvent.change(searchInput, { target: { value: 'AMATEUR' } });

      expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
    });
  });

  describe('Topic Navigation', () => {
    it('should navigate to topic when card is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Amateur Radio Basics'));

      expect(mockNavigateToTopic).toHaveBeenCalledWith('amateur-radio-basics');
    });
  });

  describe('Completion Tracking', () => {
    it('should show completed badge on completed topics', () => {
      renderComponent();

      // topic-1 is marked as completed in mockProgress
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should update completion count correctly', () => {
      mockProgressData = [
        { id: 'p1', user_id: 'user-1', topic_id: 'topic-1', is_completed: true, completed_at: '' },
        { id: 'p2', user_id: 'user-1', topic_id: 'topic-2', is_completed: true, completed_at: '' },
      ];
      renderComponent();

      expect(screen.getByText('2 of 2 completed')).toBeInTheDocument();
    });

    it('should show 0 of N when no topics completed', () => {
      mockProgressData = [];
      renderComponent();

      expect(screen.getByText('0 of 2 completed')).toBeInTheDocument();
    });
  });

  describe('Subelement Filtering', () => {
    it('should filter topics by subelement search', () => {
      mockTopicsData = [
        {
          ...mockTopics[0],
          subelements: [{ id: 's1', subelement: 'T1A', topic_id: 'topic-1' }],
        },
        mockTopics[1],
      ];
      renderComponent();

      const searchInput = screen.getByPlaceholderText('Search topics...');
      fireEvent.change(searchInput, { target: { value: 'T1A' } });

      expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
      expect(screen.queryByText('Frequency Bands')).not.toBeInTheDocument();
    });
  });
});
