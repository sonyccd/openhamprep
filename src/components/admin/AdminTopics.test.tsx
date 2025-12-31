import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminTopics } from './AdminTopics';
import { Topic } from '@/hooks/useTopics';

// Mock Supabase client
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'admin@test.com' },
    loading: false,
  }),
}));

// Mock TopicEditor to avoid deep component tree
vi.mock('./TopicEditor', () => ({
  TopicEditor: ({ topic, onBack }: { topic: Topic; onBack: () => void }) => (
    <div data-testid="topic-editor">
      <span>Editing: {topic.title}</span>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

// Sample topic data
const mockTopics: Topic[] = [
  {
    id: 'topic-1',
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
    subelements: [],
    resources: [{ id: 'r1' }] as any,
  },
  {
    id: 'topic-2',
    slug: 'frequency-bands',
    title: 'Frequency Bands',
    description: 'Understanding frequency allocations',
    thumbnail_url: null,
    display_order: 2,
    is_published: false,
    license_types: ['general', 'extra'],
    content_path: 'articles/frequency-bands.md',
    edit_history: [],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    subelements: [],
    resources: [],
  },
];

describe('AdminTopics', () => {
  let queryClient: QueryClient;

  const renderComponent = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <AdminTopics />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock
    mockFrom.mockImplementation((table: string) => {
      if (table === 'topics') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTopics,
              error: null,
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return { select: vi.fn() };
    });
  });

  describe('Rendering', () => {
    it('should render Topics heading with count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Topics (2)')).toBeInTheDocument();
      });
    });

    it('should render Add Topic button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Add Topic')).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search topics...')).toBeInTheDocument();
      });
    });

    it('should render topic list', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
        expect(screen.getByText('Frequency Bands')).toBeInTheDocument();
      });
    });

    it('should show Published badge for published topics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Published')).toBeInTheDocument();
      });
    });

    it('should show Draft badge for unpublished topics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    it('should show license type badges', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('technician')).toBeInTheDocument();
        expect(screen.getAllByText('general').length).toBeGreaterThan(0);
        expect(screen.getByText('extra')).toBeInTheDocument();
      });
    });

    it('should show resource count badge', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('1 resources')).toBeInTheDocument();
      });
    });

    it('should show slug for each topic', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('/amateur-radio-basics')).toBeInTheDocument();
        expect(screen.getByText('/frequency-bands')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while loading', () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(new Promise(() => {})), // Never resolves
        }),
      }));

      renderComponent();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('should filter topics by title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search topics...');
      fireEvent.change(searchInput, { target: { value: 'Amateur' } });

      expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
      expect(screen.queryByText('Frequency Bands')).not.toBeInTheDocument();
    });

    it('should filter topics by slug', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Frequency Bands')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search topics...');
      fireEvent.change(searchInput, { target: { value: 'frequency' } });

      expect(screen.queryByText('Amateur Radio Basics')).not.toBeInTheDocument();
      expect(screen.getByText('Frequency Bands')).toBeInTheDocument();
    });

    it('should filter topics by description', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search topics...');
      fireEvent.change(searchInput, { target: { value: 'allocations' } });

      expect(screen.queryByText('Amateur Radio Basics')).not.toBeInTheDocument();
      expect(screen.getByText('Frequency Bands')).toBeInTheDocument();
    });

    it('should show "No topics found" when search has no results', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search topics...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No topics found')).toBeInTheDocument();
    });
  });

  describe('Add Topic Dialog', () => {
    it('should open add dialog when Add Topic is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Add Topic')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Topic'));

      expect(screen.getByText('Add New Topic')).toBeInTheDocument();
    });

    it('should show form fields in add dialog', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Add Topic')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Topic'));

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Slug (URL-friendly)')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('License Types')).toBeInTheDocument();
      expect(screen.getByText('Publish immediately')).toBeInTheDocument();
    });

    it('should close dialog when Cancel is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Add Topic')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Topic'));
      expect(screen.getByText('Add New Topic')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Add New Topic')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Topic', () => {
    it('should show TopicEditor when edit button is clicked', async () => {
      const { container } = renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
      });

      // Find edit buttons via SVG class
      const editButtons = container.querySelectorAll('svg.lucide-pencil');
      expect(editButtons.length).toBeGreaterThan(0);
      fireEvent.click(editButtons[0].closest('button')!);

      expect(screen.getByTestId('topic-editor')).toBeInTheDocument();
      expect(screen.getByText('Editing: Amateur Radio Basics')).toBeInTheDocument();
    });

    it('should return to list when back is clicked in editor', async () => {
      const { container } = renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
      });

      const editButtons = container.querySelectorAll('svg.lucide-pencil');
      fireEvent.click(editButtons[0].closest('button')!);

      expect(screen.getByTestId('topic-editor')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Back'));

      await waitFor(() => {
        expect(screen.queryByTestId('topic-editor')).not.toBeInTheDocument();
        expect(screen.getByText('Topics (2)')).toBeInTheDocument();
      });
    });
  });
});
