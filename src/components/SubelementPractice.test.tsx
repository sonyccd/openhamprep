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

vi.mock('@/hooks/useAppNavigation', () => ({
  useAppNavigation: () => ({
    navigateToQuestion: vi.fn(),
    selectedLicense: 'technician',
  }),
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
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) => <p {...props}>{children}</p>,
    button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/TopicLanding', () => ({
  TopicLanding: ({ onStartPractice }: { onStartPractice: () => void }) => (
    <div data-testid="topic-landing">
      <button onClick={onStartPractice}>Start Practice</button>
    </div>
  ),
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
        <SubelementPractice onBack={onBack} testType="technician" {...props} />
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

      // T1 is "Commission's Rules" in the SUBELEMENT_NAMES for technician
      expect(screen.getByText("Commission's Rules")).toBeInTheDocument();
      // T2 is "Operating Procedures"
      expect(screen.getByText('Operating Procedures')).toBeInTheDocument();
    });
  });

  describe('Topic Selection', () => {
    it('navigates to topic landing when clicking a subelement', async () => {
      renderSubelementPractice();

      // Click on T1 topic (Commission's Rules)
      const t1Button = screen.getByText("Commission's Rules").closest('button');
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
    it('shows loading state when questions are loading', () => {
      // Override the mock to return loading state (use mockReturnValue to persist across re-renders)
      mockQuestionsHook.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderSubelementPractice();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Reset to default mock
      mockQuestionsHook.mockReturnValue({
        data: mockQuestions,
        isLoading: false,
        error: null,
      });
    });
  });

  describe('Error State', () => {
    it('shows error state when questions fail to load', () => {
      // Override the mock to return error state (use mockReturnValue to persist across re-renders)
      mockQuestionsHook.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
      });

      renderSubelementPractice();

      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();

      // Reset to default mock
      mockQuestionsHook.mockReturnValue({
        data: mockQuestions,
        isLoading: false,
        error: null,
      });
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
          <SubelementPractice onBack={vi.fn()} testType="technician" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    // Select a topic (T1 = Commission's Rules)
    const t1Button = screen.getByText("Commission's Rules").closest('button');
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

describe('SubelementPractice Question Wraparound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resets progress when all questions have been seen and user continues', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SubelementPractice onBack={vi.fn()} testType="technician" />
        </TooltipProvider>
      </QueryClientProvider>
    );

    // Select T1 topic which has 2 questions
    const t1Button = screen.getByText("Commission's Rules").closest('button');
    if (t1Button) fireEvent.click(t1Button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start practice/i })).toBeInTheDocument();
    });

    // Start practice
    fireEvent.click(screen.getByRole('button', { name: /start practice/i }));

    // Wait for first question
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
    });

    // Skip through all questions (T1 has 2 questions)
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));

    await waitFor(() => {
      // After skipping first, we should be on question 2
      expect(screen.getByText(/Question 2 of 2/)).toBeInTheDocument();
    });

    // Skip again - this should wrap around
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));

    await waitFor(() => {
      // After wraparound, history resets so "Question X of Y" indicator disappears
      // (only shows when questionHistory.length > 1)
      expect(screen.queryByText(/Question 2 of/)).not.toBeInTheDocument();
      // Previous button should also be gone since we're at the start of fresh history
      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
    });
  });
});
