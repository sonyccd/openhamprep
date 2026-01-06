import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { WeakQuestionsReview } from './WeakQuestionsReview';

// Mock useQuestions
const mockQuestions = [
  { id: 'uuid-t1a01', displayName: 'T1A01', question: 'What is amateur radio?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'A' },
  { id: 'uuid-t1a02', displayName: 'T1A02', question: 'What band is best for beginners?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'B' },
  { id: 'uuid-t1a03', displayName: 'T1A03', question: 'What is CW?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'C' },
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

// Mock useAppNavigation
vi.mock('@/hooks/useAppNavigation', () => ({
  useAppNavigation: vi.fn(() => ({
    navigateToQuestion: vi.fn(),
    selectedLicense: 'technician',
  })),
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
  QuestionCard: ({ question, selectedAnswer, onSelectAnswer, showResult }: {
    question: { id: string; displayName: string; question: string };
    selectedAnswer: string | null;
    onSelectAnswer: (answer: string) => void;
    showResult: boolean;
  }) => (
    <div data-testid="question-card">
      <div data-testid="question-id">{question?.displayName}</div>
      <div data-testid="question-text">{question?.question}</div>
      <div data-testid="selected-answer">{selectedAnswer || 'none'}</div>
      <div data-testid="show-result">{showResult ? 'true' : 'false'}</div>
      <button onClick={() => onSelectAnswer('A')} data-testid="select-a">Select A</button>
      <button onClick={() => onSelectAnswer('B')} data-testid="select-b">Select B</button>
      <button onClick={() => onSelectAnswer('C')} data-testid="select-c">Select C</button>
      <button onClick={() => onSelectAnswer('D')} data-testid="select-d">Select D</button>
    </div>
  ),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
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
    weakQuestionIds: ['uuid-t1a01', 'uuid-t1a02', 'uuid-t1a03'],
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

  describe('List View', () => {
    it('displays list of weak questions', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('What is amateur radio?')).toBeInTheDocument();
      expect(screen.getByText('What band is best for beginners?')).toBeInTheDocument();
      expect(screen.getByText('What is CW?')).toBeInTheDocument();
    });

    it('displays question count', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('3 questions to review')).toBeInTheDocument();
    });

    it('displays question display names', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Component displays displayName, not id
      expect(screen.getByText('T1A01')).toBeInTheDocument();
      expect(screen.getByText('T1A02')).toBeInTheDocument();
      expect(screen.getByText('T1A03')).toBeInTheDocument();
    });

    it('displays Weak Questions header with icon', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Weak Questions')).toBeInTheDocument();
    });

    it('displays "Needs practice" indicator for each question', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      const indicators = screen.getAllByText('Needs practice');
      expect(indicators.length).toBe(3);
    });
  });

  describe('Question View', () => {
    it('navigates to question detail when clicking a question', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('question-card')).toBeInTheDocument();
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A01');
      });
    });

    it('shows back button in question view', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to weak questions/i })).toBeInTheDocument();
      });
    });

    it('shows Weak Area indicator in question view', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByText('Weak Area')).toBeInTheDocument();
      });
    });

    it('shows keyboard shortcuts help in question view', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('keyboard-shortcuts-help')).toBeInTheDocument();
      });
    });

    it('returns to list when back button is clicked', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to weak questions/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /back to weak questions/i }));

      await waitFor(() => {
        expect(screen.getByText('3 questions to review')).toBeInTheDocument();
      });
    });
  });

  describe('Answer Selection', () => {
    it('saves attempt when answer is selected', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Navigate to question
      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('select-a'));

      await waitFor(() => {
        expect(mockSaveRandomAttempt).toHaveBeenCalledWith(
          mockQuestions[0],
          'A',
          'weak_questions'
        );
      });
    });

  });

  describe('Navigation Buttons', () => {
    it('shows Previous and Next buttons in question view', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('disables Previous button on first question', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it('enables Next button when there are more questions', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('navigates to next question when Next is clicked', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A01');
      });

      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A02');
      });
    });

    it('navigates to previous question when Previous is clicked', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Click on second question
      fireEvent.click(screen.getByText('What band is best for beginners?'));

      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A02');
      });

      fireEvent.click(screen.getByRole('button', { name: /previous/i }));

      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A01');
      });
    });

    it('disables Next button on last question when not cleared', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Click on last question
      fireEvent.click(screen.getByText('What is CW?'));

      await waitFor(() => {
        // Answer incorrectly to not trigger clearing
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      // Answer wrong (D is wrong for the last question which has correct answer C)
      await user.click(screen.getByTestId('select-d'));

      await waitFor(() => {
        // Next button should be disabled since we're on the last question and didn't clear it
        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).toBeDisabled();
      });
    });

    it('enables Previous button when not on first question', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Click on second question
      fireEvent.click(screen.getByText('What band is best for beginners?'));

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous/i });
        expect(prevButton).not.toBeDisabled();
      });
    });
  });

  describe('Question Counter', () => {
    it('shows question counter with multiple questions', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      });
    });

    it('updates question counter when navigating', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
      });
    });

    it('does not show question counter with single question after answering wrong', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} weakQuestionIds={['uuid-t1a01']} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('question-card')).toBeInTheDocument();
      });

      // Answer incorrectly to stay on the question without clearing
      await user.click(screen.getByTestId('select-b'));

      await waitFor(() => {
        expect(screen.getByTestId('show-result')).toHaveTextContent('true');
      });

      // With only 1 question, counter should not show
      expect(screen.queryByText(/Question \d+ of \d+/)).not.toBeInTheDocument();
    });
  });

  describe('Answer State Reset', () => {
    it('resets answer state when navigating to next question', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      // Answer the question incorrectly (B is wrong for first question)
      // We use incorrect answer to prevent clearing in simple mode
      await user.click(screen.getByTestId('select-b'));

      await waitFor(() => {
        expect(screen.getByTestId('show-result')).toHaveTextContent('true');
      });

      // Navigate to next question
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A02');
        // Answer state should be reset (show-result should be false)
        expect(screen.getByTestId('show-result')).toHaveTextContent('false');
      });
    });

    it('resets answer state when returning to list', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      // Answer the question incorrectly (B is wrong for first question)
      // We use incorrect answer to prevent clearing in simple mode
      await user.click(screen.getByTestId('select-b'));

      await waitFor(() => {
        expect(screen.getByTestId('show-result')).toHaveTextContent('true');
      });

      // Go back to list
      fireEvent.click(screen.getByRole('button', { name: /back to weak questions/i }));

      await waitFor(() => {
        expect(screen.getByText('3 questions to review')).toBeInTheDocument();
      });

      // Click on the same question again
      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        // Answer state should be reset (show-result should be false)
        expect(screen.getByTestId('show-result')).toHaveTextContent('false');
      });
    });
  });

  describe('Simple Mode (Default)', () => {
    it('clears question after 1 correct answer by default', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      // Answer correctly once (A is the correct answer for first question)
      await user.click(screen.getByTestId('select-a'));

      // Go back and check count - should be cleared
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /back to weak questions/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('2 questions to review')).toBeInTheDocument();
        expect(screen.getByText(/\(1 cleared\)/)).toBeInTheDocument();
      });
    });

    it('does not show streak progress indicator in simple mode', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('question-card')).toBeInTheDocument();
      });

      // Streak progress should not be visible in simple mode
      expect(screen.queryByText('Streak to clear (3 correct in a row)')).not.toBeInTheDocument();
      expect(screen.queryByText('0/3')).not.toBeInTheDocument();
    });

    it('does not show streak indicators in list view in simple mode', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Get the question list items (not the toggle card)
      const questionButtons = screen.getAllByRole('button', { name: /What is|What band/i });
      expect(questionButtons.length).toBe(3);

      // In simple mode, streak dots should not be present in question items
      questionButtons.forEach(button => {
        const streakDots = button.querySelectorAll('.rounded-full');
        expect(streakDots.length).toBe(0);
      });
    });

    it('shows all cleared message when all questions are cleared in simple mode', async () => {
      const user = userEvent.setup();

      // Use only one question for simplicity
      render(<WeakQuestionsReview {...defaultProps} weakQuestionIds={['uuid-t1a01']} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      // Answer correctly once - should clear immediately
      await user.click(screen.getByTestId('select-a'));

      // Should show all cleared message
      await waitFor(() => {
        expect(screen.getByText('All weak questions cleared!')).toBeInTheDocument();
        expect(screen.getByText('You cleared 1 question this session!')).toBeInTheDocument();
      });
    });
  });

  describe('Streak Mode Toggle', () => {
    it('shows streak mode toggle in list view', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Streak mode')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('streak mode is off by default', () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      const toggle = screen.getByRole('switch');
      expect(toggle).not.toBeChecked();
      expect(screen.getByText('(1x to clear)')).toBeInTheDocument();
    });

    it('shows correct description when streak mode is enabled', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      await waitFor(() => {
        expect(screen.getByText('(3x to clear)')).toBeInTheDocument();
      });
    });
  });

  describe('Streak Mode Enabled', () => {
    it('shows streak progress indicator when streak mode is enabled', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Enable streak mode
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByText('Streak to clear (3 correct in a row)')).toBeInTheDocument();
        expect(screen.getByText('0/3')).toBeInTheDocument();
      });
    });

    it('increments streak on correct answer in streak mode', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Enable streak mode
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      // Answer correctly (A is the correct answer for first question)
      await user.click(screen.getByTestId('select-a'));

      await waitFor(() => {
        expect(screen.getByText('1/3')).toBeInTheDocument();
      });
    });

    it('resets streak on wrong answer in streak mode', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Enable streak mode
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      // Answer correctly first
      await user.click(screen.getByTestId('select-a'));

      await waitFor(() => {
        expect(screen.getByText('1/3')).toBeInTheDocument();
      });

      // Go to next question and back to reset answer state
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A02');
      });
      fireEvent.click(screen.getByRole('button', { name: /previous/i }));
      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A01');
      });

      // Answer incorrectly (B is wrong for first question)
      await user.click(screen.getByTestId('select-b'));

      await waitFor(() => {
        expect(screen.getByText('0/3')).toBeInTheDocument();
      });
    });

    it('clears question after 3 correct answers in a row in streak mode', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Enable streak mode
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      fireEvent.click(screen.getByText('What is amateur radio?'));

      // Answer correctly 3 times by navigating away and back
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          expect(screen.getByTestId('select-a')).toBeInTheDocument();
        });

        await user.click(screen.getByTestId('select-a'));

        if (i < 2) {
          // Navigate to next and back to reset answer state
          await waitFor(() => {
            expect(screen.getByTestId('show-result')).toHaveTextContent('true');
          });
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
          await waitFor(() => {
            expect(screen.getByTestId('question-id')).toHaveTextContent('T1A02');
          });
          fireEvent.click(screen.getByRole('button', { name: /previous/i }));
          await waitFor(() => {
            expect(screen.getByTestId('question-id')).toHaveTextContent('T1A01');
          });
        }
      }

      // Question should be cleared - go back and check count
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /back to weak questions/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('2 questions to review')).toBeInTheDocument();
        expect(screen.getByText(/\(1 cleared\)/)).toBeInTheDocument();
      });
    });

    it('shows streak indicators in list view when streak mode is enabled', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Enable streak mode
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      // Answer first question correctly once
      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('select-a'));

      await waitFor(() => {
        expect(screen.getByText('1/3')).toBeInTheDocument();
      });

      // Go back to list
      fireEvent.click(screen.getByRole('button', { name: /back to weak questions/i }));

      // The first question should have streak indicators visible
      await waitFor(() => {
        // Get question buttons (not the toggle card)
        const questionButtons = screen.getAllByRole('button', { name: /What is|What band/i });
        expect(questionButtons.length).toBe(3);
        // In streak mode, streak dots should be present
        const firstButton = questionButtons[0];
        const streakDots = firstButton.querySelectorAll('.rounded-full');
        expect(streakDots.length).toBe(3); // 3 dots for streak
      });
    });

    it('shows all cleared message when all questions are cleared in streak mode', async () => {
      const user = userEvent.setup();

      // Use only one question for simplicity
      render(<WeakQuestionsReview {...defaultProps} weakQuestionIds={['uuid-t1a01']} />, { wrapper: createWrapper() });

      // Enable streak mode
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      // Answer correctly 3 times by going back to list and clicking again
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('What is amateur radio?'));

        await waitFor(() => {
          expect(screen.getByTestId('select-a')).toBeInTheDocument();
        });

        await user.click(screen.getByTestId('select-a'));

        if (i < 2) {
          // Go back to list to re-select question
          await waitFor(() => {
            expect(screen.getByTestId('show-result')).toHaveTextContent('true');
          });
          fireEvent.click(screen.getByRole('button', { name: /back to weak questions/i }));
          await waitFor(() => {
            expect(screen.getByText('What is amateur radio?')).toBeInTheDocument();
          });
        }
      }

      // Should show all cleared message
      await waitFor(() => {
        expect(screen.getByText('All weak questions cleared!')).toBeInTheDocument();
        expect(screen.getByText('You cleared 1 question this session!')).toBeInTheDocument();
      });
    });

    it('correctly adjusts index when clearing middle question in streak mode', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Enable streak mode
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      // Navigate to the second question (index 1)
      fireEvent.click(screen.getByText('What band is best for beginners?'));

      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A02');
        expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
      });

      // Answer the middle question correctly 3 times
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          expect(screen.getByTestId('select-b')).toBeInTheDocument();
        });

        await user.click(screen.getByTestId('select-b'));

        if (i < 2) {
          // Navigate away and back to reset answer state
          await waitFor(() => {
            expect(screen.getByTestId('show-result')).toHaveTextContent('true');
          });
          fireEvent.click(screen.getByRole('button', { name: /next/i }));
          await waitFor(() => {
            expect(screen.getByTestId('question-id')).toHaveTextContent('T1A03');
          });
          fireEvent.click(screen.getByRole('button', { name: /previous/i }));
          await waitFor(() => {
            expect(screen.getByTestId('question-id')).toHaveTextContent('T1A02');
          });
        }
      }

      // After clearing middle question, should be on T1A03 (what was at index 2, now at index 1)
      // because the index stays at 1 but the list is now [T1A01, T1A03]
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /back to weak questions/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('2 questions to review')).toBeInTheDocument();
        expect(screen.getByText(/\(1 cleared\)/)).toBeInTheDocument();
        // Verify the remaining questions are T1A01 and T1A03
        expect(screen.getByText('What is amateur radio?')).toBeInTheDocument();
        expect(screen.getByText('What is CW?')).toBeInTheDocument();
        expect(screen.queryByText('What band is best for beginners?')).not.toBeInTheDocument();
      });
    });

    it('correctly adjusts index when clearing last question in streak mode', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      // Enable streak mode
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      // Navigate to the last question (index 2)
      fireEvent.click(screen.getByText('What is CW?'));

      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A03');
        expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
      });

      // Answer the last question correctly 3 times
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          expect(screen.getByTestId('select-c')).toBeInTheDocument();
        });

        await user.click(screen.getByTestId('select-c'));

        if (i < 2) {
          // Go back to list and re-select to reset answer state
          await waitFor(() => {
            expect(screen.getByTestId('show-result')).toHaveTextContent('true');
          });
          fireEvent.click(screen.getByRole('button', { name: /back to weak questions/i }));
          await waitFor(() => {
            expect(screen.getByText('What is CW?')).toBeInTheDocument();
          });
          fireEvent.click(screen.getByText('What is CW?'));
          await waitFor(() => {
            expect(screen.getByTestId('question-id')).toHaveTextContent('T1A03');
          });
        }
      }

      // After clearing last question, should go back to list view
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /back to weak questions/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('2 questions to review')).toBeInTheDocument();
        expect(screen.getByText(/\(1 cleared\)/)).toBeInTheDocument();
        // Verify the remaining questions are T1A01 and T1A02
        expect(screen.getByText('What is amateur radio?')).toBeInTheDocument();
        expect(screen.getByText('What band is best for beginners?')).toBeInTheDocument();
        expect(screen.queryByText('What is CW?')).not.toBeInTheDocument();
      });
    });
  });

  describe('Randomize Button', () => {
    it('shows randomize button in question view', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        const randomButton = screen.getByTitle('Random question');
        expect(randomButton).toBeInTheDocument();
      });
    });

    it('disables randomize button when only one question', async () => {
      render(<WeakQuestionsReview {...defaultProps} weakQuestionIds={['uuid-t1a01']} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        const randomButton = screen.getByTitle('Random question');
        expect(randomButton).toBeDisabled();
      });
    });

    it('enables randomize button when multiple questions', async () => {
      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        const randomButton = screen.getByTitle('Random question');
        expect(randomButton).not.toBeDisabled();
      });
    });

    it('changes to different question when randomize is clicked', async () => {
      // Seed Math.random for predictable test
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = () => {
        callCount++;
        // Return values that will result in index 1 (second question)
        return 0.5;
      };

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('question-id')).toHaveTextContent('T1A01');
      });

      const randomButton = screen.getByTitle('Random question');
      fireEvent.click(randomButton);

      await waitFor(() => {
        // Should be on a different question now
        const questionId = screen.getByTestId('question-id').textContent;
        expect(questionId).not.toBe('T1A01');
      });

      // Restore Math.random
      Math.random = originalRandom;
    });
  });

  describe('Edge Cases', () => {
    it('returns to list view when clearing the only remaining question (simple mode)', async () => {
      const user = userEvent.setup();

      // Use only one question
      render(<WeakQuestionsReview {...defaultProps} weakQuestionIds={['uuid-t1a01']} />, { wrapper: createWrapper() });

      // Click on the only question
      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      // Answer correctly once to clear it (simple mode is default)
      await user.click(screen.getByTestId('select-a'));

      // After clearing the only question, should show all cleared message
      await waitFor(() => {
        expect(screen.getByText('All weak questions cleared!')).toBeInTheDocument();
        expect(screen.getByText('You cleared 1 question this session!')).toBeInTheDocument();
      });
    });

    it('handles failed saveRandomAttempt gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock saveRandomAttempt to fail
      mockSaveRandomAttempt.mockRejectedValueOnce(new Error('Network error'));

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      // Answer the question - should not throw even though save fails
      await user.click(screen.getByTestId('select-a'));

      await waitFor(() => {
        // UI should still update despite save failure
        expect(screen.getByTestId('show-result')).toHaveTextContent('true');
      });

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save attempt:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('prevents answering the same question twice without navigation', async () => {
      const user = userEvent.setup();

      render(<WeakQuestionsReview {...defaultProps} />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('What is amateur radio?'));

      await waitFor(() => {
        expect(screen.getByTestId('select-a')).toBeInTheDocument();
      });

      // Answer the question
      await user.click(screen.getByTestId('select-a'));

      await waitFor(() => {
        expect(screen.getByTestId('show-result')).toHaveTextContent('true');
      });

      // Clear the mock to track new calls
      mockSaveRandomAttempt.mockClear();

      // Try to answer again - should be blocked
      await user.click(screen.getByTestId('select-b'));

      // Should not have saved another attempt
      expect(mockSaveRandomAttempt).not.toHaveBeenCalled();
      // Selected answer should still be A
      expect(screen.getByTestId('selected-answer')).toHaveTextContent('A');
    });
  });
});
