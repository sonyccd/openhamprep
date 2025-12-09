import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubelementPractice } from './SubelementPractice';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import the supabase mock
import '@/test/mocks/supabase';

const mockQuestions = [
  {
    id: 'T1A01',
    question: 'Question about T1?',
    options: { A: 'A1', B: 'B1', C: 'C1', D: 'D1' },
    correctAnswer: 'A',
    subelement: 'T1',
    group: 'T1A',
    explanation: 'Explanation 1',
    links: [],
  },
  {
    id: 'T1A02',
    question: 'Another T1 question?',
    options: { A: 'A2', B: 'B2', C: 'C2', D: 'D2' },
    correctAnswer: 'B',
    subelement: 'T1',
    group: 'T1A',
    explanation: 'Explanation 2',
    links: [],
  },
  {
    id: 'T2A01',
    question: 'Question about T2?',
    options: { A: 'A3', B: 'B3', C: 'C3', D: 'D3' },
    correctAnswer: 'C',
    subelement: 'T2',
    group: 'T2A',
    explanation: 'Explanation 3',
    links: [],
  },
];

vi.mock('@/hooks/useQuestions', () => ({
  useQuestions: () => ({
    data: mockQuestions,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/hooks/useProgress', () => ({
  useProgress: () => ({
    saveRandomAttempt: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/hooks/usePostHog', () => ({
  usePostHog: () => ({ capture: vi.fn() }),
  ANALYTICS_EVENTS: {
    TOPIC_SELECTED: 'topic_selected',
    SUBELEMENT_PRACTICE_STARTED: 'subelement_practice_started',
  },
}));

vi.mock('@/hooks/useBookmarks', () => ({
  useBookmarks: () => ({
    isBookmarked: vi.fn(() => false),
    addBookmark: { mutate: vi.fn() },
    removeBookmark: { mutate: vi.fn() },
    getBookmarkNote: vi.fn(() => null),
    updateNote: { mutate: vi.fn() },
  }),
}));

vi.mock('@/hooks/useExplanationFeedback', () => ({
  useExplanationFeedback: () => ({
    userFeedback: null,
    submitFeedback: { mutate: vi.fn() },
    removeFeedback: { mutate: vi.fn() },
  }),
}));

vi.mock('@/hooks/useGlossaryTerms', () => ({
  useGlossaryTerms: () => ({ data: [] }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderSubelementPractice = (props = {}) => {
  const queryClient = createTestQueryClient();
  const onBack = vi.fn();
  
  const result = render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SubelementPractice onBack={onBack} {...props} />
      </TooltipProvider>
    </QueryClientProvider>
  );
  
  return { ...result, onBack };
};

describe('SubelementPractice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Topic List View', () => {
    it('renders the topic selection screen', () => {
      renderSubelementPractice();
      
      expect(screen.getByText('Choose a Topic')).toBeInTheDocument();
      expect(screen.getByText('Focus on specific areas to strengthen your knowledge')).toBeInTheDocument();
    });

    it('displays available subelements with question counts', () => {
      renderSubelementPractice();
      
      // Should show T1 with 2 questions
      expect(screen.getByText('T1')).toBeInTheDocument();
      expect(screen.getByText('2 questions')).toBeInTheDocument();
      
      // Should show T2 with 1 question
      expect(screen.getByText('T2')).toBeInTheDocument();
      expect(screen.getByText('1 questions')).toBeInTheDocument();
    });

    it('shows subelement names', () => {
      renderSubelementPractice();
      
      // T1 is "Operating Procedures" in the SUBELEMENT_NAMES
      expect(screen.getByText('Operating Procedures')).toBeInTheDocument();
      // T2 is "Radio Wave Characteristics"
      expect(screen.getByText('Radio Wave Characteristics')).toBeInTheDocument();
    });
  });

  describe('Topic Selection', () => {
    it('navigates to topic landing when clicking a subelement', async () => {
      renderSubelementPractice();
      
      // Click on T1 topic
      const t1Button = screen.getByText('Operating Procedures').closest('button');
      if (t1Button) {
        fireEvent.click(t1Button);
      }
      
      await waitFor(() => {
        // Should show the topic landing page with start practice button
        expect(screen.getByRole('button', { name: /start practice/i })).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state when questions are loading', async () => {
      vi.doMock('@/hooks/useQuestions', () => ({
        useQuestions: () => ({
          data: null,
          isLoading: true,
          error: null,
        }),
      }));
      
      const { SubelementPractice: LoadingSubelementPractice } = await import('./SubelementPractice');
      
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <LoadingSubelementPractice onBack={vi.fn()} />
          </TooltipProvider>
        </QueryClientProvider>
      );
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error state when questions fail to load', async () => {
      vi.doMock('@/hooks/useQuestions', () => ({
        useQuestions: () => ({
          data: null,
          isLoading: false,
          error: new Error('Failed to load'),
        }),
      }));
      
      const { SubelementPractice: ErrorSubelementPractice } = await import('./SubelementPractice');
      
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ErrorSubelementPractice onBack={vi.fn()} />
          </TooltipProvider>
        </QueryClientProvider>
      );
      
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });
  });
});

describe('SubelementPractice Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays initial stats at zero in practice view', async () => {
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SubelementPractice onBack={vi.fn()} />
        </TooltipProvider>
      </QueryClientProvider>
    );
    
    // Select a topic
    const t1Button = screen.getByText('Operating Procedures').closest('button');
    if (t1Button) fireEvent.click(t1Button);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start practice/i })).toBeInTheDocument();
    });
    
    // Start practice
    fireEvent.click(screen.getByRole('button', { name: /start practice/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Correct')).toBeInTheDocument();
      expect(screen.getByText('Incorrect')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
    });
  });
});
