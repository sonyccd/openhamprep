import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from './QuestionCard';
import { Question } from '@/hooks/useQuestions';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
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
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const mockQuestion: Question = {
  id: 'T1A01',
  question: 'What is the purpose of the Amateur Radio Service?',
  options: {
    A: 'To provide emergency communications',
    B: 'To make money',
    C: 'To broadcast music',
    D: 'To replace cell phones',
  },
  correctAnswer: 'A',
  subelement: 'T1',
  group: 'T1A',
  explanation: 'Amateur radio is for emergency communications and experimentation.',
  links: [],
};

const renderQuestionCard = (props: Partial<Parameters<typeof QuestionCard>[0]> = {}) => {
  return render(
    <TooltipProvider>
      <QuestionCard
        question={mockQuestion}
        selectedAnswer={null}
        onSelectAnswer={vi.fn()}
        {...props}
      />
    </TooltipProvider>
  );
};

describe('QuestionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders question text', () => {
      renderQuestionCard();
      expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
    });

    it('renders question ID', () => {
      renderQuestionCard();
      expect(screen.getByText('T1A01')).toBeInTheDocument();
    });

    it('renders all four answer options', () => {
      renderQuestionCard();
      expect(screen.getByText('To provide emergency communications')).toBeInTheDocument();
      expect(screen.getByText('To make money')).toBeInTheDocument();
      expect(screen.getByText('To broadcast music')).toBeInTheDocument();
      expect(screen.getByText('To replace cell phones')).toBeInTheDocument();
    });

    it('renders option labels A, B, C, D', () => {
      renderQuestionCard();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
    });

    it('renders question number when provided', () => {
      renderQuestionCard({ questionNumber: 5, totalQuestions: 35 });
      expect(screen.getByText('5 / 35')).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('calls onSelectAnswer when clicking an option', () => {
      const onSelectAnswer = vi.fn();
      renderQuestionCard({ onSelectAnswer });
      
      fireEvent.click(screen.getByText('To provide emergency communications'));
      expect(onSelectAnswer).toHaveBeenCalledWith('A');
    });

    it('does not call onSelectAnswer when showResult is true', () => {
      const onSelectAnswer = vi.fn();
      renderQuestionCard({ onSelectAnswer, showResult: true, selectedAnswer: 'A' });
      
      fireEvent.click(screen.getByText('To make money'));
      expect(onSelectAnswer).not.toHaveBeenCalled();
    });

    it('highlights selected answer', () => {
      renderQuestionCard({ selectedAnswer: 'B' });
      
      // The button containing option B should have selection styling
      const buttons = screen.getAllByRole('button');
      const optionBButton = buttons.find(btn => btn.textContent?.includes('To make money'));
      expect(optionBButton).toHaveClass('border-primary');
    });
  });

  describe('Result Display', () => {
    it('shows correct indicator when answer is correct', () => {
      renderQuestionCard({ selectedAnswer: 'A', showResult: true });
      expect(screen.getByText('✓ Correct!')).toBeInTheDocument();
    });

    it('shows incorrect indicator when answer is wrong', () => {
      renderQuestionCard({ selectedAnswer: 'B', showResult: true });
      expect(screen.getByText(/✗ Incorrect/)).toBeInTheDocument();
      expect(screen.getByText(/The correct answer is A/)).toBeInTheDocument();
    });

    it('displays explanation when showResult is true and not hideLinks', () => {
      renderQuestionCard({ selectedAnswer: 'A', showResult: true, hideLinks: false });
      expect(screen.getByText('Explanation')).toBeInTheDocument();
      expect(screen.getByText(/Amateur radio is for emergency communications/)).toBeInTheDocument();
    });

    it('hides explanation when hideLinks is true', () => {
      renderQuestionCard({ selectedAnswer: 'A', showResult: true, hideLinks: true });
      expect(screen.queryByText('Explanation')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('disables option buttons when showResult is true', () => {
      renderQuestionCard({ selectedAnswer: 'A', showResult: true });

      const buttons = screen.getAllByRole('button');
      // Filter for option buttons by checking if they contain the answer text
      const optionButtons = buttons.filter(btn =>
        btn.textContent?.includes('To provide emergency communications') ||
        btn.textContent?.includes('To make money') ||
        btn.textContent?.includes('To broadcast music') ||
        btn.textContent?.includes('To replace cell phones')
      );

      optionButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });
});
