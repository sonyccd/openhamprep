import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { WeakQuestionsReview } from './WeakQuestionsReview';

// Mock useQuestions
const mockQuestions = [
  { id: 'T1A01', question: 'What is amateur radio?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'A' },
  { id: 'T1A02', question: 'What band is best for beginners?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'B' },
  { id: 'T1A03', question: 'What is CW?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'C' },
];

vi.mock('@/hooks/useQuestions', () => ({
  useQuestions: vi.fn(() => ({ data: mockQuestions, isLoading: false, error: null })),
}));

// Mock useProgress
const mockSaveRandomAttempt = vi.fn().mockResolvedValue(undefined);
vi.mock('@/hooks/useProgress', () => ({
  useProgress: vi.fn(() => ({ saveRandomAttempt: mockSaveRandomAttempt })),
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'user-123' } })),
}));

// Mock useKeyboardShortcuts
vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
  KeyboardShortcut: {},
}));

// Mock KeyboardShortcutsHelp
vi.mock('@/components/KeyboardShortcutsHelp', () => ({
  KeyboardShortcutsHelp: () => <div data-testid="keyboard-shortcuts-help">Keyboard Help</div>,
}));

// Mock QuestionCard
vi.mock('@/components/QuestionCard', () => ({
  QuestionCard: ({ question, selectedAnswer, onSelectAnswer, showResult, questionNumber, totalQuestions }: {
    question: { id: string; question: string };
    selectedAnswer: string | null;
    onSelectAnswer: (answer: string) => void;
    showResult: boolean;
    questionNumber: number;
    totalQuestions: number;
  }) => (
    <div data-testid="question-card">
      <div data-testid="question-id">{question?.id}</div>
      <div data-testid="question-text">{question?.question}</div>
      <div data-testid="question-number">{questionNumber} of {totalQuestions}</div>
      <div data-testid="selected-answer">{selectedAnswer || 'none'}</div>
      <div data-testid="show-result">{showResult ? 'true' : 'false'}</div>
      <button onClick={() => onSelectAnswer('A')} data-testid="select-a">Select A</button>
      <button onClick={() => onSelectAnswer('B')} data-testid="select-b">Select B</button>
      <button onClick={() => onSelectAnswer('C')} data-testid="select-c">Select C</button>
      <button onClick={() => onSelectAnswer('D')} data-testid="select-d">Select D</button>
    </div>
  ),
}));

import { useQuestions } from '@/hooks/useQuestions';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('WeakQuestionsReview', () => {
  const defaultProps = {
    weakQuestionIds: ['T1A01', 'T1A02'],
    onBack: vi.fn(),
    testType: 'technician' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuestions).mockReturnValue({ data: mockQuestions, isLoading: false, error: null } as ReturnType<typeof useQuestions>);
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching questions', () => {
      vi.mocked(useQuestions).mockReturnValue({ data: undefined, isLoading: true, error: null } as ReturnType<typeof useQuestions>);

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Loading questions...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows no weak questions message when list is empty', () => {
      render(
        <WeakQuestionsReview {...defaultProps} weakQuestionIds={[]} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('No weak questions!')).toBeInTheDocument();
      expect(screen.getByText("You're doing great. Keep practicing!")).toBeInTheDocument();
    });

    it('shows Go Back button when no weak questions', () => {
      render(
        <WeakQuestionsReview {...defaultProps} weakQuestionIds={[]} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    it('calls onBack when Go Back is clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();

      render(
        <WeakQuestionsReview {...defaultProps} weakQuestionIds={[]} onBack={onBack} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByRole('button', { name: /go back/i }));

      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('Question Display', () => {
    it('displays current question', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('question-card')).toBeInTheDocument();
      expect(screen.getByTestId('question-id')).toHaveTextContent('T1A01');
    });

    it('displays progress info', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    });

    it('displays stats', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText(/0\/0 correct/)).toBeInTheDocument();
    });

    it('displays keyboard shortcuts help', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('keyboard-shortcuts-help')).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('shows Skip button before answer is selected', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
    });

    it('saves attempt when answer is selected', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('select-a'));

      await waitFor(() => {
        expect(mockSaveRandomAttempt).toHaveBeenCalledWith(
          mockQuestions[0],
          'A',
          'weak_questions'
        );
      });
    });

    it('shows Next Question button after answer is selected', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('select-a'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next question/i })).toBeInTheDocument();
      });
    });

    it('updates stats when correct answer is selected', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // T1A01 correct answer is A
      await user.click(screen.getByTestId('select-a'));

      await waitFor(() => {
        expect(screen.getByText(/1\/1 correct/)).toBeInTheDocument();
      });
    });

    it('updates stats when incorrect answer is selected', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // T1A01 correct answer is A, selecting B is wrong
      await user.click(screen.getByTestId('select-b'));

      await waitFor(() => {
        expect(screen.getByText(/0\/1 correct/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('advances to next question when Next is clicked', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Answer first question
      await user.click(screen.getByTestId('select-a'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next question/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /next question/i }));

      // Should now show second question
      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A02');
      });
    });

    it('skips to next question when Skip is clicked', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /skip/i }));

      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A02');
      });
    });

    it('shows Finish Review on last question', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Skip to last question
      await user.click(screen.getByRole('button', { name: /skip/i }));

      // Answer last question
      await user.click(screen.getByTestId('select-b'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /finish review/i })).toBeInTheDocument();
      });
    });
  });

  describe('Completion', () => {
    it('shows completion screen after finishing all questions', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Answer first question
      await user.click(screen.getByTestId('select-a'));
      await user.click(screen.getByRole('button', { name: /next question/i }));

      // Answer second question and finish
      await user.click(screen.getByTestId('select-b'));
      await user.click(screen.getByRole('button', { name: /finish review/i }));

      await waitFor(() => {
        expect(screen.getByText('Review Complete!')).toBeInTheDocument();
      });
    });

    it('shows final stats on completion', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Answer both correctly
      await user.click(screen.getByTestId('select-a'));
      await user.click(screen.getByRole('button', { name: /next question/i }));
      await user.click(screen.getByTestId('select-b'));
      await user.click(screen.getByRole('button', { name: /finish review/i }));

      await waitFor(() => {
        expect(screen.getByText(/You got 2 out of 2 correct/)).toBeInTheDocument();
      });
    });

    it('shows Review Again button on completion', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Skip all questions
      await user.click(screen.getByRole('button', { name: /skip/i }));
      await user.click(screen.getByRole('button', { name: /skip/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /review again/i })).toBeInTheDocument();
      });
    });

    it('shows Back to Dashboard button on completion', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /skip/i }));
      await user.click(screen.getByRole('button', { name: /skip/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
      });
    });

    it('resets state when Review Again is clicked', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Complete first round
      await user.click(screen.getByRole('button', { name: /skip/i }));
      await user.click(screen.getByRole('button', { name: /skip/i }));

      await waitFor(() => {
        expect(screen.getByText('Review Complete!')).toBeInTheDocument();
      });

      // Start again
      await user.click(screen.getByRole('button', { name: /review again/i }));

      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A01');
        expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
      });
    });

    it('calls onBack when Back to Dashboard is clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();

      render(<WeakQuestionsReview {...defaultProps} onBack={onBack} />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /skip/i }));
      await user.click(screen.getByRole('button', { name: /skip/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /back to dashboard/i }));

      expect(onBack).toHaveBeenCalled();
    });
  });
});
