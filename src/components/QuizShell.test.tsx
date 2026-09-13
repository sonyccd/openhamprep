import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizShell, QuizShellPending, QuizShellError, QuizNavControls } from './QuizShell';
import { muiWrapper } from '@/test/utils/testWrappers';
import type { UseQuizSession } from '@/hooks/useQuizSession';

vi.mock('framer-motion', async () => {
  const { framerMotionMock } = await import('@/test/mocks/framerMotion');
  return framerMotionMock();
});

/** Only the four fields QuizNavControls reads; the rest are spies or empty. */
const makeSession = (overrides: Partial<UseQuizSession> = {}): UseQuizSession =>
  ({
    question: null,
    selectedAnswer: null,
    showResult: false,
    stats: { correct: 0, total: 0 },
    history: [],
    historyIndex: 0,
    askedIds: [],
    canGoBack: false,
    isViewingHistory: false,
    selectAnswer: vi.fn(),
    next: vi.fn(),
    skip: vi.fn(),
    previous: vi.fn(),
    start: vi.fn(),
    reset: vi.fn(),
    clearHistory: vi.fn(),
    ...overrides,
  }) as UseQuizSession;

describe('QuizShell', () => {
  it('renders header, children, actions and footer in order', () => {
    render(
      <QuizShell
        header={<div>the header</div>}
        actions={<div>the actions</div>}
        footer="Question 3 of 12"
      >
        <div>the question</div>
      </QuizShell>,
      { wrapper: muiWrapper }
    );

    const order = ['the header', 'the question', 'the actions', 'Question 3 of 12'].map(
      (text) => screen.getByText(text)
    );
    for (let i = 1; i < order.length; i++) {
      // Node.compareDocumentPosition: 4 === DOCUMENT_POSITION_FOLLOWING.
      expect(order[i - 1].compareDocumentPosition(order[i]) & 4).toBeTruthy();
    }
  });

  /**
   * The footer was a <motion.p> before the MUI port, and MotionBox wraps Box,
   * which defaults to a div. Losing the paragraph is invisible on screen and
   * only shows up in a screen reader's paragraph navigation, so it is pinned
   * here rather than left to review.
   */
  it('renders the footer note as a paragraph', () => {
    render(<QuizShell footer="Question 3 of 12">{null}</QuizShell>, { wrapper: muiWrapper });

    expect(screen.getByText('Question 3 of 12').tagName).toBe('P');
  });

  it('omits the footer element entirely when there is no note', () => {
    const { container } = render(<QuizShell>{<div>q</div>}</QuizShell>, { wrapper: muiWrapper });

    expect(container.querySelector('p')).toBeNull();
  });
});

describe('QuizShellPending', () => {
  it('shows a progress indicator and the optional message', () => {
    render(<QuizShellPending message="Loading questions..." />, { wrapper: muiWrapper });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading questions...')).toBeInTheDocument();
  });

  it('shows the indicator alone when no message is given', () => {
    render(<QuizShellPending />, { wrapper: muiWrapper });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

describe('QuizShellError', () => {
  it('shows the default message and calls onBack', () => {
    const onBack = vi.fn();
    render(<QuizShellError onBack={onBack} />, { wrapper: muiWrapper });

    expect(screen.getByText('Failed to load questions')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /go back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows a custom message when given one', () => {
    render(<QuizShellError message="No chapters found" onBack={vi.fn()} />, {
      wrapper: muiWrapper,
    });

    expect(screen.getByText('No chapters found')).toBeInTheDocument();
  });
});

describe('QuizNavControls', () => {
  it('hides Previous until there is history to go back to', () => {
    const { rerender } = render(<QuizNavControls session={makeSession()} />, {
      wrapper: muiWrapper,
    });
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();

    rerender(<QuizNavControls session={makeSession({ canGoBack: true })} />);
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
  });

  it('offers Skip before answering and Next after', () => {
    const { rerender } = render(<QuizNavControls session={makeSession()} />, {
      wrapper: muiWrapper,
    });
    expect(screen.getByRole('button', { name: /skip question/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();

    rerender(<QuizNavControls session={makeSession({ showResult: true })} />);
    expect(screen.queryByRole('button', { name: /skip question/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next question/i })).toBeInTheDocument();
  });

  it('says "Next" rather than "Next Question" while re-reading history', () => {
    render(
      <QuizNavControls session={makeSession({ showResult: true, isViewingHistory: true })} />,
      { wrapper: muiWrapper }
    );

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('wires each control to its session method', () => {
    const session = makeSession({ canGoBack: true });
    const { rerender } = render(<QuizNavControls session={session} />, { wrapper: muiWrapper });

    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(session.previous).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: /skip question/i }));
    expect(session.skip).toHaveBeenCalledOnce();

    const answered = makeSession({ showResult: true });
    rerender(<QuizNavControls session={answered} />);
    fireEvent.click(screen.getByRole('button', { name: /next question/i }));
    expect(answered.next).toHaveBeenCalledOnce();
  });

  /**
   * The controls carry visible text rather than the IconButton + Tooltip the
   * C4 issue prescribed, because a tooltip is not an accessible name on touch.
   * Asserting the names here makes that a contract instead of a comment.
   */
  it('gives every control a visible text label', () => {
    render(<QuizNavControls session={makeSession({ canGoBack: true })} />, {
      wrapper: muiWrapper,
    });

    for (const name of [/previous/i, /skip question/i]) {
      expect(screen.getByRole('button', { name }).textContent?.trim()).toBeTruthy();
    }
  });
});
