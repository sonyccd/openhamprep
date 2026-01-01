import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarNavItem } from './SidebarNavItem';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BarChart3 } from 'lucide-react';

const renderWithTooltip = (component: React.ReactNode) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

describe('SidebarNavItem', () => {
  const defaultProps = {
    item: {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: BarChart3,
    },
    isActive: false,
    showExpanded: true,
    onClick: vi.fn(),
  };

  it('renders item label when expanded', () => {
    renderWithTooltip(<SidebarNavItem {...defaultProps} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('does not render label text when collapsed', () => {
    renderWithTooltip(<SidebarNavItem {...defaultProps} showExpanded={false} />);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders icon', () => {
    renderWithTooltip(<SidebarNavItem {...defaultProps} />);
    // Icon should be rendered (check for SVG)
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithTooltip(<SidebarNavItem {...defaultProps} onClick={onClick} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies active styles when isActive is true', () => {
    renderWithTooltip(<SidebarNavItem {...defaultProps} isActive={true} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-primary/10');
    expect(button.className).toContain('text-primary');
  });

  it('applies inactive styles when isActive is false', () => {
    renderWithTooltip(<SidebarNavItem {...defaultProps} isActive={false} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('text-muted-foreground');
  });

  it('is disabled when item.disabled is true', () => {
    renderWithTooltip(
      <SidebarNavItem
        {...defaultProps}
        item={{ ...defaultProps.item, disabled: true }}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('applies disabled styles when item is disabled', () => {
    renderWithTooltip(
      <SidebarNavItem
        {...defaultProps}
        item={{ ...defaultProps.item, disabled: true }}
      />
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('opacity-50');
    expect(button.className).toContain('cursor-not-allowed');
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithTooltip(
      <SidebarNavItem
        {...defaultProps}
        item={{ ...defaultProps.item, disabled: true }}
        onClick={onClick}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

});
