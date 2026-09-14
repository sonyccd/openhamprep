import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Zap, Brain, Target, MapPin } from 'lucide-react';
import { DashboardNextSteps, NextStep } from './DashboardNextSteps';
import { muiWrapper } from '@/test/utils/testWrappers';

describe('DashboardNextSteps', () => {
  const createStep = (overrides: Partial<NextStep> = {}): NextStep => ({
    id: 'test-step',
    title: 'Test Step',
    description: 'Test description',
    icon: Brain,
    onClick: vi.fn(),
    variant: 'secondary',
    ...overrides,
  });

  it('renders nothing when steps array is empty', () => {
    const { container } = render(<DashboardNextSteps steps={[]} />, { wrapper: muiWrapper });
    expect(container.firstChild).toBeNull();
  });

  it('renders single step correctly', () => {
    const step = createStep({ title: 'Practice Questions' });
    render(<DashboardNextSteps steps={[step]} />, { wrapper: muiWrapper });

    expect(screen.getByText('Practice Questions')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders multiple steps', () => {
    const steps = [
      createStep({ id: '1', title: 'Step One', icon: Zap }),
      createStep({ id: '2', title: 'Step Two', icon: Target }),
      createStep({ id: '3', title: 'Step Three', icon: MapPin }),
    ];
    render(<DashboardNextSteps steps={steps} />, { wrapper: muiWrapper });

    expect(screen.getByText('Step One')).toBeInTheDocument();
    expect(screen.getByText('Step Two')).toBeInTheDocument();
    expect(screen.getByText('Step Three')).toBeInTheDocument();
  });

  it('calls onClick when step is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const step = createStep({ onClick: handleClick });

    render(<DashboardNextSteps steps={[step]} />, { wrapper: muiWrapper });
    await user.click(screen.getByText('Test Step'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('displays badge when provided', () => {
    const step = createStep({ badge: '12' });
    render(<DashboardNextSteps steps={[step]} />, { wrapper: muiWrapper });

    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('does not display badge when not provided', () => {
    const step = createStep({ badge: undefined });
    render(<DashboardNextSteps steps={[step]} />, { wrapper: muiWrapper });

    // Should only have title and description text
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
  });

  it('renders section header', () => {
    const step = createStep();
    render(<DashboardNextSteps steps={[step]} />, { wrapper: muiWrapper });

    expect(screen.getByText('What to do next')).toBeInTheDocument();
  });

});
