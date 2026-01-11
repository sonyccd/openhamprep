import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestResults } from './TestResults';
import { Question } from '@/hooks/useQuestions';
import confetti from 'canvas-confetti';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
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

const createMockQuestion = (id: string, correctAnswer: 'A' | 'B' | 'C' | 'D' = 'A'): Question => ({
  id,
  question: `Question ${id}?`,
  options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
  correctAnswer,
  subelement: id.slice(0, 2),
  group: id.slice(0, 3),
  explanation: `Explanation for ${id}`,
  links: [],
});

const createQuestionsAndAnswers = (
  count: number,
  correctCount: number,
  prefix: string
): { questions: Question[]; answers: Record<string, 'A' | 'B' | 'C' | 'D'> } => {
  const questions = Array.from({ length: count }, (_, i) =>
    createMockQuestion(`${prefix}${i.toString().padStart(2, '0')}`)
  );
  const answers = questions.reduce((acc, q, i) => {
    acc[q.id] = i < correctCount ? 'A' : 'B'; // First correctCount are correct (A), rest incorrect (B)
    return acc;
  }, {} as Record<string, 'A' | 'B' | 'C' | 'D'>);
  return { questions, answers };
};

describe('TestResults', () => {
  const defaultProps = {
    onRetake: vi.fn(),
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Technician test (35 questions, 26 to pass)', () => {
    it('shows PASSED when score >= 26', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 26, 'T');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          {...defaultProps}
        />
      );

      expect(screen.getByText('PASSED!')).toBeInTheDocument();
      expect(screen.getByText('Congratulations! You passed the practice exam.')).toBeInTheDocument();
    });

    it('shows NOT PASSED when score < 26', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 25, 'T');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          {...defaultProps}
        />
      );

      expect(screen.getByText('NOT PASSED')).toBeInTheDocument();
      expect(screen.getByText('Keep studying and try again!')).toBeInTheDocument();
    });

    it('shows correct passing score text for technician', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 26, 'T');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          {...defaultProps}
        />
      );

      expect(screen.getByText('Passing score: 26 out of 35 (74%)')).toBeInTheDocument();
    });
  });

  describe('General test (35 questions, 26 to pass)', () => {
    it('shows PASSED when score >= 26', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 26, 'G');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="general"
          {...defaultProps}
        />
      );

      expect(screen.getByText('PASSED!')).toBeInTheDocument();
    });

    it('shows NOT PASSED when score < 26', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 25, 'G');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="general"
          {...defaultProps}
        />
      );

      expect(screen.getByText('NOT PASSED')).toBeInTheDocument();
    });

    it('shows correct passing score text for general', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 26, 'G');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="general"
          {...defaultProps}
        />
      );

      expect(screen.getByText('Passing score: 26 out of 35 (74%)')).toBeInTheDocument();
    });
  });

  describe('Extra test (50 questions, 37 to pass)', () => {
    it('shows PASSED when score >= 37', () => {
      const { questions, answers } = createQuestionsAndAnswers(50, 37, 'E');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="extra"
          {...defaultProps}
        />
      );

      expect(screen.getByText('PASSED!')).toBeInTheDocument();
      expect(screen.getByText('Congratulations! You passed the practice exam.')).toBeInTheDocument();
    });

    it('shows NOT PASSED when score < 37', () => {
      const { questions, answers } = createQuestionsAndAnswers(50, 36, 'E');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="extra"
          {...defaultProps}
        />
      );

      expect(screen.getByText('NOT PASSED')).toBeInTheDocument();
      expect(screen.getByText('Keep studying and try again!')).toBeInTheDocument();
    });

    it('shows correct passing score text for extra', () => {
      const { questions, answers } = createQuestionsAndAnswers(50, 37, 'E');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="extra"
          {...defaultProps}
        />
      );

      expect(screen.getByText('Passing score: 37 out of 50 (74%)')).toBeInTheDocument();
    });

    it('shows 26 correct as NOT PASSED for extra (would pass technician)', () => {
      const { questions, answers } = createQuestionsAndAnswers(50, 26, 'E');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="extra"
          {...defaultProps}
        />
      );

      expect(screen.getByText('NOT PASSED')).toBeInTheDocument();
    });
  });

  describe('Score display', () => {
    it('displays correct, incorrect, and percentage', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 30, 'T');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          {...defaultProps}
        />
      );

      // Check that we have the score display sections with their labels
      expect(screen.getByText('Correct')).toBeInTheDocument();
      expect(screen.getByText('Incorrect')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
      // Verify passed since 30 >= 26
      expect(screen.getByText('PASSED!')).toBeInTheDocument();
    });

    it('displays score labels', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 26, 'T');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          {...defaultProps}
        />
      );

      expect(screen.getByText('Correct')).toBeInTheDocument();
      expect(screen.getByText('Incorrect')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onRetake when Retake Test is clicked', () => {
      const onRetake = vi.fn();
      const { questions, answers } = createQuestionsAndAnswers(35, 26, 'T');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          onRetake={onRetake}
          onBack={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /retake test/i }));
      expect(onRetake).toHaveBeenCalled();
    });

    it('calls onBack when Back to Menu is clicked', () => {
      const onBack = vi.fn();
      const { questions, answers } = createQuestionsAndAnswers(35, 26, 'T');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          onRetake={vi.fn()}
          onBack={onBack}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /back to menu/i }));
      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('Review section', () => {
    it('displays all questions in review list', () => {
      const { questions, answers } = createQuestionsAndAnswers(5, 3, 'T');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          {...defaultProps}
        />
      );

      expect(screen.getByText('Review Your Answers')).toBeInTheDocument();
      // Should show all 5 questions
      questions.forEach((q) => {
        expect(screen.getByText(new RegExp(q.id))).toBeInTheDocument();
      });
    });
  });

  describe('Default testType behavior', () => {
    it('defaults to technician config when testType is not provided', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 26, 'T');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          {...defaultProps}
        />
      );

      // Should use technician config: 26 out of 35
      expect(screen.getByText('Passing score: 26 out of 35 (74%)')).toBeInTheDocument();
      expect(screen.getByText('PASSED!')).toBeInTheDocument();
    });
  });

  describe('Confetti celebration', () => {
    it('fires confetti when user passes', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 26, 'T');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          {...defaultProps}
        />
      );

      expect(confetti).toHaveBeenCalledWith({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    });

    it('does not fire confetti when user fails', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 25, 'T');

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          {...defaultProps}
        />
      );

      expect(confetti).not.toHaveBeenCalled();
    });

    it('fires confetti only once even on re-render', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 26, 'T');

      const { rerender } = render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          {...defaultProps}
        />
      );

      // Re-render with same props
      rerender(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          {...defaultProps}
        />
      );

      expect(confetti).toHaveBeenCalledTimes(1);
    });

    it('does not fire confetti when user prefers reduced motion', () => {
      const { questions, answers } = createQuestionsAndAnswers(35, 26, 'T');

      // Mock prefers-reduced-motion
      const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      window.matchMedia = matchMediaMock;

      render(
        <TestResults
          questions={questions}
          answers={answers}
          testType="technician"
          {...defaultProps}
        />
      );

      expect(confetti).not.toHaveBeenCalled();
    });
  });
});
