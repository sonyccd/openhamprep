import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardProgress } from './DashboardProgress';

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

  it('renders weekly progress section', () => {
    render(<DashboardProgress {...defaultProps} />);
    expect(screen.getByText('This Week')).toBeInTheDocument();
  });

  it('displays questions progress', () => {
    render(<DashboardProgress {...defaultProps} />);
    expect(screen.getByText('Questions')).toBeInTheDocument();
    expect(screen.getByText('30/50')).toBeInTheDocument();
  });

  it('displays tests progress', () => {
    render(<DashboardProgress {...defaultProps} />);
    expect(screen.getByText('Practice Tests')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('shows success color when questions goal is reached', () => {
    render(
      <DashboardProgress
        {...defaultProps}
        thisWeekQuestions={50}
        questionsGoal={50}
      />
    );
    const progressText = screen.getByText('50/50');
    expect(progressText).toHaveClass('text-success');
  });

  it('shows success color when tests goal is reached', () => {
    render(
      <DashboardProgress
        {...defaultProps}
        thisWeekTests={2}
        testsGoal={2}
      />
    );
    const progressText = screen.getByText('2/2');
    expect(progressText).toHaveClass('text-success');
  });

  it('calls onOpenGoalsModal when settings button is clicked', () => {
    const handleOpenGoals = vi.fn();
    render(<DashboardProgress {...defaultProps} onOpenGoalsModal={handleOpenGoals} />);

    const settingsButtons = screen.getAllByRole('button');
    const settingsButton = settingsButtons.find(btn => btn.querySelector('svg'));
    fireEvent.click(settingsButton!);
    expect(handleOpenGoals).toHaveBeenCalledTimes(1);
  });

  it('handles progress exceeding goal', () => {
    render(
      <DashboardProgress
        {...defaultProps}
        thisWeekQuestions={75}
        questionsGoal={50}
      />
    );
    expect(screen.getByText('75/50')).toBeInTheDocument();
  });
});
