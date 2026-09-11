import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Target, Zap, Brain, CheckCircle } from 'lucide-react';
import { DashboardHero } from './DashboardHero';

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

  it('renders readiness title and message', () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText('Almost Ready!')).toBeInTheDocument();
    expect(screen.getByText('Your recent scores show improvement.')).toBeInTheDocument();
  });

  it('displays the score percentage', () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('renders the action button with correct label', () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByRole('button', { name: /start practice test/i })).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    render(<DashboardHero {...defaultProps} onAction={handleAction} />);

    await user.click(screen.getByRole('button'));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('shows dashed circle for not-started state', () => {
    render(
      <DashboardHero
        {...defaultProps}
        readinessLevel="not-started"
        recentAvgScore={0}
      />
    );
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows the ready message for the ready state', () => {
    render(
      <DashboardHero
        {...defaultProps}
        readinessLevel="ready"
        readinessTitle="Ready to Pass!"
        recentAvgScore={92}
        nextAction={{
          ...defaultProps.nextAction,
          icon: CheckCircle,
          priority: 'ready',
        }}
      />
    );
    expect(screen.getByText('Ready to Pass!')).toBeInTheDocument();
  });

  it('shows the practice message for the needs-work state', () => {
    render(
      <DashboardHero
        {...defaultProps}
        readinessLevel="needs-work"
        readinessTitle="Keep Practicing"
        recentAvgScore={55}
        nextAction={{
          ...defaultProps.nextAction,
          icon: Zap,
          priority: 'weak',
        }}
      />
    );
    expect(screen.getByText('Keep Practicing')).toBeInTheDocument();
  });

  it('shows the almost-ready message for the getting-close state', () => {
    render(<DashboardHero {...defaultProps} />);
    expect(screen.getByText('Almost Ready!')).toBeInTheDocument();
  });

  it('renders different icons based on nextAction', () => {
    const { rerender } = render(<DashboardHero {...defaultProps} />);

    // Should render without crashing with different icons
    rerender(
      <DashboardHero
        {...defaultProps}
        nextAction={{
          ...defaultProps.nextAction,
          icon: Brain,
          actionLabel: 'Random Practice',
        }}
      />
    );
    expect(screen.getByRole('button', { name: /random practice/i })).toBeInTheDocument();
  });
});
