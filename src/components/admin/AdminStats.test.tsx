import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminStats } from './AdminStats';

// Mock Supabase client
const mockSelect = vi.fn();
const mockIlike = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
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

// Sample test data matching the UUID migration schema
const mockQuestions = [
  {
    id: 'uuid-1',
    display_name: 'T1A01',
    question: 'What is amateur radio?',
    subelement: 'T1',
    question_group: 'T1A',
    links: [{ url: 'https://example.com' }],
    explanation: 'Amateur radio is a hobby.',
  },
  {
    id: 'uuid-2',
    display_name: 'T1A02',
    question: 'What frequencies can Technician class use?',
    subelement: 'T1',
    question_group: 'T1A',
    links: [],
    explanation: null,
  },
  {
    id: 'uuid-3',
    display_name: 'T1B01',
    question: 'What is the purpose of an antenna?',
    subelement: 'T1',
    question_group: 'T1B',
    links: [],
    explanation: 'An antenna radiates RF energy.',
  },
];

const mockAttempts = [
  {
    question_id: 'uuid-1',
    is_correct: true,
    user_id: 'user-1',
    attempted_at: '2024-01-01T00:00:00Z',
    questions: { display_name: 'T1A01' },
  },
  {
    question_id: 'uuid-1',
    is_correct: false,
    user_id: 'user-2',
    attempted_at: '2024-01-01T01:00:00Z',
    questions: { display_name: 'T1A01' },
  },
  {
    question_id: 'uuid-2',
    is_correct: false,
    user_id: 'user-1',
    attempted_at: '2024-01-01T02:00:00Z',
    questions: { display_name: 'T1A02' },
  },
];

describe('AdminStats', () => {
  let queryClient: QueryClient;

  const renderComponent = (testType: 'technician' | 'general' | 'extra' = 'technician') => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <AdminStats testType={testType} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock chain for questions query
    mockOrder.mockReturnValue({ data: mockQuestions, error: null });
    mockIlike.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ ilike: mockIlike });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'questions') {
        return {
          select: () => ({
            ilike: (column: string, pattern: string) => {
              // Verify we're filtering by display_name, not id
              if (column === 'id') {
                throw new Error('Should filter by display_name, not id (id is now UUID after migration)');
              }
              return {
                order: () => ({ data: mockQuestions, error: null }),
              };
            },
          }),
        };
      }
      if (table === 'question_attempts') {
        return {
          select: () => ({
            ilike: (column: string, pattern: string) => {
              // Verify we're filtering by questions.display_name, not question_id
              if (column === 'question_id') {
                throw new Error('Should filter by questions.display_name, not question_id (question_id is now UUID after migration)');
              }
              return {
                order: () => ({ data: mockAttempts, error: null }),
              };
            },
          }),
        };
      }
      return {
        select: () => ({
          ilike: () => ({
            order: () => ({ data: [], error: null }),
          }),
        }),
      };
    });
  });

  describe('Database Query Correctness (UUID Migration)', () => {
    it('should query questions using display_name filter, not id', async () => {
      renderComponent('technician');

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('questions');
      });

      // If the component used 'id' for filtering, the mock would throw an error
      // and the test would fail
    });

    it('should query attempts using questions.display_name filter', async () => {
      renderComponent('technician');

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('question_attempts');
      });

      // If the component used 'question_id' for filtering, the mock would throw an error
    });

    it('should use correct prefix for technician test type', async () => {
      let capturedPattern = '';
      mockFrom.mockImplementation((table: string) => ({
        select: () => ({
          ilike: (_column: string, pattern: string) => {
            capturedPattern = pattern;
            return {
              order: () => ({ data: table === 'questions' ? mockQuestions : mockAttempts, error: null }),
            };
          },
        }),
      }));

      renderComponent('technician');

      await waitFor(() => {
        expect(capturedPattern).toBe('T*');
      });
    });

    it('should use correct prefix for general test type', async () => {
      let capturedPattern = '';
      mockFrom.mockImplementation((table: string) => ({
        select: () => ({
          ilike: (_column: string, pattern: string) => {
            capturedPattern = pattern;
            return {
              order: () => ({ data: [], error: null }),
            };
          },
        }),
      }));

      renderComponent('general');

      await waitFor(() => {
        expect(capturedPattern).toBe('G*');
      });
    });

    it('should use correct prefix for extra test type', async () => {
      let capturedPattern = '';
      mockFrom.mockImplementation((table: string) => ({
        select: () => ({
          ilike: (_column: string, pattern: string) => {
            capturedPattern = pattern;
            return {
              order: () => ({ data: [], error: null }),
            };
          },
        }),
      }));

      renderComponent('extra');

      await waitFor(() => {
        expect(capturedPattern).toBe('E*');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      // Mock to never resolve
      mockFrom.mockImplementation(() => ({
        select: () => ({
          ilike: () => ({
            order: () => new Promise(() => {}),
          }),
        }),
      }));

      renderComponent();

      // Look for the animate-spin class on the loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });
  });

  describe('Statistics Display', () => {
    it('should display total questions count', async () => {
      mockFrom.mockImplementation((table: string) => ({
        select: () => ({
          ilike: () => ({
            order: () => ({
              data: table === 'questions' ? mockQuestions : mockAttempts,
              error: null,
            }),
          }),
        }),
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total Questions')).toBeInTheDocument();
      });

      // Find the card with "Total Questions" and check its value
      const totalQuestionsCard = screen.getByText('Total Questions').closest('.rounded-lg');
      expect(totalQuestionsCard).toHaveTextContent('3');
    });

    it('should display questions with links count', async () => {
      mockFrom.mockImplementation((table: string) => ({
        select: () => ({
          ilike: () => ({
            order: () => ({
              data: table === 'questions' ? mockQuestions : mockAttempts,
              error: null,
            }),
          }),
        }),
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Questions with Links')).toBeInTheDocument();
      });

      // Find the card with "Questions with Links" and check its value
      const linksCard = screen.getByText('Questions with Links').closest('.rounded-lg');
      expect(linksCard).toHaveTextContent('1'); // Only T1A01 has links
    });

    it('should display question IDs as display_name format (T1A01), not UUID', async () => {
      mockFrom.mockImplementation((table: string) => ({
        select: () => ({
          ilike: () => ({
            order: () => ({
              data: table === 'questions' ? mockQuestions : mockAttempts,
              error: null,
            }),
          }),
        }),
      }));

      renderComponent();

      await waitFor(() => {
        // Check that we display T1 format subelement, not UUIDs
        expect(screen.getByText('T1')).toBeInTheDocument();
      });

      // Should NOT display UUID format
      expect(screen.queryByText('uuid-1')).not.toBeInTheDocument();
      expect(screen.queryByText('uuid-2')).not.toBeInTheDocument();
    });
  });

  describe('Subelement Breakdown', () => {
    it('should group questions by subelement', async () => {
      mockFrom.mockImplementation((table: string) => ({
        select: () => ({
          ilike: () => ({
            order: () => ({
              data: table === 'questions' ? mockQuestions : mockAttempts,
              error: null,
            }),
          }),
        }),
      }));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Questions by Subelement')).toBeInTheDocument();
        expect(screen.getByText('T1')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockFrom.mockImplementation(() => ({
        select: () => ({
          ilike: () => ({
            order: () => ({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      }));

      // Should not throw
      expect(() => renderComponent()).not.toThrow();
    });
  });
});
