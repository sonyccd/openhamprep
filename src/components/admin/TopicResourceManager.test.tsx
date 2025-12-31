import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicResourceManager } from './TopicResourceManager';
import { TopicResource } from '@/hooks/useTopics';

// Mock Supabase client
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockUpload = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'topic_resources') {
        return {
          insert: mockInsert,
          update: vi.fn().mockReturnValue({
            eq: mockUpdate,
          }),
          delete: vi.fn().mockReturnValue({
            eq: mockDelete,
          }),
        };
      }
      return {};
    }),
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://storage.example.com/${path}` },
        })),
      })),
    },
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

// Sample resources
const mockResources: TopicResource[] = [
  {
    id: 'resource-1',
    topic_id: 'topic-123',
    resource_type: 'video',
    title: 'Introduction Video',
    url: 'https://youtube.com/watch?v=12345',
    storage_path: null,
    description: 'A helpful introduction',
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'resource-2',
    topic_id: 'topic-123',
    resource_type: 'pdf',
    title: 'Study Guide',
    url: null,
    storage_path: 'resources/topic-123/guide.pdf',
    description: 'PDF study guide',
    display_order: 2,
    created_at: '2024-01-02T00:00:00Z',
  },
];

describe('TopicResourceManager', () => {
  let queryClient: QueryClient;

  const renderComponent = (resources: TopicResource[] = mockResources) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TopicResourceManager topicId="topic-123" resources={resources} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockUpdate.mockResolvedValue({ error: null });
    mockDelete.mockResolvedValue({ error: null });
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
  });

  describe('Rendering', () => {
    it('should render Resources heading', () => {
      renderComponent();
      expect(screen.getByText('Resources')).toBeInTheDocument();
    });

    it('should show resource count badge', () => {
      renderComponent();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render Add Resource button', () => {
      renderComponent();
      expect(screen.getByText('Add Resource')).toBeInTheDocument();
    });

    it('should display resource titles', () => {
      renderComponent();
      expect(screen.getByText('Introduction Video')).toBeInTheDocument();
      expect(screen.getByText('Study Guide')).toBeInTheDocument();
    });

    it('should show resource type badges', () => {
      renderComponent();
      expect(screen.getByText('video')).toBeInTheDocument();
      expect(screen.getByText('pdf')).toBeInTheDocument();
    });

    it('should show Uploaded badge for storage resources', () => {
      renderComponent();
      expect(screen.getByText('Uploaded')).toBeInTheDocument();
    });

    it('should show YouTube URL for video', () => {
      renderComponent();
      expect(screen.getByText('https://youtube.com/watch?v=12345')).toBeInTheDocument();
    });

    it('should show Download file for uploaded resources', () => {
      renderComponent();
      expect(screen.getByText('Download file')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no resources', () => {
      renderComponent([]);
      expect(screen.getByText('No resources yet')).toBeInTheDocument();
      expect(screen.getByText('Add videos, articles, and links for this topic')).toBeInTheDocument();
    });
  });

  describe('Add Resource Dialog', () => {
    it('should open dialog when Add Resource is clicked', async () => {
      renderComponent();
      fireEvent.click(screen.getByText('Add Resource'));

      await waitFor(() => {
        // Dialog title "Add Resource" should appear
        expect(screen.getAllByText('Add Resource').length).toBeGreaterThan(1);
      });
    });

    it('should show form fields in dialog', async () => {
      renderComponent();
      fireEvent.click(screen.getByText('Add Resource'));

      await waitFor(() => {
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description (optional)')).toBeInTheDocument();
      });
    });

    it('should close dialog when Cancel is clicked', async () => {
      renderComponent();
      fireEvent.click(screen.getByText('Add Resource'));

      await waitFor(() => {
        // Dialog should be open
        expect(screen.getAllByText('Add Resource').length).toBeGreaterThan(1);
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        // Only the button should remain
        expect(screen.getAllByText('Add Resource').length).toBe(1);
      });
    });
  });

  describe('Edit Resource', () => {
    it('should open edit dialog when edit button is clicked', async () => {
      const { container } = renderComponent();

      // Find edit buttons by looking for SVGs with pencil-related classes
      const editButtons = container.querySelectorAll('svg[class*="pencil"]');
      expect(editButtons.length).toBeGreaterThan(0);
      fireEvent.click(editButtons[0].closest('button')!);

      await waitFor(() => {
        expect(screen.getByText('Edit Resource')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Resource', () => {
    it('should open confirmation dialog when delete button is clicked', async () => {
      const { container } = renderComponent();

      // Find delete buttons by looking for SVGs with trash-related classes
      const deleteButtons = container.querySelectorAll('svg[class*="trash"]');
      expect(deleteButtons.length).toBeGreaterThan(0);
      fireEvent.click(deleteButtons[0].closest('button')!);

      await waitFor(() => {
        expect(screen.getByText('Delete Resource')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to delete this resource? This action cannot be undone.')).toBeInTheDocument();
      });
    });

    it('should close confirmation when Cancel is clicked', async () => {
      const { container } = renderComponent();

      const deleteButtons = container.querySelectorAll('svg[class*="trash"]');
      expect(deleteButtons.length).toBeGreaterThan(0);
      fireEvent.click(deleteButtons[0].closest('button')!);

      await waitFor(() => {
        expect(screen.getByText('Delete Resource')).toBeInTheDocument();
      });

      // Find the Cancel button in the alert dialog
      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText('Are you sure you want to delete this resource?')).not.toBeInTheDocument();
      });
    });
  });

  describe('Resource Type Icons', () => {
    it('should show video icon for video resources', () => {
      const { container } = renderComponent([mockResources[0]]);
      expect(container.querySelector('svg[class*="video"]')).toBeInTheDocument();
    });

    it('should show file icon for PDF resources', () => {
      const { container } = renderComponent([mockResources[1]]);
      expect(container.querySelector('svg[class*="file"]')).toBeInTheDocument();
    });
  });

  describe('Display Order', () => {
    it('should display resources in order by display_order', () => {
      const unorderedResources: TopicResource[] = [
        { ...mockResources[0], display_order: 2 },
        { ...mockResources[1], display_order: 1 },
      ];

      renderComponent(unorderedResources);

      const titles = screen.getAllByText(/Introduction Video|Study Guide/);
      // Study Guide should come first (display_order: 1)
      expect(titles[0]).toHaveTextContent('Study Guide');
      expect(titles[1]).toHaveTextContent('Introduction Video');
    });
  });

  describe('Drag Handle', () => {
    it('should show drag handle for reordering', () => {
      const { container } = renderComponent();
      expect(container.querySelectorAll('svg[class*="grip-vertical"]').length).toBe(2);
    });
  });
});
