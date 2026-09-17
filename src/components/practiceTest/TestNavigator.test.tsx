import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestNavigator } from './TestNavigator';
import { muiWrapper } from '@/test/utils/testWrappers';
import type { Question } from '@/hooks/useQuestions';

vi.mock('framer-motion', async () => {
  const { framerMotionMock } = await import('@/test/mocks/framerMotion');
  return framerMotionMock();
});

const questions = ['q1', 'q2', 'q3'].map((id) => ({ id }) as Question);

const renderNav = (over: Partial<React.ComponentProps<typeof TestNavigator>> = {}) => {
  const props = {
    questions,
    answers: {},
    currentIndex: 0,
    onGoTo: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onFinish: vi.fn(),
    ...over,
  };
  render(<TestNavigator {...props} />, { wrapper: muiWrapper });
  return props;
};

describe('TestNavigator', () => {
  /** Colour marks answered and current; the name has to say it too. */
  it('names each tile with its number, state and position', () => {
    renderNav({ answers: { q1: 'A' }, currentIndex: 1 });

    const nav = screen.getByRole('navigation', { name: 'Question navigator' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Question 1, answered' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Question 2, unanswered, current' })
    ).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: 'Question 3, unanswered' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('jumps to a tile', async () => {
    const user = userEvent.setup();
    const { onGoTo } = renderNav();

    await user.click(screen.getByRole('button', { name: 'Question 3, unanswered' }));

    expect(onGoTo).toHaveBeenCalledWith(2);
  });

  it('cannot go back from the first question', () => {
    renderNav({ currentIndex: 0 });

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('offers Next until the last question, then Finish', () => {
    const { rerender } = (() => {
      const props = { questions, answers: {}, currentIndex: 0, onGoTo: vi.fn(), onPrevious: vi.fn(), onNext: vi.fn(), onFinish: vi.fn() };
      const view = render(<TestNavigator {...props} />, { wrapper: muiWrapper });
      return { rerender: (i: number) => view.rerender(<TestNavigator {...props} currentIndex={i} />) };
    })();

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finish Test' })).not.toBeInTheDocument();

    rerender(2);

    expect(screen.getByRole('button', { name: 'Finish Test' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('warns on the last question while anything is unanswered', () => {
    renderNav({ currentIndex: 2, answers: { q1: 'A' } });

    expect(screen.getByText(/You have 2 unanswered question/)).toBeInTheDocument();
  });

  it('drops the warning once everything is answered', () => {
    renderNav({ currentIndex: 2, answers: { q1: 'A', q2: 'B', q3: 'C' } });

    expect(screen.queryByText(/unanswered question/)).not.toBeInTheDocument();
  });
});
