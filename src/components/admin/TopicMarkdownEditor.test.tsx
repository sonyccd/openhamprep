import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicMarkdownEditor } from './TopicMarkdownEditor';
import { muiWrapper } from '@/test/utils';

// Mock Supabase client for database updates and image uploads
const mockUpdate = vi.fn();
const mockUpload = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate,
    })),
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.png' } })),
      })),
    },
  },
}));

// Mock react-markdown to avoid complex rendering in tests
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown-preview">{children}</div>,
}));

// Mock remark/rehype plugins
vi.mock('remark-math', () => ({ default: () => {} }));
vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('rehype-katex', () => ({ default: () => {} }));

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
      initialContent: '# Test Content\n\nSome text here.',
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
      </QueryClientProvider>,
      { wrapper: muiWrapper }
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockUpload.mockResolvedValue({ error: null });
  });

  describe('Rendering', () => {
    it('should render Content Editor heading', () => {
      renderComponent();
      expect(screen.getByText('Content Editor')).toBeInTheDocument();
    });

    it('should render Save button', () => {
      renderComponent();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should render Image button', () => {
      renderComponent();
      expect(screen.getByText('Image')).toBeInTheDocument();
    });

    it('should render help text', () => {
      renderComponent();
      expect(screen.getByText(/Press Ctrl\+S to save/)).toBeInTheDocument();
    });

    it('should render markdown textarea with initial content', () => {
      renderComponent();
      const textarea = screen.getByPlaceholderText('Enter markdown...');
      expect(textarea).toHaveValue('# Test Content\n\nSome text here.');
    });

    it('should render preview pane', () => {
      renderComponent();
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    });

    it('should render Markdown and Preview labels', () => {
      renderComponent();
      expect(screen.getByText('Markdown')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });
  });

  describe('Default Content', () => {
    it('should generate default content when no initial content provided', () => {
      renderComponent({ initialContent: null });
      const textarea = screen.getByPlaceholderText('Enter markdown...');
      const value = (textarea as HTMLTextAreaElement).value;

      // Should generate default content from slug
      expect(value).toContain('Test Topic');
      expect(value).toContain('Introduction');
    });

    it('should generate default content when initial content is empty string', () => {
      renderComponent({ initialContent: '' });
      const textarea = screen.getByPlaceholderText('Enter markdown...');
      const value = (textarea as HTMLTextAreaElement).value;

      // Falsy value triggers default content
      expect(value).toContain('Test Topic');
    });
  });

  describe('Save Button State', () => {
    it('should disable Save button when there are no changes', () => {
      renderComponent();
      expect(screen.getByText('Save').closest('button')).toBeDisabled();
    });

    it('should enable Save button when there are changes', async () => {
      renderComponent();
      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# Modified Content' } });

      await waitFor(() => {
        expect(screen.getByText('Save').closest('button')).not.toBeDisabled();
      });
    });
  });

  describe('Unsaved Changes Indicator', () => {
    it('should not show unsaved indicator when content matches initial', () => {
      renderComponent();
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });

    it('should show unsaved indicator when content is modified', async () => {
      renderComponent();
      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# Modified Content' } });

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });
  });

  describe('Inserting an image', () => {
    const pickImage = async (file: File, applyAccept = true) => {
      const user = userEvent.setup({ applyAccept });
      renderComponent({ initialContent: 'before after' });
      const textarea = screen.getByPlaceholderText('Enter markdown...') as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(7, 7);
      await user.upload(screen.getByLabelText('Choose an image to insert'), file);
      return textarea;
    };

    it('uploads the file and drops a markdown image at the caret', async () => {
      const textarea = await pickImage(new File(['png'], 'antenna.png', { type: 'image/png' }));

      await waitFor(() => expect(mockUpload).toHaveBeenCalled());
      const [path, , options] = mockUpload.mock.calls[0];
      expect(path).toMatch(/^topic-images\/[0-9a-f-]+\.png$/);
      expect(options).toEqual({ contentType: 'image/png', upsert: false });
      await waitFor(() => expect(textarea.value).toBe('before ![antenna.png](https://example.com/image.png)after'));
      expect(toast.success).toHaveBeenCalledWith('Image uploaded successfully');
    });

    /** An upload is slow; whatever was typed while it ran has to survive it. */
    it('inserts into the text as it stands when the upload finishes, not as it was', async () => {
      let finishUpload: (result: { error: null }) => void = () => {};
      mockUpload.mockReturnValueOnce(new Promise((resolve) => { finishUpload = resolve; }));
      const textarea = await pickImage(new File(['png'], 'a.png', { type: 'image/png' }));

      await waitFor(() => expect(mockUpload).toHaveBeenCalled());
      // The user keeps typing, and the caret moves, while the upload is in flight.
      fireEvent.change(textarea, { target: { value: 'before MORE after' } });
      textarea.setSelectionRange(12, 12);
      finishUpload({ error: null });

      await waitFor(() =>
        expect(textarea.value).toBe('before MORE ![a.png](https://example.com/image.png)after')
      );
    });

    it('refuses a file that is not one of the image types', async () => {
      await pickImage(new File(['x'], 'notes.txt', { type: 'text/plain' }), false);

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/^Invalid file type: text\/plain/)));
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('reports a failed upload without touching the text', async () => {
      mockUpload.mockResolvedValueOnce({ error: { message: 'bucket full' } });
      const textarea = await pickImage(new File(['png'], 'a.png', { type: 'image/png' }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to upload image: bucket full'));
      expect(textarea.value).toBe('before after');
    });
  });

  describe('Live Preview', () => {
    it('should update preview when content changes', async () => {
      renderComponent();
      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# New Heading' } });

      await waitFor(() => {
        const preview = screen.getByTestId('markdown-preview');
        expect(preview).toHaveTextContent('# New Heading');
      });
    });
  });

  describe('Saving Content', () => {
    it('should save content to database when Save is clicked', async () => {
      const onSave = vi.fn();
      renderComponent({ onSave });

      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      await waitFor(() => {
        expect(screen.getByText('Save').closest('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it('should show success toast on successful save', async () => {
      renderComponent();

      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      await waitFor(() => {
        expect(screen.getByText('Save').closest('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Content saved successfully');
      });
    });

    it('should call onSave callback after successful save', async () => {
      const onSave = vi.fn();
      renderComponent({ onSave });

      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      await waitFor(() => {
        expect(screen.getByText('Save').closest('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });

    it('should show error toast on failed save', async () => {
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
      });

      renderComponent();

      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      await waitFor(() => {
        expect(screen.getByText('Save').closest('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to save content'));
      });
    });

    it('should reset hasChanges after successful save', async () => {
      renderComponent();

      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
      });
    });

    it('should invalidate all relevant query caches on successful save', async () => {
      const testQueryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });
      const invalidateQueriesSpy = vi.spyOn(testQueryClient, 'invalidateQueries');

      render(
        <QueryClientProvider client={testQueryClient}>
          <TopicMarkdownEditor
            topicId="topic-123"
            topicSlug="test-topic"
            initialContent="# Test Content"
            onSave={vi.fn()}
          />
        </QueryClientProvider>
      );

      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      await waitFor(() => {
        expect(screen.getByText('Save').closest('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['topic', 'test-topic'] });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['admin-topics'] });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['topics'] });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['admin-topic-detail', 'topic-123'] });
      });
    });
  });

  describe('Topic Switching Behavior', () => {
    it('should preserve content when remounting with same topicId', async () => {
      const { rerender } = renderComponent({
        topicId: 'topic-123',
        initialContent: '# Original Content',
      });

      // Modify content
      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# Modified Content' } });

      // Simulate remount with same props (like tab switching)
      rerender(
        <QueryClientProvider client={queryClient}>
          <TopicMarkdownEditor
            topicId="topic-123"
            topicSlug="test-topic"
            initialContent="# Original Content"
            onSave={vi.fn()}
          />
        </QueryClientProvider>
      );

      // Content should be preserved (not reset to initial)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter markdown...')).toHaveValue('# Modified Content');
      });
    });

    it('should reset content when switching to different topicId', async () => {
      const { rerender } = renderComponent({
        topicId: 'topic-123',
        initialContent: '# Topic 1 Content',
      });

      // Modify content
      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# Modified Content' } });

      // Switch to different topic
      rerender(
        <QueryClientProvider client={queryClient}>
          <TopicMarkdownEditor
            topicId="topic-456"
            topicSlug="different-topic"
            initialContent="# Topic 2 Content"
            onSave={vi.fn()}
          />
        </QueryClientProvider>
      );

      // Content should be reset to new topic's content
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter markdown...')).toHaveValue('# Topic 2 Content');
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should save on Ctrl+S when there are changes', async () => {
      renderComponent();

      const textarea = screen.getByPlaceholderText('Enter markdown...');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      await waitFor(() => {
        expect(screen.getByText('Save').closest('button')).not.toBeDisabled();
      });

      // Simulate Ctrl+S
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it('should not save on Ctrl+S when there are no changes', async () => {
      renderComponent();

      // Simulate Ctrl+S without making changes
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });

      // Wait a bit and verify no save was triggered
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
