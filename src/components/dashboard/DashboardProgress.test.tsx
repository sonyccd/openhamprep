import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardProgress } from './DashboardProgress';

describe('DashboardProgress', () => {
  const defaultProps = {
    thisWeekQuestions: 30,
    questionsGoal: 50,
    thisWeekTests: 1,
    testsGoal: 2,
    examDate: null,
    examLocation: undefined,
    onOpenGoalsModal: vi.fn(),
    onFindTestSite: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('shows "Set exam date" when no exam is scheduled', () => {
    render(<DashboardProgress {...defaultProps} examDate={null} />);
    expect(screen.getByText('Set exam date')).toBeInTheDocument();
  });

  it('calls onFindTestSite when "Set exam date" is clicked', () => {
    const handleFindTestSite = vi.fn();
    render(<DashboardProgress {...defaultProps} onFindTestSite={handleFindTestSite} />);

    fireEvent.click(screen.getByText('Set exam date'));
    expect(handleFindTestSite).toHaveBeenCalledTimes(1);
  });

  it('displays exam countdown when exam is scheduled', () => {
    render(
      <DashboardProgress
        {...defaultProps}
        examDate="2025-02-07"
        examLocation="Raleigh, NC"
      />
    );
    expect(screen.getByText('23 days')).toBeInTheDocument();
    expect(screen.getByText('Raleigh, NC')).toBeInTheDocument();
  });

  it('shows urgent countdown for exams within 7 days', () => {
    render(
      <DashboardProgress
        {...defaultProps}
        examDate="2025-01-20"
        examLocation="Durham, NC"
      />
    );
    expect(screen.getByText('5 days left')).toBeInTheDocument();
  });

  it('shows "Tomorrow!" for exam 1 day away', () => {
    render(
      <DashboardProgress
        {...defaultProps}
        examDate="2025-01-16"
        examLocation="Chapel Hill, NC"
      />
    );
    expect(screen.getByText('Tomorrow!')).toBeInTheDocument();
  });

  it('shows "Today!" for exam on current day', () => {
    render(
      <DashboardProgress
        {...defaultProps}
        examDate="2025-01-15"
        examLocation="Cary, NC"
      />
    );
    expect(screen.getByText('Today!')).toBeInTheDocument();
  });

  it('applies warning style for urgent countdown', () => {
    render(
      <DashboardProgress
        {...defaultProps}
        examDate="2025-01-20"
        examLocation="Durham, NC"
      />
    );
    const countdown = screen.getByText('5 days left');
    expect(countdown).toHaveClass('text-warning');
  });

  it('calls onFindTestSite when exam countdown is clicked', () => {
    const handleFindTestSite = vi.fn();
    render(
      <DashboardProgress
        {...defaultProps}
        examDate="2025-02-07"
        examLocation="Raleigh, NC"
        onFindTestSite={handleFindTestSite}
      />
    );

    fireEvent.click(screen.getByText('23 days'));
    expect(handleFindTestSite).toHaveBeenCalledTimes(1);
  });

  it('handles progress exceeding goal', () => {
    render(
      <DashboardProgress
        {...defaultProps}
        thisWeekQuestions={75}
        questionsGoal={50}
      />
    );
    // Should show actual count even if over goal
    expect(screen.getByText('75/50')).toBeInTheDocument();
  });
});
