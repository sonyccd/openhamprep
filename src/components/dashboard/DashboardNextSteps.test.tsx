import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Zap, Brain, Target, MapPin } from 'lucide-react';
import { DashboardNextSteps, NextStep } from './DashboardNextSteps';

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
    const { container } = render(<DashboardNextSteps steps={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders single step correctly', () => {
    const step = createStep({ title: 'Practice Questions' });
    render(<DashboardNextSteps steps={[step]} />);

    expect(screen.getByText('Practice Questions')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders multiple steps', () => {
    const steps = [
      createStep({ id: '1', title: 'Step One', icon: Zap }),
      createStep({ id: '2', title: 'Step Two', icon: Target }),
      createStep({ id: '3', title: 'Step Three', icon: MapPin }),
    ];
    render(<DashboardNextSteps steps={steps} />);

    expect(screen.getByText('Step One')).toBeInTheDocument();
    expect(screen.getByText('Step Two')).toBeInTheDocument();
    expect(screen.getByText('Step Three')).toBeInTheDocument();
  });

  it('calls onClick when step is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const step = createStep({ onClick: handleClick });

    render(<DashboardNextSteps steps={[step]} />);
    await user.click(screen.getByText('Test Step'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('displays badge when provided', () => {
    const step = createStep({ badge: '12' });
    render(<DashboardNextSteps steps={[step]} />);

    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('does not display badge when not provided', () => {
    const step = createStep({ badge: undefined });
    render(<DashboardNextSteps steps={[step]} />);

    // Should only have title and description text
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
  });

  it('applies warning variant styles', () => {
    const step = createStep({ variant: 'warning', icon: Zap });
    const { container } = render(<DashboardNextSteps steps={[step]} />);

    const iconContainer = container.querySelector('.bg-warning\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('applies primary variant styles', () => {
    const step = createStep({ variant: 'primary', icon: Target });
    const { container } = render(<DashboardNextSteps steps={[step]} />);

    const iconContainer = container.querySelector('.bg-primary\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('applies secondary variant styles', () => {
    const step = createStep({ variant: 'secondary' });
    const { container } = render(<DashboardNextSteps steps={[step]} />);

    const iconContainer = container.querySelector('.bg-secondary');
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders section header', () => {
    const step = createStep();
    render(<DashboardNextSteps steps={[step]} />);

    expect(screen.getByText('What to do next')).toBeInTheDocument();
  });

  it('truncates long descriptions', () => {
    const step = createStep({
      description: 'This is a very long description that should be truncated after two lines',
    });
    const { container } = render(<DashboardNextSteps steps={[step]} />);

    const description = container.querySelector('.line-clamp-2');
    expect(description).toBeInTheDocument();
  });

  it('applies correct grid columns for 1 step', () => {
    const step = createStep();
    const { container } = render(<DashboardNextSteps steps={[step]} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
  });

  it('applies correct grid columns for 2 steps', () => {
    const steps = [
      createStep({ id: '1' }),
      createStep({ id: '2' }),
    ];
    const { container } = render(<DashboardNextSteps steps={steps} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('sm:grid-cols-2');
  });

  it('applies correct grid columns for 3 steps', () => {
    const steps = [
      createStep({ id: '1' }),
      createStep({ id: '2' }),
      createStep({ id: '3' }),
    ];
    const { container } = render(<DashboardNextSteps steps={steps} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });
});
