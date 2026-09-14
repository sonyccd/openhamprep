import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QuestionCard } from './QuestionCard';
import { Question } from '@/hooks/useQuestions';
import { TooltipProvider } from '@/components/ui/tooltip';
import { muiWrapper } from '@/test/utils';

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

vi.mock('framer-motion', async () => {
  const { framerMotionMock } = await import('@/test/mocks/framerMotion');
  return framerMotionMock();
});

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
    <MemoryRouter>
      <TooltipProvider>
        <QuestionCard
          question={mockQuestion}
          selectedAnswer={null}
          onSelectAnswer={vi.fn()}
          {...props}
        />
      </TooltipProvider>
    </MemoryRouter>,
    // The options read palette tokens, so they need the real theme.
    { wrapper: muiWrapper }
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

      // toBeChecked, not aria-pressed. #274's point was that four independent
      // toggle buttons describe the wrong thing — this is one choice among
      // four, and it is a native radio now.
      expect(screen.getByRole('radio', { name: /To make money/ })).toBeChecked();
    });
  });

  // #274: these were four <button>s with aria-pressed, which announced four
  // independent toggles and gave four tab stops with no arrow-key movement.
  // Nothing here re-implements the contract — the options are native
  // <input type="radio">, so the browser supplies it.
  describe('Answer options as a radiogroup (#274)', () => {
    it('exposes one radiogroup of four options', () => {
      renderQuestionCard();

      expect(screen.getByRole('radiogroup', { name: 'Answer options' })).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(4);
    });

    /**
     * Gate 1 regression guard. The rows were `rounded-xl` (12px) before the
     * port, and `sx` multiplies a bare `borderRadius` by shape.borderRadius —
     * also 12 — so the first port shipped `borderRadius: 3`, emitting
     * calc(3 * 12px) and rounding every option three times as hard.
     *
     * happy-dom does not evaluate calc(), so the emitted rule is asserted
     * rather than the computed style.
     */
    it('keeps the option rows at one radius unit', () => {
      const { container } = renderQuestionCard();

      const row = container.querySelector('label');
      const rowClass = Array.from(row!.classList).find((c) => c.startsWith('css-'));
      const rules = Array.from(document.querySelectorAll('style'))
        .flatMap((s) => (s.textContent ?? '').split('}'))
        .filter((r) => r.includes(`.${rowClass}`) && r.includes('border-radius'));

      // One unit emits the bare var; any multiplier emits calc(n * var(...)).
      expect(rules.join(' ')).toContain('border-radius:var(--mui-shape-borderRadius);');
    });

    /**
     * The single tab stop is the browser's native radio behaviour: same-name
     * radios form one group and only the checked one sits in the tab order.
     *
     * It is NOT a roving tabindex — all four carry tabIndex 0, and asserting
     * otherwise fails. Since happy-dom does not implement the native rule
     * either, the grouping is what can honestly be pinned here: four real
     * <input type="radio"> sharing one name is precisely the condition the
     * browser applies that rule to, and it is what the old four-<button>
     * model lacked.
     */
    it('groups the options as same-name radios, which is what makes them one tab stop', () => {
      renderQuestionCard({ selectedAnswer: 'B' });

      const radios = screen.getAllByRole('radio') as HTMLInputElement[];

      expect(radios).toHaveLength(4);
      expect(radios.every((r) => r.type === 'radio')).toBe(true);
      expect(new Set(radios.map((r) => r.name)).size).toBe(1);
    });

    it('does not move focus between options on Tab', async () => {
      const user = userEvent.setup();
      renderQuestionCard({ selectedAnswer: 'B' });

      const radios = screen.getAllByRole('radio');
      screen.getByRole('radio', { name: /To make money/ }).focus();
      await user.tab();

      expect(radios).not.toContain(document.activeElement);
    });

    it('moves the selection with arrow keys', async () => {
      const user = userEvent.setup();
      const onSelectAnswer = vi.fn();
      renderQuestionCard({ selectedAnswer: 'A', onSelectAnswer });

      screen.getAllByRole('radio')[0].focus();
      await user.keyboard('{ArrowDown}');

      // The whole point of #274: this did nothing before.
      expect(onSelectAnswer).toHaveBeenCalledWith('B');
    });

    it('stops accepting answers once the result is shown', () => {
      renderQuestionCard({ selectedAnswer: 'A', showResult: true });

      for (const radio of screen.getAllByRole('radio')) {
        expect(radio).toBeDisabled();
      }
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

  describe('Guest bookmark popover', () => {
    // Default mock has user: null, so guest floating actions render
    it('shows bookmark prompt with sign-up link when bookmark icon is clicked', () => {
      renderQuestionCard();

      fireEvent.click(screen.getByRole('button', { name: /bookmark this question/i }));

      expect(
        screen.getByText(/bookmarks need an account to persist/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /create free account/i })
      ).toHaveAttribute('href', '/auth?returnTo=/dashboard');
    });

    it('does not call addBookmark when guest clicks the bookmark icon', () => {
      // The useBookmarks mock returns a vi.fn() for addBookmark.mutate.
      // Guests should never trigger a save attempt — the click opens the prompt instead.
      renderQuestionCard();

      fireEvent.click(screen.getByRole('button', { name: /bookmark this question/i }));

      // No toast.success was called (which would happen on a successful save path).
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });
});
