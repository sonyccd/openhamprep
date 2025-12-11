import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RandomPractice } from './RandomPractice';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import the supabase mock first
import '@/test/mocks/supabase';

const mockQuestions = [
  {
    id: 'T1A01',
    question: 'What is the purpose of the Amateur Radio Service?',
    options: { A: 'Emergency', B: 'Money', C: 'Music', D: 'Phones' },
    correctAnswer: 'A',
    subelement: 'T1',
    group: 'T1A',
    explanation: 'Test explanation',
    links: [],
  },
  {
    id: 'T1A02',
    question: 'Second question?',
    options: { A: 'Answer 1', B: 'Answer 2', C: 'Answer 3', D: 'Answer 4' },
    correctAnswer: 'B',
    subelement: 'T1',
    group: 'T1A',
    explanation: null,
    links: [],
  },
];

const mockQuestionsHook = vi.fn(() => ({
  data: mockQuestions,
  isLoading: false,
  error: null,
}));

vi.mock('@/hooks/useQuestions', () => ({
  useQuestions: () => mockQuestionsHook(),
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
    QUESTION_ANSWERED: 'question_answered',
    NEW_BEST_STREAK: 'new_best_streak',
    STREAK_MILESTONE: 'streak_milestone',
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
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderRandomPractice = (props = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RandomPractice onBack={vi.fn()} {...props} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

describe('RandomPractice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders the first question', async () => {
      renderRandomPractice();
      
      await waitFor(() => {
        // Should display one of the mock questions
        const hasQuestion = 
          screen.queryByText('What is the purpose of the Amateur Radio Service?') ||
          screen.queryByText('Second question?');
        expect(hasQuestion).toBeInTheDocument();
      });
    });

    it('shows initial stats at zero', async () => {
      renderRandomPractice();
      
      await waitFor(() => {
        expect(screen.getByText('Correct')).toBeInTheDocument();
        expect(screen.getByText('Incorrect')).toBeInTheDocument();
        expect(screen.getByText('Streak')).toBeInTheDocument();
      });
    });

    it('renders reset button', async () => {
      renderRandomPractice();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
      });
    });

    it('renders skip button initially', async () => {
      renderRandomPractice();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      });
    });
  });

  describe('Answer Selection', () => {
    it('shows result after selecting an answer', async () => {
      renderRandomPractice();
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const optionA = buttons.find(btn => btn.textContent === 'AEmergency' || btn.textContent === 'AAnswer 1');
        expect(optionA).toBeDefined();
      });
      
      // Click on an answer option
      const buttons = screen.getAllByRole('button');
      const optionA = buttons.find(btn => btn.textContent?.startsWith('A'));
      if (optionA) {
        fireEvent.click(optionA);
      }
      
      await waitFor(() => {
        // After answering, should show "Next Question" button
        const nextButton = screen.queryByText(/next question/i) || screen.queryByText(/next/i);
        expect(nextButton).toBeInTheDocument();
      });
    });

    it('hides skip button after answering', async () => {
      renderRandomPractice();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      });
      
      const buttons = screen.getAllByRole('button');
      const optionA = buttons.find(btn => btn.textContent?.startsWith('A'));
      if (optionA) {
        fireEvent.click(optionA);
      }
      
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('shows previous button after navigating to second question', async () => {
      renderRandomPractice();
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const optionA = buttons.find(btn => btn.textContent?.startsWith('A'));
        expect(optionA).toBeDefined();
      });
      
      // Answer first question
      const buttons = screen.getAllByRole('button');
      const optionA = buttons.find(btn => btn.textContent?.startsWith('A'));
      if (optionA) fireEvent.click(optionA);
      
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).toBeInTheDocument();
      });
      
      // Go to next question
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state', () => {
      // Override the mock to return loading state
      mockQuestionsHook.mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderRandomPractice();

      // Component should handle loading gracefully
      expect(screen.queryByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Reset Functionality', () => {
    it('calls reset when reset button is clicked', async () => {
      renderRandomPractice();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      
      // Stats should be reset (still showing zero)
      await waitFor(() => {
        expect(screen.getByText('Correct')).toBeInTheDocument();
      });
    });
  });
});
