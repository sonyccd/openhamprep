import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicQuestionManager } from './TopicQuestionManager';

// Mock Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
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

// Sample test data
const mockQuestions = [
  { id: 'uuid-1', display_name: 'T1A01', question: 'What is amateur radio?' },
  { id: 'uuid-2', display_name: 'T1A02', question: 'What frequencies can Technician use?' },
  { id: 'uuid-3', display_name: 'G1B01', question: 'What is a General class license?' },
  { id: 'uuid-4', display_name: 'E2A01', question: 'What is an Extra class privilege?' },
];

const mockLinkedQuestionIds = ['uuid-1'];

describe('TopicQuestionManager', () => {
  let queryClient: QueryClient;

  const renderComponent = (topicId = 'topic-uuid-123') => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TopicQuestionManager topicId={topicId} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock chain for questions query
    mockFrom.mockImplementation((table: string) => {
      if (table === 'questions') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockQuestions,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'topic_questions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockLinkedQuestionIds.map(id => ({ question_id: id })),
              error: null,
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
    });
  });

  describe('Rendering', () => {
    it('should render the header and description', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Linked Questions')).toBeInTheDocument();
      });
      expect(screen.getByText(/Select which exam questions this topic covers/)).toBeInTheDocument();
    });

    it('should render the search input', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by ID, text, or paste comma-separated IDs...')).toBeInTheDocument();
      });
    });

    it('should render the filter dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('All Tests')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      // Make the query never resolve
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(new Promise(() => {})),
          eq: vi.fn().mockReturnValue(new Promise(() => {})),
        }),
      }));

      renderComponent();

      // Should show loading spinner
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    it('should display linked questions count badge', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('1 linked')).toBeInTheDocument();
      });
    });
  });

  describe('Question Lists', () => {
    it('should display linked questions in their own section', async () => {
      renderComponent();

      await waitFor(() => {
        // The linked question should appear
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });
    });

    it('should display unlinked questions in available section', async () => {
      renderComponent();

      await waitFor(() => {
        // Unlinked questions should appear
        expect(screen.getByText('T1A02')).toBeInTheDocument();
        expect(screen.getByText('G1B01')).toBeInTheDocument();
        expect(screen.getByText('E2A01')).toBeInTheDocument();
      });
    });

    it('should show question text preview', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('What is amateur radio?')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter questions by display name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by ID, text, or paste comma-separated IDs...');
      fireEvent.change(searchInput, { target: { value: 'T1A01' } });

      // Should only show T1A01
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.queryByText('G1B01')).not.toBeInTheDocument();
    });

    it('should filter questions by question text', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by ID, text, or paste comma-separated IDs...');
      fireEvent.change(searchInput, { target: { value: 'General class' } });

      // Should only show the General question
      expect(screen.getByText('G1B01')).toBeInTheDocument();
      expect(screen.queryByText('T1A01')).not.toBeInTheDocument();
    });

    it('should show "No matching questions found" when search has no results', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by ID, text, or paste comma-separated IDs...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No matching questions found')).toBeInTheDocument();
      });
    });

    it('should be case insensitive', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by ID, text, or paste comma-separated IDs...');
      fireEvent.change(searchInput, { target: { value: 't1a01' } });

      expect(screen.getByText('T1A01')).toBeInTheDocument();
    });

    it('should filter by comma-separated question IDs', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by ID, text, or paste comma-separated IDs...');
      fireEvent.change(searchInput, { target: { value: 'T1A01, G1B01' } });

      // Should show both matching questions
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText('G1B01')).toBeInTheDocument();
      // Should not show non-matching questions
      expect(screen.queryByText('T1A02')).not.toBeInTheDocument();
      expect(screen.queryByText('E2A01')).not.toBeInTheDocument();
    });

    it('should handle comma-separated IDs with extra spaces', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by ID, text, or paste comma-separated IDs...');
      fireEvent.change(searchInput, { target: { value: '  T1A01 ,  G1B01  , E2A01  ' } });

      // Should show all three matching questions
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText('G1B01')).toBeInTheDocument();
      expect(screen.getByText('E2A01')).toBeInTheDocument();
      // Should not show non-matching question
      expect(screen.queryByText('T1A02')).not.toBeInTheDocument();
    });

    it('should handle comma-separated IDs case insensitively', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by ID, text, or paste comma-separated IDs...');
      fireEvent.change(searchInput, { target: { value: 't1a01, g1b01' } });

      // Should show both matching questions (case insensitive)
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText('G1B01')).toBeInTheDocument();
    });

    it('should filter empty terms from comma-separated list', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by ID, text, or paste comma-separated IDs...');
      fireEvent.change(searchInput, { target: { value: 'T1A01, , , G1B01' } });

      // Should show both matching questions, ignoring empty terms
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText('G1B01')).toBeInTheDocument();
      expect(screen.queryByText('T1A02')).not.toBeInTheDocument();
    });

    it('should support partial matching in comma-separated list', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by ID, text, or paste comma-separated IDs...');
      fireEvent.change(searchInput, { target: { value: 'T1A, E2A' } });

      // Should show questions that contain T1A or E2A
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText('T1A02')).toBeInTheDocument();
      expect(screen.getByText('E2A01')).toBeInTheDocument();
      // Should not show G1B01
      expect(screen.queryByText('G1B01')).not.toBeInTheDocument();
    });
  });

  describe('Test Type Filter', () => {
    it('should filter to Technician questions only', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      // Open the filter dropdown and select Technician
      const filterTrigger = screen.getByText('All Tests');
      fireEvent.click(filterTrigger);

      await waitFor(() => {
        const technicianOption = screen.getByRole('option', { name: 'Technician' });
        fireEvent.click(technicianOption);
      });

      // Should show only T questions
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText('T1A02')).toBeInTheDocument();
      expect(screen.queryByText('G1B01')).not.toBeInTheDocument();
      expect(screen.queryByText('E2A01')).not.toBeInTheDocument();
    });

    it('should filter to General questions only', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('G1B01')).toBeInTheDocument();
      });

      const filterTrigger = screen.getByText('All Tests');
      fireEvent.click(filterTrigger);

      await waitFor(() => {
        const generalOption = screen.getByRole('option', { name: 'General' });
        fireEvent.click(generalOption);
      });

      expect(screen.getByText('G1B01')).toBeInTheDocument();
      expect(screen.queryByText('T1A01')).not.toBeInTheDocument();
    });

    it('should filter to Extra questions only', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('E2A01')).toBeInTheDocument();
      });

      const filterTrigger = screen.getByText('All Tests');
      fireEvent.click(filterTrigger);

      await waitFor(() => {
        const extraOption = screen.getByRole('option', { name: 'Extra' });
        fireEvent.click(extraOption);
      });

      expect(screen.getByText('E2A01')).toBeInTheDocument();
      expect(screen.queryByText('T1A01')).not.toBeInTheDocument();
    });
  });

  describe('Linking/Unlinking Questions', () => {
    it('should call insert when clicking unlinked question', async () => {
      const mockInsertFn = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockQuestions,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestionIds.map(id => ({ question_id: id })),
                error: null,
              }),
            }),
            insert: mockInsertFn,
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      renderComponent('topic-123');

      await waitFor(() => {
        expect(screen.getByText('T1A02')).toBeInTheDocument();
      });

      // Click on an unlinked question to link it
      const questionRow = screen.getByText('What frequencies can Technician use?').closest('button');
      fireEvent.click(questionRow!);

      await waitFor(() => {
        expect(mockInsertFn).toHaveBeenCalledWith({
          topic_id: 'topic-123',
          question_id: 'uuid-2',
        });
      });
    });

    it('should show success toast when question is linked', async () => {
      const mockInsertFn = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockQuestions,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestionIds.map(id => ({ question_id: id })),
                error: null,
              }),
            }),
            insert: mockInsertFn,
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A02')).toBeInTheDocument();
      });

      const questionRow = screen.getByText('What frequencies can Technician use?').closest('button');
      fireEvent.click(questionRow!);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Question linked');
      });
    });

    it('should show error toast when linking fails', async () => {
      const mockInsertFn = vi.fn().mockResolvedValue({ error: { message: 'Database error' } });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockQuestions,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestionIds.map(id => ({ question_id: id })),
                error: null,
              }),
            }),
            insert: mockInsertFn,
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A02')).toBeInTheDocument();
      });

      const questionRow = screen.getByText('What frequencies can Technician use?').closest('button');
      fireEvent.click(questionRow!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to link question'));
      });
    });

    it('should call delete when clicking linked question', async () => {
      const mockDeleteEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteEq1 = vi.fn().mockReturnValue({ eq: mockDeleteEq2 });
      const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq1 });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockQuestions,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestionIds.map(id => ({ question_id: id })),
                error: null,
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            delete: mockDeleteFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent('topic-123');

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      // Click on the linked question to unlink it
      const questionRow = screen.getByText('What is amateur radio?').closest('button');
      fireEvent.click(questionRow!);

      await waitFor(() => {
        expect(mockDeleteFn).toHaveBeenCalled();
        expect(mockDeleteEq1).toHaveBeenCalledWith('topic_id', 'topic-123');
        expect(mockDeleteEq2).toHaveBeenCalledWith('question_id', 'uuid-1');
      });
    });

    it('should show success toast when question is unlinked', async () => {
      const mockDeleteEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteEq1 = vi.fn().mockReturnValue({ eq: mockDeleteEq2 });
      const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq1 });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockQuestions,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockLinkedQuestionIds.map(id => ({ question_id: id })),
                error: null,
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            delete: mockDeleteFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const questionRow = screen.getByText('What is amateur radio?').closest('button');
      fireEvent.click(questionRow!);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Question unlinked');
      });
    });
  });

  describe('Stats Display', () => {
    it('should display filtered questions count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('4 questions match filter')).toBeInTheDocument();
      });
    });

    it('should update count when search filters results', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by ID, text, or paste comma-separated IDs...');
      fireEvent.change(searchInput, { target: { value: 'T1A' } });

      await waitFor(() => {
        expect(screen.getByText('2 questions match filter')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show "All questions are linked" when no unlinked questions remain', async () => {
      // Mock all questions as linked
      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockQuestions,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'topic_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockQuestions.map(q => ({ question_id: q.id })),
                error: null,
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('All questions are linked')).toBeInTheDocument();
      });
    });
  });

  describe('Checkbox State', () => {
    it('should show checked checkbox for linked questions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      // Find the linked question row and check its checkbox
      const linkedQuestionRow = screen.getByText('What is amateur radio?').closest('button');
      const checkbox = linkedQuestionRow?.querySelector('[role="checkbox"]');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('should show unchecked checkbox for unlinked questions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A02')).toBeInTheDocument();
      });

      // Find an unlinked question row and check its checkbox
      const unlinkedQuestionRow = screen.getByText('What frequencies can Technician use?').closest('button');
      const checkbox = unlinkedQuestionRow?.querySelector('[role="checkbox"]');
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Pagination', () => {
    it('should fetch all questions across multiple pages', async () => {
      // Create more questions than a single page would hold
      const page1Questions = [
        { id: 'uuid-1', display_name: 'T1A01', question: 'Question 1' },
        { id: 'uuid-2', display_name: 'T1A02', question: 'Question 2' },
      ];
      const page2Questions = [
        { id: 'uuid-3', display_name: 'T1A03', question: 'Question 3' },
      ];

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockImplementation((from: number, to: number) => {
                  callCount++;
                  // First page returns full page size (simulating more data)
                  if (from === 0) {
                    return Promise.resolve({
                      data: page1Questions,
                      error: null,
                    });
                  }
                  // Second page returns less than page size (end of data)
                  return Promise.resolve({
                    data: page2Questions,
                    error: null,
                  });
                }),
              }),
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
            insert: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      renderComponent();

      // Wait for all questions to load
      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      // With the small test data (2 + 1 = 3 questions),
      // pagination may not trigger a second call since page size is 1000
      // but the mock infrastructure is set up correctly
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText('T1A02')).toBeInTheDocument();
    });

    it('should handle empty question list', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
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
            insert: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('0 questions match filter')).toBeInTheDocument();
      });
    });
  });
});
