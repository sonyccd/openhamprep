import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChapterQuestionManager } from './ChapterQuestionManager';

// Mock Supabase client
const mockUpdate = vi.fn();
const mockEq = vi.fn();
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
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

import { toast } from 'sonner';

// Sample test data
const mockQuestions = [
  {
    id: 'uuid-1',
    display_name: 'T1A01',
    question: 'What is amateur radio?',
    arrl_chapter_id: 'chapter-1',
    arrl_page_reference: '15-16',
  },
  {
    id: 'uuid-2',
    display_name: 'T1A02',
    question: 'What frequencies can Technician use?',
    arrl_chapter_id: 'chapter-1',
    arrl_page_reference: null,
  },
  {
    id: 'uuid-3',
    display_name: 'T1B01',
    question: 'What is the purpose of the FCC rules?',
    arrl_chapter_id: null,
    arrl_page_reference: null,
  },
  {
    id: 'uuid-4',
    display_name: 'T1B02',
    question: 'What is the amateur service?',
    arrl_chapter_id: 'chapter-2', // Linked to a different chapter
    arrl_page_reference: '25',
  },
];

describe('ChapterQuestionManager', () => {
  let queryClient: QueryClient;

  const renderComponent = (chapterId = 'chapter-1', licenseType: 'T' | 'G' | 'E' = 'T') => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <ChapterQuestionManager chapterId={chapterId} licenseType={licenseType} />
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
            like: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockQuestions,
                  error: null,
                }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          like: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      };
    });
  });

  describe('Rendering', () => {
    it('should render the header and description', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Chapter Questions')).toBeInTheDocument();
      });
      expect(screen.getByText(/Link exam questions to this chapter/)).toBeInTheDocument();
    });

    it('should render the search input', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search questions by ID or text...')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      // Make the query never resolve
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          like: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
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
        expect(screen.getByText('2 linked')).toBeInTheDocument();
      });
    });
  });

  describe('Question Lists', () => {
    it('should display linked questions in their own section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
        expect(screen.getByText('T1A02')).toBeInTheDocument();
      });
    });

    it('should display unlinked questions in available section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1B01')).toBeInTheDocument();
      });
    });

    it('should show question text preview', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('What is amateur radio?')).toBeInTheDocument();
      });
    });

    it('should show page reference for linked questions', async () => {
      renderComponent();

      await waitFor(() => {
        // The page reference input should have the value
        const pageInput = screen.getByDisplayValue('15-16');
        expect(pageInput).toBeInTheDocument();
      });
    });

    it('should show "In another chapter" badge for questions linked elsewhere', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('In another chapter')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter questions by display name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search questions by ID or text...');
      fireEvent.change(searchInput, { target: { value: 'T1A01' } });

      // Should only show T1A01
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.queryByText('T1B01')).not.toBeInTheDocument();
    });

    it('should filter questions by question text', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search questions by ID or text...');
      fireEvent.change(searchInput, { target: { value: 'FCC rules' } });

      // Should only show the FCC question
      expect(screen.getByText('T1B01')).toBeInTheDocument();
      expect(screen.queryByText('T1A01')).not.toBeInTheDocument();
    });

    it('should show "No matching questions found" when search has no results', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search questions by ID or text...');
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

      const searchInput = screen.getByPlaceholderText('Search questions by ID or text...');
      fireEvent.change(searchInput, { target: { value: 't1a01' } });

      expect(screen.getByText('T1A01')).toBeInTheDocument();
    });
  });

  describe('Linking Questions', () => {
    it('should call update when clicking unlinked question', async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockUpdateEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent('chapter-1');

      await waitFor(() => {
        expect(screen.getByText('T1B01')).toBeInTheDocument();
      });

      // Click on an unlinked question to link it
      const questionRow = screen.getByText('What is the purpose of the FCC rules?').closest('button');
      fireEvent.click(questionRow!);

      await waitFor(() => {
        expect(mockUpdateFn).toHaveBeenCalledWith({
          arrl_chapter_id: 'chapter-1',
          arrl_page_reference: null,
        });
        expect(mockUpdateEq).toHaveBeenCalledWith('id', 'uuid-3');
      });
    });

    it('should show success toast when question is linked', async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockUpdateEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1B01')).toBeInTheDocument();
      });

      const questionRow = screen.getByText('What is the purpose of the FCC rules?').closest('button');
      fireEvent.click(questionRow!);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Question linked to chapter');
      });
    });

    it('should show error toast when linking fails', async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: { message: 'Database error' } });
      const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockUpdateEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1B01')).toBeInTheDocument();
      });

      const questionRow = screen.getByText('What is the purpose of the FCC rules?').closest('button');
      fireEvent.click(questionRow!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to link question'));
      });
    });
  });

  describe('Unlinking Questions', () => {
    it('should call update with null when clicking unlink button', async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockUpdateEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent('chapter-1');

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      // Click on the X button to unlink
      const unlinkButtons = screen.getAllByTitle('Unlink question');
      fireEvent.click(unlinkButtons[0]);

      await waitFor(() => {
        expect(mockUpdateFn).toHaveBeenCalledWith({
          arrl_chapter_id: null,
          arrl_page_reference: null,
        });
      });
    });

    it('should show success toast when question is unlinked', async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockUpdateEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      const unlinkButtons = screen.getAllByTitle('Unlink question');
      fireEvent.click(unlinkButtons[0]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Question unlinked from chapter');
      });
    });
  });

  describe('Page Reference', () => {
    it('should display page reference input for linked questions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('15-16')).toBeInTheDocument();
      });
    });

    it('should show empty input for questions without page reference', async () => {
      renderComponent();

      await waitFor(() => {
        // T1A02 has no page reference
        const inputs = screen.getAllByPlaceholderText('e.g., 45');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('should update page reference on blur', async () => {
      const user = userEvent.setup();
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockUpdateEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('15-16')).toBeInTheDocument();
      });

      // Find and modify the page reference input
      const pageInput = screen.getByDisplayValue('15-16');
      await user.clear(pageInput);
      await user.type(pageInput, '20-25');
      fireEvent.blur(pageInput);

      await waitFor(() => {
        expect(mockUpdateFn).toHaveBeenCalledWith({
          arrl_page_reference: '20-25',
        });
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

      const searchInput = screen.getByPlaceholderText('Search questions by ID or text...');
      fireEvent.change(searchInput, { target: { value: 'T1A' } });

      await waitFor(() => {
        expect(screen.getByText('2 questions match filter')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show "All questions are linked to chapters" when no unlinked questions remain', async () => {
      // Mock all questions as linked to this chapter
      const allLinkedQuestions = mockQuestions.map(q => ({
        ...q,
        arrl_chapter_id: 'chapter-1',
      }));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: allLinkedQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('All questions are linked to chapters')).toBeInTheDocument();
      });
    });
  });

  describe('Checkbox State', () => {
    it('should show checked checkbox for linked questions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });

      // Find the linked question row (it's a div with the bg-primary/5 class)
      const linkedQuestionText = screen.getByText('What is amateur radio?');
      // Navigate up to find the row container that has the checkbox
      const linkedRow = linkedQuestionText.closest('.bg-primary\\/5');
      const checkbox = linkedRow?.querySelector('[role="checkbox"]');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('should show unchecked checkbox for unlinked questions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('T1B01')).toBeInTheDocument();
      });

      // Find an unlinked question row and check its checkbox
      const unlinkedQuestionRow = screen.getByText('What is the purpose of the FCC rules?').closest('button');
      const checkbox = unlinkedQuestionRow?.querySelector('[role="checkbox"]');
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Bulk Link Questions', () => {
    it('should render bulk link section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Bulk Link Questions')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('T1A01, T1A02, T1A03...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Link Questions/i })).toBeInTheDocument();
      });
    });

    it('should disable button when input is empty', async () => {
      renderComponent();

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Link Questions/i });
        expect(button).toBeDisabled();
      });
    });

    it('should enable button when input has content', async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('T1A01, T1A02, T1A03...')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('T1A01, T1A02, T1A03...');
      await user.type(textarea, 'T1B01, T1B02');

      const button = screen.getByRole('button', { name: /Link Questions/i });
      expect(button).not.toBeDisabled();
    });

    it('should call bulk update when submitting valid IDs', async () => {
      const user = userEvent.setup();
      const mockUpdateIn = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ in: mockUpdateIn });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent('chapter-1');

      await waitFor(() => {
        expect(screen.getByPlaceholderText('T1A01, T1A02, T1A03...')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('T1A01, T1A02, T1A03...');
      await user.type(textarea, 'T1B01');

      const button = screen.getByRole('button', { name: /Link Questions/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockUpdateFn).toHaveBeenCalledWith({ arrl_chapter_id: 'chapter-1' });
        expect(mockUpdateIn).toHaveBeenCalledWith('id', ['uuid-3']);
      });
    });

    it('should clear input after successful bulk link', async () => {
      const user = userEvent.setup();
      const mockUpdateIn = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ in: mockUpdateIn });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent('chapter-1');

      await waitFor(() => {
        expect(screen.getByPlaceholderText('T1A01, T1A02, T1A03...')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('T1A01, T1A02, T1A03...') as HTMLTextAreaElement;
      await user.type(textarea, 'T1B01');

      const button = screen.getByRole('button', { name: /Link Questions/i });
      await user.click(button);

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('should show success toast with count', async () => {
      const user = userEvent.setup();
      const mockUpdateIn = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ in: mockUpdateIn });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent('chapter-1');

      await waitFor(() => {
        expect(screen.getByPlaceholderText('T1A01, T1A02, T1A03...')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('T1A01, T1A02, T1A03...');
      await user.type(textarea, 'T1B01');

      const button = screen.getByRole('button', { name: /Link Questions/i });
      await user.click(button);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Linked 1 question'));
      });
    });

    it('should show warning toast for not found IDs', async () => {
      const user = userEvent.setup();
      const mockUpdateIn = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ in: mockUpdateIn });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent('chapter-1');

      await waitFor(() => {
        expect(screen.getByPlaceholderText('T1A01, T1A02, T1A03...')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('T1A01, T1A02, T1A03...');
      // X1Z99 doesn't exist in mockQuestions
      await user.type(textarea, 'X1Z99');

      const button = screen.getByRole('button', { name: /Link Questions/i });
      await user.click(button);

      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('Not found: X1Z99'));
      });
    });

    it('should skip already linked questions and report count', async () => {
      const user = userEvent.setup();
      const mockUpdateIn = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ in: mockUpdateIn });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent('chapter-1');

      await waitFor(() => {
        expect(screen.getByPlaceholderText('T1A01, T1A02, T1A03...')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('T1A01, T1A02, T1A03...');
      // T1A01 is already linked to chapter-1
      await user.type(textarea, 'T1A01');

      const button = screen.getByRole('button', { name: /Link Questions/i });
      await user.click(button);

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('All questions were already linked to this chapter');
      });
    });

    it('should handle case insensitive input', async () => {
      const user = userEvent.setup();
      const mockUpdateIn = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ in: mockUpdateIn });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent('chapter-1');

      await waitFor(() => {
        expect(screen.getByPlaceholderText('T1A01, T1A02, T1A03...')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('T1A01, T1A02, T1A03...');
      // Use lowercase - should still match T1B01
      await user.type(textarea, 't1b01');

      const button = screen.getByRole('button', { name: /Link Questions/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockUpdateFn).toHaveBeenCalledWith({ arrl_chapter_id: 'chapter-1' });
        expect(mockUpdateIn).toHaveBeenCalledWith('id', ['uuid-3']);
      });
    });

    it('should handle multiple IDs with spaces and extra commas', async () => {
      const user = userEvent.setup();
      const mockUpdateIn = vi.fn().mockResolvedValue({ error: null });
      const mockUpdateFn = vi.fn().mockReturnValue({ in: mockUpdateIn });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              like: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockQuestions,
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateFn,
          };
        }
        return { select: vi.fn() };
      });

      renderComponent('chapter-1');

      await waitFor(() => {
        expect(screen.getByPlaceholderText('T1A01, T1A02, T1A03...')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('T1A01, T1A02, T1A03...');
      // Input with extra spaces and commas
      await user.type(textarea, ' T1B01 ,  T1B02, , ');

      const button = screen.getByRole('button', { name: /Link Questions/i });
      await user.click(button);

      await waitFor(() => {
        // Should link both T1B01 (uuid-3) and T1B02 (uuid-4, currently in chapter-2)
        expect(mockUpdateIn).toHaveBeenCalledWith('id', expect.arrayContaining(['uuid-3', 'uuid-4']));
      });
    });
  });
});
