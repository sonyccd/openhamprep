import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicMarkdownEditor } from './TopicMarkdownEditor';

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

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    resolvedTheme: 'light',
  }),
}));

// Mock MDXEditor - we can't easily test the actual editor in JSDOM
vi.mock('@mdxeditor/editor', () => ({
  MDXEditor: ({ markdown, onChange, className }: { markdown: string; onChange: (val: string) => void; className?: string }) => (
    <div data-testid="mdx-editor" className={className}>
      <textarea
        data-testid="mock-editor-textarea"
        value={markdown}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Mock MDXEditor"
      />
    </div>
  ),
  headingsPlugin: vi.fn(() => ({})),
  listsPlugin: vi.fn(() => ({})),
  quotePlugin: vi.fn(() => ({})),
  linkPlugin: vi.fn(() => ({})),
  linkDialogPlugin: vi.fn(() => ({})),
  imagePlugin: vi.fn(() => ({})),
  tablePlugin: vi.fn(() => ({})),
  thematicBreakPlugin: vi.fn(() => ({})),
  codeBlockPlugin: vi.fn(() => ({})),
  markdownShortcutPlugin: vi.fn(() => ({})),
  diffSourcePlugin: vi.fn(() => ({})),
  toolbarPlugin: vi.fn(() => ({})),
  UndoRedo: () => <button>Undo/Redo</button>,
  BoldItalicUnderlineToggles: () => <button>Bold/Italic</button>,
  CodeToggle: () => <button>Code</button>,
  BlockTypeSelect: () => <select><option>Paragraph</option></select>,
  ListsToggle: () => <button>Lists</button>,
  CreateLink: () => <button>Link</button>,
  InsertImage: () => <button>Image</button>,
  InsertTable: () => <button>Table</button>,
  InsertThematicBreak: () => <button>HR</button>,
  InsertCodeBlock: () => <button>Code Block</button>,
  DiffSourceToggleWrapper: () => <button>Source</button>,
  Separator: () => <span>|</span>,
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
      </QueryClientProvider>
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

    it('should render help text', () => {
      renderComponent();
      expect(screen.getByText(/Press Ctrl\+S to save/)).toBeInTheDocument();
    });

    it('should render the MDXEditor with initial content', () => {
      renderComponent();
      expect(screen.getByTestId('mdx-editor')).toBeInTheDocument();
      expect(screen.getByTestId('mock-editor-textarea')).toHaveValue('# Test Content\n\nSome text here.');
    });
  });

  describe('Default Content', () => {
    it('should generate default content when no initial content provided', () => {
      renderComponent({ initialContent: null });

      const textarea = screen.getByTestId('mock-editor-textarea');
      const value = (textarea as HTMLTextAreaElement).value;

      // Should generate default content from slug
      expect(value).toContain('Test Topic');
      expect(value).toContain('Introduction');
    });

    it('should generate default content when initial content is empty string', () => {
      renderComponent({ initialContent: '' });

      const textarea = screen.getByTestId('mock-editor-textarea');
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

    it('should enable Save button when there are changes', () => {
      renderComponent();

      const textarea = screen.getByTestId('mock-editor-textarea');
      fireEvent.change(textarea, { target: { value: '# Modified Content' } });

      expect(screen.getByText('Save').closest('button')).not.toBeDisabled();
    });
  });

  describe('Unsaved Changes Indicator', () => {
    it('should not show unsaved indicator when content matches initial', () => {
      renderComponent();
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });

    it('should show unsaved indicator when content is modified', () => {
      renderComponent();

      const textarea = screen.getByTestId('mock-editor-textarea');
      fireEvent.change(textarea, { target: { value: '# Modified Content' } });

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
  });

  describe('Saving Content', () => {
    it('should save content to database when Save is clicked', async () => {
      const onSave = vi.fn();
      renderComponent({ onSave });

      const textarea = screen.getByTestId('mock-editor-textarea');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it('should show success toast on successful save', async () => {
      renderComponent();

      const textarea = screen.getByTestId('mock-editor-textarea');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Content saved successfully');
      });
    });

    it('should call onSave callback after successful save', async () => {
      const onSave = vi.fn();
      renderComponent({ onSave });

      const textarea = screen.getByTestId('mock-editor-textarea');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

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

      const textarea = screen.getByTestId('mock-editor-textarea');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to save content'));
      });
    });

    it('should reset hasChanges after successful save', async () => {
      renderComponent();

      const textarea = screen.getByTestId('mock-editor-textarea');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
      });
    });

    it('should invalidate all relevant query caches on successful save', async () => {
      // Create a new QueryClient with a spy on invalidateQueries
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

      const textarea = screen.getByTestId('mock-editor-textarea');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        // Should invalidate topic by slug
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['topic', 'test-topic'] });
        // Should invalidate admin topics list
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['admin-topics'] });
        // Should invalidate public topics list
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['topics'] });
        // Should invalidate admin topic detail (for tab switching)
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['admin-topic-detail', 'topic-123'] });
      });
    });
  });

  describe('Topic Switching Behavior', () => {
    it('should preserve content when remounting with same topicId', () => {
      const { rerender } = renderComponent({
        topicId: 'topic-123',
        initialContent: '# Original Content',
      });

      // Modify content
      const textarea = screen.getByTestId('mock-editor-textarea');
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
      expect(screen.getByTestId('mock-editor-textarea')).toHaveValue('# Modified Content');
    });

    it('should reset content when switching to different topicId', () => {
      const { rerender } = renderComponent({
        topicId: 'topic-123',
        initialContent: '# Topic 1 Content',
      });

      // Modify content
      const textarea = screen.getByTestId('mock-editor-textarea');
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
      expect(screen.getByTestId('mock-editor-textarea')).toHaveValue('# Topic 2 Content');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should save on Ctrl+S when there are changes', async () => {
      renderComponent();

      const textarea = screen.getByTestId('mock-editor-textarea');
      fireEvent.change(textarea, { target: { value: '# New Content' } });

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
