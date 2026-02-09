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

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args) => mockToastSuccess(...args),
    error: (...args) => mockToastError(...args),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock FigureImage component to verify it receives correct props
vi.mock('./FigureImage', () => ({
  FigureImage: ({ figureUrl, questionId }: {
    figureUrl: string | null | undefined;
    questionId: string;
  }) => figureUrl ? (
    <div data-testid="figure-image" data-figure-url={figureUrl} data-question-id={questionId}>
      Figure Image
    </div>
  ) : null
}));

const mockQuestion: Question = {
  id: 'uuid-t1a01',
  displayName: 'T1A01',
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
      expect(screen.getByText('Correct')).toBeInTheDocument();
    });

    it('shows incorrect indicator when answer is wrong', () => {
      renderQuestionCard({ selectedAnswer: 'B', showResult: true });
      expect(screen.getByText(/The answer is A/)).toBeInTheDocument();
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

  describe('Forum Discussion Button', () => {
    const questionWithForumUrl: Question = {
      ...mockQuestion,
      forumUrl: 'https://forum.openhamprep.com/t/t1a01-question/123',
    };

    const questionWithoutForumUrl: Question = {
      ...mockQuestion,
      forumUrl: null,
    };

    it('shows "Discuss with Other Hams" button when forumUrl is present and showResult is true', () => {
      renderQuestionCard({
        question: questionWithForumUrl,
        selectedAnswer: 'A',
        showResult: true,
        hideLinks: false
      });

      expect(screen.getByText('Discuss with Other Hams')).toBeInTheDocument();
    });

    it('does not show forum button when forumUrl is null', () => {
      renderQuestionCard({
        question: questionWithoutForumUrl,
        selectedAnswer: 'A',
        showResult: true,
        hideLinks: false
      });

      expect(screen.queryByText('Discuss with Other Hams')).not.toBeInTheDocument();
    });

    it('does not show forum button when showResult is false', () => {
      renderQuestionCard({
        question: questionWithForumUrl,
        selectedAnswer: 'A',
        showResult: false
      });

      expect(screen.queryByText('Discuss with Other Hams')).not.toBeInTheDocument();
    });

    it('does not show forum button when hideLinks is true', () => {
      renderQuestionCard({
        question: questionWithForumUrl,
        selectedAnswer: 'A',
        showResult: true,
        hideLinks: true
      });

      expect(screen.queryByText('Discuss with Other Hams')).not.toBeInTheDocument();
    });

    it('forum button links through OIDC auth with origin parameter', () => {
      renderQuestionCard({
        question: questionWithForumUrl,
        selectedAnswer: 'A',
        showResult: true,
        hideLinks: false
      });

      const link = screen.getByRole('link', { name: /Discuss with Other Hams/i });
      // Should route through OIDC auth with the topic path as the origin parameter
      expect(link).toHaveAttribute('href', 'https://forum.openhamprep.com/auth/oidc?origin=%2Ft%2Ft1a01-question%2F123');
    });

    it('forum button opens in new tab', () => {
      renderQuestionCard({
        question: questionWithForumUrl,
        selectedAnswer: 'A',
        showResult: true,
        hideLinks: false
      });

      const link = screen.getByRole('link', { name: /Discuss with Other Hams/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('does not show forum button when forumUrl is undefined', () => {
      const questionWithUndefinedForumUrl: Question = {
        id: 'T1A01',
        question: 'Test question?',
        options: { A: 'A', B: 'B', C: 'C', D: 'D' },
        correctAnswer: 'A',
        subelement: 'T1',
        group: 'T1A',
        explanation: 'Test explanation',
        links: [],
        // forumUrl is omitted (undefined)
      };

      renderQuestionCard({
        question: questionWithUndefinedForumUrl,
        selectedAnswer: 'A',
        showResult: true,
        hideLinks: false
      });

      expect(screen.queryByText('Discuss with Other Hams')).not.toBeInTheDocument();
    });
  });

  describe('Figure Display', () => {
    const questionWithFigure: Question = {
      ...mockQuestion,
      id: 'E9B05',
      question: 'What type of antenna pattern is shown in Figure E9-2?',
      figureUrl: 'https://storage.example.com/question-figures/E9B05.png',
    };

    const questionWithoutFigure: Question = {
      ...mockQuestion,
      figureUrl: null,
    };

    it('renders FigureImage when question has a figureUrl', () => {
      renderQuestionCard({ question: questionWithFigure });

      const figureImage = screen.getByTestId('figure-image');
      expect(figureImage).toBeInTheDocument();
      expect(figureImage).toHaveAttribute('data-figure-url', 'https://storage.example.com/question-figures/E9B05.png');
      expect(figureImage).toHaveAttribute('data-question-id', 'E9B05');
    });

    it('does not render FigureImage when question has no figureUrl', () => {
      renderQuestionCard({ question: questionWithoutFigure });

      expect(screen.queryByTestId('figure-image')).not.toBeInTheDocument();
    });

    it('does not render FigureImage when figureUrl is null even if question mentions figure', () => {
      // The component should NOT guess if a figure is needed based on question text
      const questionMentionsFigure: Question = {
        ...mockQuestion,
        id: 'E9B05',
        question: 'What type of antenna pattern is shown in Figure E9-2?',
        figureUrl: null, // Admin hasn't added a figure
      };

      renderQuestionCard({ question: questionMentionsFigure });

      expect(screen.queryByTestId('figure-image')).not.toBeInTheDocument();
    });

    it('passes correct props to FigureImage component', () => {
      renderQuestionCard({ question: questionWithFigure });

      const figureImage = screen.getByTestId('figure-image');
      expect(figureImage).toHaveAttribute('data-figure-url', questionWithFigure.figureUrl);
      expect(figureImage).toHaveAttribute('data-question-id', questionWithFigure.id);
    });

    it('handles question with figureUrl undefined', () => {
      const questionWithUndefinedFigure: Question = {
        ...mockQuestion,
        // figureUrl is not set (undefined)
      };

      renderQuestionCard({ question: questionWithUndefinedFigure });

      expect(screen.queryByTestId('figure-image')).not.toBeInTheDocument();
    });

    it('renders figure for Technician question with figureUrl', () => {
      const techQuestion: Question = {
        ...mockQuestion,
        id: 'T1A05',
        question: 'Refer to Figure T1 for the schematic diagram.',
        figureUrl: 'https://storage.example.com/question-figures/T1A05.png',
      };

      renderQuestionCard({ question: techQuestion });

      const figureImage = screen.getByTestId('figure-image');
      expect(figureImage).toBeInTheDocument();
      expect(figureImage).toHaveAttribute('data-question-id', 'T1A05');
    });

    it('renders figure for General question with figureUrl', () => {
      const generalQuestion: Question = {
        ...mockQuestion,
        id: 'G2B03',
        question: 'What is shown in Figure G2-1?',
        figureUrl: 'https://storage.example.com/question-figures/G2B03.png',
      };

      renderQuestionCard({ question: generalQuestion });

      const figureImage = screen.getByTestId('figure-image');
      expect(figureImage).toBeInTheDocument();
      expect(figureImage).toHaveAttribute('data-question-id', 'G2B03');
    });
  });

  describe('Shareable Link Button', () => {
    // The shareable link button is only visible to logged-in users
    it('does not render shareable link button when user is not logged in', () => {
      // The default mock has user: null
      renderQuestionCard();

      const linkButton = screen.queryByRole('button', { name: /copy shareable link/i });
      expect(linkButton).not.toBeInTheDocument();
    });
  });
});
