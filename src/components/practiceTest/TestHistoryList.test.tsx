import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestHistoryList } from './TestHistoryList';
import { muiWrapper } from '@/test/utils/testWrappers';

vi.mock('framer-motion', async () => {
  const { framerMotionMock } = await import('@/test/mocks/framerMotion');
  return framerMotionMock();
});

const result = (over = {}) => ({
  id: 'r1',
  score: 30,
  total_questions: 35,
  percentage: 86,
  passed: true,
  completed_at: new Date().toISOString(),
  test_type: 'technician',
  ...over,
});

describe('TestHistoryList', () => {
  it('names the spinner while loading', () => {
    render(<TestHistoryList tests={undefined} isLoading error={null} />, { wrapper: muiWrapper });

    expect(screen.getByLabelText('Loading test history')).toBeInTheDocument();
  });

  it('says so when the load failed', () => {
    render(<TestHistoryList tests={undefined} isLoading={false} error={new Error('x')} />, {
      wrapper: muiWrapper,
    });

    expect(screen.getByText('Could not load test history')).toBeInTheDocument();
  });

  it('invites a first test when there are none', () => {
    render(<TestHistoryList tests={[]} isLoading={false} error={null} />, { wrapper: muiWrapper });

    expect(screen.getByText('No tests taken yet')).toBeInTheDocument();
  });

  it('opens a result for review', async () => {
    const user = userEvent.setup();
    const onReviewTest = vi.fn();
    render(
      <TestHistoryList tests={[result()]} isLoading={false} error={null} onReviewTest={onReviewTest} />,
      { wrapper: muiWrapper }
    );

    await user.click(screen.getByRole('button', { name: /86%/ }));

    expect(onReviewTest).toHaveBeenCalledWith('r1');
  });

  it('is inert when nothing can review it', () => {
    render(<TestHistoryList tests={[result()]} isLoading={false} error={null} />, {
      wrapper: muiWrapper,
    });

    expect(screen.getByRole('button', { name: /86%/ })).toBeDisabled();
  });

  it('marks a pass and not a fail', () => {
    render(
      <TestHistoryList
        tests={[result(), result({ id: 'r2', passed: false, percentage: 60 })]}
        isLoading={false}
        error={null}
      />,
      { wrapper: muiWrapper }
    );

    expect(screen.getAllByText('PASS')).toHaveLength(1);
  });

  /** A <button> takes phrasing content only. */
  it('puts no flow content inside a row', () => {
    render(<TestHistoryList tests={[result()]} isLoading={false} error={null} />, {
      wrapper: muiWrapper,
    });

    expect(
      screen.getByRole('button').querySelectorAll('p, div, h1, h2, h3, h4, h5, h6')
    ).toHaveLength(0);
  });
});
