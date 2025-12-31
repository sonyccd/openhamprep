import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminQuestions } from './AdminQuestions';

// Mock Supabase client
const mockFrom = vi.fn();
const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
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

// Mock useExplanationFeedbackStats
vi.mock('@/hooks/useExplanationFeedback', () => ({
  useExplanationFeedbackStats: () => ({
    data: {
      'T1A01': { helpful: 5, notHelpful: 2 },
      'T1A02': { helpful: 1, notHelpful: 10 },
    },
    isLoading: false,
  }),
}));

// Mock useAdminTopics
vi.mock('@/hooks/useTopics', () => ({
  useAdminTopics: () => ({
    data: [
      { id: 'topic-1', title: 'Radio Basics', slug: 'radio-basics' },
      { id: 'topic-2', title: 'Frequencies', slug: 'frequencies' },
    ],
    isLoading: false,
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

// Sample test data
const mockQuestions = [
  {
    id: 'uuid-1',
    display_name: 'T1A01',
    question: 'What is amateur radio?',
    options: ['A radio hobby', 'Commercial radio', 'TV broadcasting', 'Satellite radio'],
    correct_answer: 0,
    explanation: 'Amateur radio is a hobby.',
    links: [],
    edit_history: [],
    figure_url: null,
    forum_url: null,
    discourse_sync_status: null,
    discourse_sync_at: null,
    discourse_sync_error: null,
    topic_questions: [{ topic_id: 'topic-1' }],
  },
  {
    id: 'uuid-2',
    display_name: 'T1A02',
    question: 'What frequencies can Technician class use?',
    options: ['All HF', 'Some VHF/UHF', 'None', 'Only 2m'],
    correct_answer: 1,
    explanation: 'Technician class has VHF/UHF privileges.',
    links: [],
    edit_history: [],
    figure_url: null,
    forum_url: 'https://forum.example.com/t/123',
    discourse_sync_status: 'synced',
    discourse_sync_at: '2024-01-01T00:00:00Z',
    discourse_sync_error: null,
    topic_questions: [],
  },
];

describe('AdminQuestions', () => {
  let queryClient: QueryClient;

  const renderComponent = (props = { testType: 'technician' as const }) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <AdminQuestions {...props} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock for questions query
    mockFrom.mockImplementation((table: string) => {
      if (table === 'questions') {
        return {
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockQuestions,
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'topics') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      }
      return { select: vi.fn() };
    });

    mockInvoke.mockResolvedValue({ data: null, error: null });
  });

  describe('Rendering', () => {
    it('should render the component title with test type', async () => {
      renderComponent({ testType: 'technician' });

      await waitFor(() => {
        expect(screen.getByText(/Technician Questions/)).toBeInTheDocument();
      });
    });

    it('should show question count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Technician Questions \(2\)/)).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search questions...')).toBeInTheDocument();
      });
    });

    it('should render Add Question button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Add Question')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      // Make the query never resolve
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      }));

      renderComponent();

      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Question List', () => {
    it('should display question display names', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
        expect(screen.getByText('T1A02')).toBeInTheDocument();
      });
    });

    it('should display question text', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('What is amateur radio?')).toBeInTheDocument();
      });
    });

    it('should show linked topics badge when question has linked topics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('1 topic')).toBeInTheDocument();
      });
    });

    it('should not show linked topics badge when question has no linked topics', async () => {
      renderComponent();

      await waitFor(() => {
        // T1A02 has no linked topics
        const questionRow = screen.getByText('T1A02').closest('div');
        expect(questionRow?.textContent).not.toContain('0 topics');
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter questions by display name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search questions...');
      fireEvent.change(searchInput, { target: { value: 'T1A01' } });

      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.queryByText('T1A02')).not.toBeInTheDocument();
    });

    it('should filter questions by question text', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search questions...');
      fireEvent.change(searchInput, { target: { value: 'frequencies' } });

      expect(screen.getByText('T1A02')).toBeInTheDocument();
      expect(screen.queryByText('T1A01')).not.toBeInTheDocument();
    });

    it('should update filtered count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('2 questions')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search questions...');
      fireEvent.change(searchInput, { target: { value: 'T1A01' } });

      expect(screen.getByText('1 question')).toBeInTheDocument();
    });

    it('should show "No matching questions found" when search has no results', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search questions...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No matching questions found')).toBeInTheDocument();
    });
  });

  describe('Negative Feedback Filter', () => {
    it('should show negative feedback filter checkbox', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Negative feedback')).toBeInTheDocument();
      });
    });

    it('should filter to questions with negative feedback when checked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /negative feedback/i });
      fireEvent.click(checkbox);

      // T1A02 has more notHelpful (10) than helpful (1)
      await waitFor(() => {
        expect(screen.getByText('T1A02')).toBeInTheDocument();
        // T1A01 has more helpful (5) than notHelpful (2), should be filtered out
        expect(screen.queryByText('T1A01')).not.toBeInTheDocument();
      });
    });

    it('should show clear filter button when filter is active', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /negative feedback/i });
      fireEvent.click(checkbox);

      expect(screen.getByText('Clear filter')).toBeInTheDocument();
    });
  });

  describe('Edit Question Dialog', () => {
    it('should open edit dialog when clicking edit button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      // Find the pencil icon buttons
      const pencilIcons = document.querySelectorAll('.lucide-pencil');
      const editButton = pencilIcons[0]?.closest('button');
      expect(editButton).toBeTruthy();
      fireEvent.click(editButton!);

      await waitFor(() => {
        expect(screen.getByText('Edit Question: T1A01')).toBeInTheDocument();
      });
    });

    it('should show Linked Topics section in edit dialog (read-only)', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const pencilIcons = document.querySelectorAll('.lucide-pencil');
      const editButton = pencilIcons[0]?.closest('button');
      fireEvent.click(editButton!);

      await waitFor(() => {
        expect(screen.getByText('Linked Topics')).toBeInTheDocument();
        expect(screen.getByText(/Topics are linked from the Topics admin section/)).toBeInTheDocument();
      });
    });

    it('should show linked topic names in badges', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const pencilIcons = document.querySelectorAll('.lucide-pencil');
      const editButton = pencilIcons[0]?.closest('button');
      fireEvent.click(editButton!);

      await waitFor(() => {
        expect(screen.getByText('Radio Basics')).toBeInTheDocument();
      });
    });

    it('should show "No topics linked" when question has no linked topics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A02')).toBeInTheDocument();
      });

      // Click the second edit button (for T1A02)
      const pencilIcons = document.querySelectorAll('.lucide-pencil');
      const editButton = pencilIcons[1]?.closest('button');
      fireEvent.click(editButton!);

      await waitFor(() => {
        expect(screen.getByText('No topics linked')).toBeInTheDocument();
      });
    });

    it('should close edit dialog when clicking Cancel', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const pencilIcons = document.querySelectorAll('.lucide-pencil');
      const editButton = pencilIcons[0]?.closest('button');
      fireEvent.click(editButton!);

      await waitFor(() => {
        expect(screen.getByText('Edit Question: T1A01')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Edit Question: T1A01')).not.toBeInTheDocument();
      });
    });
  });

  describe('Add Question Dialog', () => {
    it('should open add dialog when clicking Add Question button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Add Question')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Question'));

      await waitFor(() => {
        expect(screen.getByText('Add New Question')).toBeInTheDocument();
      });
    });

    it('should show Question ID field with FCC note', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Add Question')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Question'));

      await waitFor(() => {
        expect(screen.getByText('Question ID (FCC assigned, e.g., T1A01)')).toBeInTheDocument();
        expect(screen.getByText(/official FCC question ID/)).toBeInTheDocument();
      });
    });

    it('should not have subelement or question_group fields', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Add Question')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Question'));

      await waitFor(() => {
        expect(screen.queryByText('Subelement')).not.toBeInTheDocument();
        expect(screen.queryByText('Question Group')).not.toBeInTheDocument();
      });
    });

    it('should show error when required fields are empty', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Add Question')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Question'));

      await waitFor(() => {
        expect(screen.getByText('Add New Question')).toBeInTheDocument();
      });

      // Find the add button in the dialog (there's a second one)
      const addButtons = screen.getAllByText('Add Question');
      const dialogAddButton = addButtons[addButtons.length - 1];
      fireEvent.click(dialogAddButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please fill in all fields');
      });
    });
  });

  describe('Test Type Prefixes', () => {
    it('should filter Technician questions (T prefix)', async () => {
      renderComponent({ testType: 'technician' });

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('questions');
      });
    });

    it('should filter General questions (G prefix)', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { ...mockQuestions[0], id: 'uuid-g1', display_name: 'G1A01', topic_questions: [] },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      renderComponent({ testType: 'general' });

      await waitFor(() => {
        expect(screen.getByText(/General Questions/)).toBeInTheDocument();
      });
    });

    it('should filter Extra questions (E prefix)', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { ...mockQuestions[0], id: 'uuid-e1', display_name: 'E1A01', topic_questions: [] },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      renderComponent({ testType: 'extra' });

      await waitFor(() => {
        expect(screen.getByText(/Extra Questions/)).toBeInTheDocument();
      });
    });
  });

  describe('Feedback Stats Display', () => {
    it('should show feedback stats badge for questions with feedback', async () => {
      renderComponent();

      await waitFor(() => {
        // T1A01 has 5 helpful and 2 not helpful
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('Highlight Question', () => {
    it('should highlight question when highlightQuestionId is set', async () => {
      renderComponent({ testType: 'technician', highlightQuestionId: 'T1A01' });

      await waitFor(() => {
        // Find the row with border-amber-500 class
        const highlightedRow = document.querySelector('.border-amber-500');
        expect(highlightedRow).toBeInTheDocument();
      });
    });

    it('should auto-open edit dialog for highlighted question', async () => {
      renderComponent({ testType: 'technician', highlightQuestionId: 'T1A01' });

      await waitFor(() => {
        expect(screen.getByText('Edit Question: T1A01')).toBeInTheDocument();
      });

      // Check for "From Stats" badge
      expect(screen.getByText('From Stats')).toBeInTheDocument();
    });
  });
});
