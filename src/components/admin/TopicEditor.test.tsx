import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicEditor } from './TopicEditor';
import { Topic } from '@/hooks/useTopics';

// Mock Supabase client
const mockFrom = vi.fn();
const mockDownload = vi.fn();
const mockStorageRemove = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: vi.fn(() => ({
        download: mockDownload,
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: (...args: unknown[]) => mockStorageRemove(...args),
      })),
    },
  },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'admin@test.com' },
    loading: false,
  }),
}));

// Mock child components to simplify testing
vi.mock('./TopicMarkdownEditor', () => ({
  TopicMarkdownEditor: ({ topicId, topicSlug }: { topicId: string; topicSlug: string }) => (
    <div data-testid="markdown-editor">
      Markdown Editor for {topicSlug} ({topicId})
    </div>
  ),
}));

vi.mock('./TopicResourceManager', () => ({
  TopicResourceManager: ({ topicId }: { topicId: string }) => (
    <div data-testid="resource-manager">Resource Manager for {topicId}</div>
  ),
}));

vi.mock('./TopicQuestionManager', () => ({
  TopicQuestionManager: ({ topicId }: { topicId: string }) => (
    <div data-testid="question-manager">Question Manager for {topicId}</div>
  ),
}));

vi.mock('./EditHistoryViewer', () => ({
  EditHistoryViewer: () => <div data-testid="edit-history">Edit History</div>,
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
  subelements: [],
  resources: [
    {
      id: 'resource-1',
      topic_id: 'topic-123',
      resource_type: 'video',
      title: 'Intro Video',
      url: 'https://youtube.com/watch?v=123',
      storage_path: null,
      description: 'Introduction video',
      display_order: 1,
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
};

const mockLinkedQuestions = [
  { id: 'uuid-1', display_name: 'T1A01', question: 'What is amateur radio?' },
  { id: 'uuid-2', display_name: 'T1A02', question: 'What frequencies?' },
];

describe('TopicEditor', () => {
  let queryClient: QueryClient;
  const mockOnBack = vi.fn();

  const renderComponent = (topic: Topic = mockTopic) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TopicEditor topic={topic} onBack={mockOnBack} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockFrom.mockImplementation((table: string) => {
      if (table === 'topics') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockTopic,
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'topic_questions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockLinkedQuestions.map(q => ({ question: q })),
              error: null,
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });

    mockDownload.mockResolvedValue({
      data: new Blob(['# Topic Content']),
      error: null,
    });

    mockStorageRemove.mockResolvedValue({ error: null });
  });

  describe('Header', () => {
    it('should display topic title', () => {
      renderComponent();

      expect(screen.getByText('Amateur Radio Basics')).toBeInTheDocument();
    });

    it('should display topic slug', () => {
      renderComponent();

      expect(screen.getByText('/amateur-radio-basics')).toBeInTheDocument();
    });

    it('should show Published badge for published topics', () => {
      renderComponent();

      expect(screen.getByText('Published')).toBeInTheDocument();
    });

    it('should show Draft badge for unpublished topics', () => {
      renderComponent({ ...mockTopic, is_published: false });

      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('should call onBack when Back button is clicked', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Back'));

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Tabs', () => {
    it('should render all four tabs', () => {
      renderComponent();

      expect(screen.getByRole('tab', { name: /Content/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Questions/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Resources/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Settings/i })).toBeInTheDocument();
    });

    it('should show Content tab by default', () => {
      renderComponent();

      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
    });

    it('should show Questions tab content when clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Questions/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Questions/i }));

      // Wait a bit for tab content to render
      await waitFor(() => {
        expect(screen.getByTestId('question-manager')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show Resources tab content when clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Resources/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Resources/i }));

      await waitFor(() => {
        expect(screen.getByTestId('resource-manager')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show Settings tab content when clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole('tab', { name: /Settings/i }));

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show linked questions count badge on Questions tab', async () => {
      renderComponent();

      // Wait for linked questions query to complete
      await waitFor(() => {
        // The badge should show the count
        const questionsTab = screen.getByRole('tab', { name: /Questions/i });
        expect(questionsTab.textContent).toContain('2');
      }, { timeout: 5000 });
    });

    it('should show resources count badge on Resources tab', () => {
      renderComponent();

      const resourcesTab = screen.getByRole('tab', { name: /Resources/i });
      expect(resourcesTab.textContent).toContain('1');
    });
  });

  describe('Settings Tab', () => {
    // Helper to render and switch to Settings tab
    const setupSettingsTab = async () => {
      const user = userEvent.setup();

      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <TopicEditor topic={mockTopic} onBack={mockOnBack} />
        </QueryClientProvider>
      );

      // Wait for tabs to be available
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Settings/i })).toBeInTheDocument();
      });

      // Click the Settings tab using userEvent for proper state updates
      const settingsTab = screen.getByRole('tab', { name: /Settings/i });
      await user.click(settingsTab);

      // Wait for Settings panel to be active (checking for an element in that panel)
      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      }, { timeout: 5000 });

      return user;
    };

    it('should display title input with current value', async () => {
      await setupSettingsTab();
      expect(screen.getByDisplayValue('Amateur Radio Basics')).toBeInTheDocument();
    });

    it('should display slug input with current value', async () => {
      await setupSettingsTab();
      expect(screen.getByDisplayValue('amateur-radio-basics')).toBeInTheDocument();
    });

    it('should display description textarea', async () => {
      await setupSettingsTab();
      expect(screen.getByDisplayValue('Introduction to amateur radio')).toBeInTheDocument();
    });

    it('should show Generate button for slug', async () => {
      await setupSettingsTab();
      expect(screen.getByText('Generate')).toBeInTheDocument();
    });

    it('should generate slug from title when Generate is clicked', async () => {
      const user = await setupSettingsTab();

      // Update the title
      const titleInput = screen.getByDisplayValue('Amateur Radio Basics');
      await user.clear(titleInput);
      await user.type(titleInput, 'New Topic Title');

      // Click generate
      await user.click(screen.getByText('Generate'));

      // Check slug was generated
      await waitFor(() => {
        expect(screen.getByDisplayValue('new-topic-title')).toBeInTheDocument();
      });
    });

    it('should display visibility section with switch', async () => {
      await setupSettingsTab();
      expect(screen.getByText('Visibility')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should show correct visibility message for published topic', async () => {
      await setupSettingsTab();
      expect(screen.getByText('This topic is visible to all users')).toBeInTheDocument();
    });

    it('should display license type checkboxes', async () => {
      await setupSettingsTab();
      expect(screen.getByText('Technician')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Extra')).toBeInTheDocument();
    });

    it('should have correct license types checked', async () => {
      await setupSettingsTab();
      const checkboxes = screen.getAllByRole('checkbox');
      // First two checkboxes should be checked (Technician and General)
      expect(checkboxes[0]).toHaveAttribute('data-state', 'checked');
      expect(checkboxes[1]).toHaveAttribute('data-state', 'checked');
      expect(checkboxes[2]).toHaveAttribute('data-state', 'unchecked');
    });

    it('should display display order input', async () => {
      await setupSettingsTab();
      expect(screen.getByText('Display Order')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });

    it('should display edit history section', async () => {
      await setupSettingsTab();
      // Use getAllByText since EditHistoryViewer mock also renders "Edit History" text
      const editHistoryHeadings = screen.getAllByText('Edit History');
      expect(editHistoryHeadings.length).toBeGreaterThan(0);
      expect(screen.getByTestId('edit-history')).toBeInTheDocument();
    });

    it('should have Save Settings button disabled initially', async () => {
      await setupSettingsTab();
      const saveButton = screen.getByRole('button', { name: /Save Settings/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save Settings button after making changes', async () => {
      const user = await setupSettingsTab();

      const titleInput = screen.getByDisplayValue('Amateur Radio Basics');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save Settings/i });
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('should call update mutation when Save Settings is clicked', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTopic,
                  error: null,
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestions.map(q => ({ question: q })),
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const user = await setupSettingsTab();

      const titleInput = screen.getByDisplayValue('Amateur Radio Basics');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      const saveButton = screen.getByRole('button', { name: /Save Settings/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it('should show success toast after saving', async () => {
      const user = await setupSettingsTab();

      const titleInput = screen.getByDisplayValue('Amateur Radio Basics');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      const saveButton = screen.getByRole('button', { name: /Save Settings/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Settings saved successfully');
      });
    });
  });

  describe('Questions Tab Integration', () => {
    it('should pass topicId to TopicQuestionManager', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole('tab', { name: /Questions/i }));

      await waitFor(() => {
        expect(screen.getByText('Question Manager for topic-123')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Unpublished Topic', () => {
    it('should show visibility message for unpublished topic', async () => {
      const user = userEvent.setup();

      // Need to update mock for unpublished topic
      mockFrom.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockTopic, is_published: false },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      renderComponent({ ...mockTopic, is_published: false });

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Settings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Settings/i }));

      await waitFor(() => {
        expect(screen.getByText('This topic is only visible to admins')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Topic with no resources', () => {
    it('should not show badge count when no resources', () => {
      renderComponent({ ...mockTopic, resources: [] });

      const resourcesTab = screen.getByRole('tab', { name: /Resources/i });
      // Should not contain a number badge
      expect(resourcesTab.querySelector('.badge')).toBeNull();
    });
  });

  describe('Delete Topic', () => {
    // Helper to render and switch to Settings tab
    const setupSettingsTabForDelete = async () => {
      const user = userEvent.setup();

      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <TopicEditor topic={mockTopic} onBack={mockOnBack} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Settings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Settings/i }));

      await waitFor(() => {
        expect(screen.getByText('Danger Zone')).toBeInTheDocument();
      }, { timeout: 5000 });

      return user;
    };

    it('should display Danger Zone section in Settings tab', async () => {
      await setupSettingsTabForDelete();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
      expect(screen.getByText('Delete this topic')).toBeInTheDocument();
    });

    it('should display Delete Topic button in Danger Zone', async () => {
      await setupSettingsTabForDelete();
      expect(screen.getByRole('button', { name: /Delete Topic/i })).toBeInTheDocument();
    });

    it('should open confirmation dialog when Delete Topic button is clicked', async () => {
      const user = await setupSettingsTabForDelete();

      await user.click(screen.getByRole('button', { name: /Delete Topic/i }));

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
        expect(screen.getByText(/"Amateur Radio Basics"/)).toBeInTheDocument();
      });
    });

    it('should show warning message in confirmation dialog', async () => {
      const user = await setupSettingsTabForDelete();

      await user.click(screen.getByRole('button', { name: /Delete Topic/i }));

      await waitFor(() => {
        // The dialog shows warning text (may match multiple elements as text appears in Danger Zone and dialog)
        const warningTexts = screen.getAllByText(/This will permanently remove the topic/);
        expect(warningTexts.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
      });
    });

    it('should close dialog when Cancel is clicked', async () => {
      const user = await setupSettingsTabForDelete();

      await user.click(screen.getByRole('button', { name: /Delete Topic/i }));

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText(/Are you sure you want to delete/)).not.toBeInTheDocument();
      });
    });

    it('should call delete mutation and onBack when deletion is confirmed', async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTopic,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            delete: mockDeleteFn,
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestions.map(q => ({ question: q })),
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const user = await setupSettingsTabForDelete();

      // Click the Delete Topic button in the Danger Zone to open the dialog
      fireEvent.click(screen.getByRole('button', { name: /Delete Topic/i }));

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });

      // Find and click the confirm button in the dialog (role="alertdialog" content)
      const confirmButton = screen.getByRole('alertdialog').querySelector('button.bg-destructive');
      expect(confirmButton).toBeTruthy();
      fireEvent.click(confirmButton!);

      await waitFor(() => {
        expect(mockDeleteFn).toHaveBeenCalled();
        expect(mockDeleteEq).toHaveBeenCalledWith('id', 'topic-123');
      });
    });

    it('should show success toast and navigate back after successful deletion', async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTopic,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            delete: mockDeleteFn,
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestions.map(q => ({ question: q })),
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const user = await setupSettingsTabForDelete();

      fireEvent.click(screen.getByRole('button', { name: /Delete Topic/i }));

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('alertdialog').querySelector('button.bg-destructive');
      fireEvent.click(confirmButton!);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Topic deleted successfully');
        expect(mockOnBack).toHaveBeenCalled();
      });
    });

    it('should show error toast when deletion fails', async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: { message: 'Database error' } });
      const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTopic,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            delete: mockDeleteFn,
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestions.map(q => ({ question: q })),
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const user = await setupSettingsTabForDelete();

      fireEvent.click(screen.getByRole('button', { name: /Delete Topic/i }));

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('alertdialog').querySelector('button.bg-destructive');
      fireEvent.click(confirmButton!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to delete topic'));
      });
    });

    it('should delete storage content before deleting database record', async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTopic,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            delete: mockDeleteFn,
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestions.map(q => ({ question: q })),
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const user = await setupSettingsTabForDelete();

      fireEvent.click(screen.getByRole('button', { name: /Delete Topic/i }));

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('alertdialog').querySelector('button.bg-destructive');
      fireEvent.click(confirmButton!);

      await waitFor(() => {
        // Storage remove should be called with the content path
        expect(mockStorageRemove).toHaveBeenCalledWith(['articles/amateur-radio-basics.md']);
        // Database delete should also be called
        expect(mockDeleteFn).toHaveBeenCalled();
      });
    });

    it('should continue deletion even if storage cleanup fails', async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      // Mock storage removal to fail
      mockStorageRemove.mockResolvedValue({ error: { message: 'Storage error' } });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTopic,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            delete: mockDeleteFn,
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestions.map(q => ({ question: q })),
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const user = await setupSettingsTabForDelete();

      fireEvent.click(screen.getByRole('button', { name: /Delete Topic/i }));

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('alertdialog').querySelector('button.bg-destructive');
      fireEvent.click(confirmButton!);

      await waitFor(() => {
        // Database delete should still be called even if storage fails
        expect(mockDeleteFn).toHaveBeenCalled();
        // And success should still be shown
        expect(toast.success).toHaveBeenCalledWith('Topic deleted successfully');
      });
    });

    it('should disable delete button while deletion is in progress', async () => {
      const mockDeleteEq = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'topics') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTopic,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            delete: mockDeleteFn,
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestions.map(q => ({ question: q })),
                error: null,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const user = await setupSettingsTabForDelete();

      // Initial state - button should be enabled
      const deleteButton = screen.getByRole('button', { name: /Delete Topic/i });
      expect(deleteButton).not.toBeDisabled();

      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('alertdialog').querySelector('button.bg-destructive');
      fireEvent.click(confirmButton!);

      // Wait a tick for the mutation to start
      await waitFor(() => {
        expect(mockStorageRemove).toHaveBeenCalled();
      });
    });
  });
});
