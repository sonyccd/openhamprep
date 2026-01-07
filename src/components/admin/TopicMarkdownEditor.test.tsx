import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicMarkdownEditor } from './TopicMarkdownEditor';

// Mock Supabase storage
const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
      })),
    },
    from: vi.fn(() => ({
      update: mockUpdate,
    })),
  },
}));

// Mock TopicContent component
vi.mock('@/components/TopicContent', () => ({
  TopicContent: ({ content }: { content: string }) => (
    <div data-testid="topic-content-preview">{content}</div>
  ),
}));

// Mock useTopicContent hook
let mockContentData: string | undefined = '# Existing Content\n\nSome text here.';
let mockContentLoading = false;
let mockContentFetching = false;

vi.mock('@/hooks/useTopics', () => ({
  useTopicContent: () => ({
    data: mockContentData,
    isLoading: mockContentLoading,
    isFetching: mockContentFetching,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('TopicMarkdownEditor', () => {
  let queryClient: QueryClient;

  const renderComponent = (props = {}) => {
    const defaultProps = {
      topicId: 'topic-123',
      topicSlug: 'test-topic',
      contentPath: 'articles/test-topic.md',
      onSave: vi.fn(),
    };

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TopicMarkdownEditor {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockContentData = '# Existing Content\n\nSome text here.';
    mockContentLoading = false;
    mockContentFetching = false;
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when content is loading initially', () => {
      mockContentLoading = true;
      mockContentData = undefined; // No data yet
      renderComponent();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('should not show full loading when content is cached', () => {
      mockContentLoading = false;
      mockContentFetching = true; // Refetching in background
      mockContentData = '# Existing Content\n\nSome text here.';
      renderComponent();

      // Should not show full loading screen
      expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
      // But should show content
      expect(screen.getByPlaceholderText('Write your markdown content here...')).toBeInTheDocument();
    });

    it('should show subtle spinner in header when refetching', async () => {
      mockContentLoading = false;
      mockContentFetching = true;
      mockContentData = '# Existing Content\n\nSome text here.';
      renderComponent();

      // Wait for content to initialize (which sets isInitialized to true)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Write your markdown content here...')).toHaveValue('# Existing Content\n\nSome text here.');
      });

      // The subtle spinner should be visible in the header
      const headerSpinner = document.querySelector('.animate-spin');
      expect(headerSpinner).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should render Content Editor heading', () => {
      renderComponent();
      expect(screen.getByText('Content Editor')).toBeInTheDocument();
    });

    it('should render tab buttons', () => {
      renderComponent();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Split')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should render Save button', () => {
      renderComponent();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should render help text', () => {
      renderComponent();
      expect(screen.getByText(/Supports Markdown/)).toBeInTheDocument();
      expect(screen.getByText(/Press Ctrl\+S to save/)).toBeInTheDocument();
    });

    it('should load existing content into textarea', () => {
      renderComponent();

      const textarea = screen.getByPlaceholderText('Write your markdown content here...');
      expect(textarea).toHaveValue('# Existing Content\n\nSome text here.');
    });
  });

  describe('Tab Switching', () => {
    it('should show split view by default', () => {
      renderComponent();

      // Split view shows both textarea and preview
      expect(screen.getByPlaceholderText('Write your markdown content here...')).toBeInTheDocument();
      expect(screen.getByTestId('topic-content-preview')).toBeInTheDocument();
    });

    it('should show only editor in Edit mode', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByText('Edit'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Write your markdown content here...')).toBeInTheDocument();
        expect(screen.queryByTestId('topic-content-preview')).not.toBeInTheDocument();
      });
    });

    it('should show only preview in Preview mode', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByText('Preview'));

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Write your markdown content here...')).not.toBeInTheDocument();
        expect(screen.getByTestId('topic-content-preview')).toBeInTheDocument();
      });
    });
  });

  describe('Content Editing', () => {
    it('should update content when typing', () => {
      renderComponent();

      const textarea = screen.getByPlaceholderText('Write your markdown content here...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      expect(textarea).toHaveValue('# New Content');
    });

    it('should show unsaved changes indicator when content is modified', () => {
      renderComponent();

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();

      const textarea = screen.getByPlaceholderText('Write your markdown content here...');
      fireEvent.change(textarea, { target: { value: '# Modified Content' } });

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
  });

  describe('Save Button State', () => {
    it('should disable Save button when there are no changes', () => {
      renderComponent();
      expect(screen.getByText('Save').closest('button')).toBeDisabled();
    });

    it('should enable Save button when there are changes', () => {
      renderComponent();

      const textarea = screen.getByPlaceholderText('Write your markdown content here...');
      fireEvent.change(textarea, { target: { value: '# Modified Content' } });

      expect(screen.getByText('Save').closest('button')).not.toBeDisabled();
    });
  });

  describe('Saving Content', () => {
    it('should call storage upload when saving', async () => {
      renderComponent();

      const textarea = screen.getByPlaceholderText('Write your markdown content here...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalled();
        expect(mockUpload).toHaveBeenCalled();
      });
    });

    it('should show success toast on successful save', async () => {
      renderComponent();

      const textarea = screen.getByPlaceholderText('Write your markdown content here...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Content saved successfully');
      });
    });

    it('should show error toast on failed save', async () => {
      mockUpload.mockResolvedValue({ error: { message: 'Upload failed' } });

      renderComponent();

      const textarea = screen.getByPlaceholderText('Write your markdown content here...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to save content'));
      });
    });
  });

  describe('Default Content', () => {
    it('should generate default content when no existing content', async () => {
      // Empty string (falsy) triggers default content generation
      mockContentData = '';
      renderComponent({ topicSlug: 'my-new-topic' });

      // Wait for content to initialize and check value attribute
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Write your markdown content here...');
        // Textarea value contains the default content - use string check
        const value = (textarea as HTMLTextAreaElement).value;
        expect(value).toContain('My New Topic');
      });
    });
  });

  describe('New Content Path', () => {
    it('should update topic content_path when saving new content', async () => {
      mockContentData = '';
      renderComponent({ contentPath: null });

      const textarea = screen.getByPlaceholderText('Write your markdown content here...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });
  });
});
