import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeakQuestionList } from './WeakQuestionList';
import { StreakDots } from './StreakDots';
import { muiWrapper } from '@/test/utils/testWrappers';
import type { Question } from '@/hooks/useQuestions';

vi.mock('framer-motion', async () => {
  const { framerMotionMock } = await import('@/test/mocks/framerMotion');
  return framerMotionMock();
});

const questions = [
  { id: 'a', displayName: 'T1A01', question: 'What is an antenna?' },
  { id: 'b', displayName: 'T1A02', question: 'What is a dipole?' },
] as Question[];

const renderList = (over: Partial<React.ComponentProps<typeof WeakQuestionList>> = {}) => {
  const props = {
    questions,
    streaks: {},
    streakToClear: 3,
    clearedCount: 0,
    streakModeEnabled: true,
    onStreakModeChange: vi.fn(),
    onSelect: vi.fn(),
    ...over,
  };
  render(<WeakQuestionList {...props} />, { wrapper: muiWrapper });
  return props;
};

describe('WeakQuestionList', () => {
  it('opens the chosen question', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderList();

    await user.click(screen.getByRole('button', { name: /T1A02/ }));

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  /**
   * The old rows were a <button> holding two <div>s and a <p> — flow content
   * inside a button. Everything in the row is a span now, including the
   * streak dots, which are also rendered inside it.
   */
  it('puts no flow content inside a row', () => {
    renderList({ streaks: { a: 2 } });

    for (const row of screen.getAllByRole('button')) {
      expect(row.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6')).toHaveLength(0);
    }
  });

  it('labels the streak-mode switch, including what it means', () => {
    renderList({ streakModeEnabled: false });

    expect(screen.getByRole('switch', { name: /Streak mode.*1x to clear/ })).not.toBeChecked();
  });

  it('flips streak mode', async () => {
    const user = userEvent.setup();
    const { onStreakModeChange } = renderList({ streakModeEnabled: false });

    await user.click(screen.getByRole('switch'));

    expect(onStreakModeChange).toHaveBeenCalledWith(true);
  });

  it('shows the dots only in streak mode', () => {
    const { unmount } = render(
      <WeakQuestionList
        questions={questions}
        streaks={{}}
        streakToClear={3}
        clearedCount={0}
        streakModeEnabled={false}
        onStreakModeChange={vi.fn()}
        onSelect={vi.fn()}
      />,
      { wrapper: muiWrapper }
    );
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    unmount();

    renderList({ streakModeEnabled: true });
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('reports how many were cleared', () => {
    renderList({ clearedCount: 2 });

    expect(screen.getByText('(2 cleared)')).toBeInTheDocument();
  });
});

describe('StreakDots', () => {
  /** Both call sites now carry the name; before, only the list did. */
  it('names itself with the count', () => {
    render(<StreakDots filled={2} total={3} />, { wrapper: muiWrapper });

    expect(screen.getByRole('img', { name: '2 of 3 correct in a row' })).toBeInTheDocument();
  });

  it('renders only spans, so it can sit inside a button', () => {
    const { container } = render(<StreakDots filled={1} total={3} />, { wrapper: muiWrapper });

    expect(container.querySelectorAll('div')).toHaveLength(0);
    expect(container.querySelectorAll('span')).toHaveLength(4);
  });
});
