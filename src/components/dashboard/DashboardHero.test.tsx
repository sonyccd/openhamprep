import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Target, Zap, Brain, CheckCircle } from 'lucide-react';
import { DashboardHero } from './DashboardHero';
import { muiWrapper } from '@/test/utils/testWrappers';

describe('DashboardHero', () => {
  const defaultProps = {
    readinessLevel: 'getting-close' as const,
    readinessTitle: 'Almost Ready!',
    readinessMessage: 'Your recent scores show improvement.',
    recentAvgScore: 78,
    nextAction: {
      title: 'Take Practice Test',
      description: 'Test your knowledge',
      actionLabel: 'Start Practice Test',
      icon: Target,
      priority: 'practice' as const,
    },
    onAction: vi.fn(),
  };

  /**
   * The readiness level reaches sighted users as the ring's colour, which a
   * screen reader cannot see, so it has to be in the announced value too.
   */
  it('announces the score as a named meter carrying the readiness level', () => {
    render(<DashboardHero {...defaultProps} />, { wrapper: muiWrapper });

    const meter = screen.getByRole('meter');
    expect(meter).toHaveAccessibleName('Exam readiness');
    expect(meter).toHaveAttribute('aria-valuenow', '78');
    expect(meter).toHaveAttribute('aria-valuetext', '78% — Almost Ready!');
  });

  it('shows the question mark instead of a meter before any score exists', () => {
    render(
      <DashboardHero {...defaultProps} readinessLevel="not-started" recentAvgScore={0} />,
      { wrapper: muiWrapper }
    );

    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders readiness title and message', () => {
    render(<DashboardHero {...defaultProps} />, { wrapper: muiWrapper });
    expect(screen.getByText('Almost Ready!')).toBeInTheDocument();
    expect(screen.getByText('Your recent scores show improvement.')).toBeInTheDocument();
  });

  it('displays the score percentage', () => {
    render(<DashboardHero {...defaultProps} />, { wrapper: muiWrapper });
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('renders the action button with correct label', () => {
    render(<DashboardHero {...defaultProps} />, { wrapper: muiWrapper });
    expect(screen.getByRole('button', { name: /start practice test/i })).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    render(<DashboardHero {...defaultProps} onAction={handleAction} />, { wrapper: muiWrapper });

    await user.click(screen.getByRole('button'));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('shows dashed circle for not-started state', () => {
    render(<DashboardHero
        {...defaultProps}
        readinessLevel="not-started"
        recentAvgScore={0}
      />, { wrapper: muiWrapper });
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows the ready message for the ready state', () => {
    render(<DashboardHero
        {...defaultProps}
        readinessLevel="ready"
        readinessTitle="Ready to Pass!"
        recentAvgScore={92}
        nextAction={{
          ...defaultProps.nextAction,
          icon: CheckCircle,
          priority: 'ready',
        }}
      />, { wrapper: muiWrapper });
    expect(screen.getByText('Ready to Pass!')).toBeInTheDocument();
  });

  it('shows the practice message for the needs-work state', () => {
    render(<DashboardHero
        {...defaultProps}
        readinessLevel="needs-work"
        readinessTitle="Keep Practicing"
        recentAvgScore={55}
        nextAction={{
          ...defaultProps.nextAction,
          icon: Zap,
          priority: 'weak',
        }}
      />, { wrapper: muiWrapper });
    expect(screen.getByText('Keep Practicing')).toBeInTheDocument();
  });

  it('shows the almost-ready message for the getting-close state', () => {
    render(<DashboardHero {...defaultProps} />, { wrapper: muiWrapper });
    expect(screen.getByText('Almost Ready!')).toBeInTheDocument();
  });

  it('renders different icons based on nextAction', () => {
    const { rerender } = render(<DashboardHero {...defaultProps} />, { wrapper: muiWrapper });

    // Should render without crashing with different icons
    rerender(<DashboardHero
        {...defaultProps}
        nextAction={{
          ...defaultProps.nextAction,
          icon: Brain,
          actionLabel: 'Random Practice',
        }}
      />);
    expect(screen.getByRole('button', { name: /random practice/i })).toBeInTheDocument();
  });
});
