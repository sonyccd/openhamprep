import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardProgress } from './DashboardProgress';
import { muiWrapper } from '@/test/utils/testWrappers';

describe('DashboardProgress', () => {
  const defaultProps = {
    thisWeekQuestions: 30,
    questionsGoal: 50,
    thisWeekTests: 1,
    testsGoal: 2,
    onOpenGoalsModal: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * The bars were bare divs before the port and announced nothing. They are
   * MUI LinearProgress now, so the count reaches assistive tech as a real
   * progressbar — aria-valuenow is normalised to 0-100, so the human reading
   * lives in aria-valuetext.
   */
  describe('progress bar semantics', () => {
    it('exposes each goal as a named progressbar', () => {
      render(<DashboardProgress {...defaultProps} />, { wrapper: muiWrapper });

      const [questions, tests] = screen.getAllByRole('progressbar');

      expect(questions).toHaveAccessibleName('Questions');
      expect(questions).toHaveAttribute('aria-valuetext', '30 of 50');
      expect(tests).toHaveAccessibleName('Practice Tests');
      expect(tests).toHaveAttribute('aria-valuetext', '1 of 2');
    });

    it('reports the percentage, not the raw count, as the value', () => {
      render(<DashboardProgress {...defaultProps} />, { wrapper: muiWrapper });

      const [questions] = screen.getAllByRole('progressbar');

      // 30 of 50 is 60%, and aria-valuemax stays at LinearProgress's 100.
      expect(questions).toHaveAttribute('aria-valuenow', '60');
    });

    it('caps the bar at 100% when the goal is exceeded', () => {
      render(
        <DashboardProgress {...defaultProps} thisWeekQuestions={80} questionsGoal={50} />,
        { wrapper: muiWrapper }
      );

      const [questions] = screen.getAllByRole('progressbar');

      expect(questions).toHaveAttribute('aria-valuenow', '100');
      // The text still tells the truth about the overshoot.
      expect(questions).toHaveAttribute('aria-valuetext', '80 of 50');
    });
  });

  it('renders weekly progress section', () => {
    render(<DashboardProgress {...defaultProps} />, { wrapper: muiWrapper });
    expect(screen.getByText('This Week')).toBeInTheDocument();
  });

  it('displays questions progress', () => {
    render(<DashboardProgress {...defaultProps} />, { wrapper: muiWrapper });
    expect(screen.getByText('Questions')).toBeInTheDocument();
    expect(screen.getByText('30/50')).toBeInTheDocument();
  });

  it('displays tests progress', () => {
    render(<DashboardProgress {...defaultProps} />, { wrapper: muiWrapper });
    expect(screen.getByText('Practice Tests')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('shows the questions count when the goal is reached', () => {
    render(<DashboardProgress
        {...defaultProps}
        thisWeekQuestions={50}
        questionsGoal={50}
      />, { wrapper: muiWrapper });
    expect(screen.getByText('50/50')).toBeInTheDocument();
  });

  it('shows the tests count when the goal is reached', () => {
    render(<DashboardProgress
        {...defaultProps}
        thisWeekTests={2}
        testsGoal={2}
      />, { wrapper: muiWrapper });
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });

  it('calls onOpenGoalsModal when settings button is clicked', () => {
    const handleOpenGoals = vi.fn();
    render(<DashboardProgress {...defaultProps} onOpenGoalsModal={handleOpenGoals} />, { wrapper: muiWrapper });

    fireEvent.click(screen.getByRole('button', { name: /edit weekly goals/i }));
    expect(handleOpenGoals).toHaveBeenCalledTimes(1);
  });

  it('handles progress exceeding goal', () => {
    render(<DashboardProgress
        {...defaultProps}
        thisWeekQuestions={75}
        questionsGoal={50}
      />, { wrapper: muiWrapper });
    expect(screen.getByText('75/50')).toBeInTheDocument();
  });
});
