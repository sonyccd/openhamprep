import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarHeader } from './SidebarHeader';
import { TooltipProvider } from '@/components/ui/tooltip';

const renderWithTooltip = (component: React.ReactNode) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

describe('SidebarHeader', () => {
  const defaultProps = {
    isCollapsed: false,
    isMobile: false,
    onToggleCollapse: vi.fn(),
  };

  it('displays app name when expanded', () => {
    renderWithTooltip(<SidebarHeader {...defaultProps} />);
    expect(screen.getByText('Open Ham Prep')).toBeInTheDocument();
  });

  it('displays app name on mobile', () => {
    renderWithTooltip(<SidebarHeader {...defaultProps} isMobile={true} />);
    expect(screen.getByText('Open Ham Prep')).toBeInTheDocument();
  });

  it('hides app name when collapsed on desktop', () => {
    renderWithTooltip(
      <SidebarHeader {...defaultProps} isCollapsed={true} isMobile={false} />
    );
    expect(screen.queryByText('Open Ham Prep')).not.toBeInTheDocument();
  });

  it('renders collapse button on desktop', () => {
    renderWithTooltip(<SidebarHeader {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not render collapse button on mobile', () => {
    renderWithTooltip(<SidebarHeader {...defaultProps} isMobile={true} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onToggleCollapse when button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleCollapse = vi.fn();
    renderWithTooltip(
      <SidebarHeader {...defaultProps} onToggleCollapse={onToggleCollapse} />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('has correct aria-label when expanded', () => {
    renderWithTooltip(<SidebarHeader {...defaultProps} isCollapsed={false} />);
    expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
  });

  it('has correct aria-label when collapsed', () => {
    renderWithTooltip(<SidebarHeader {...defaultProps} isCollapsed={true} />);
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('has correct aria-expanded when expanded', () => {
    renderWithTooltip(<SidebarHeader {...defaultProps} isCollapsed={false} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('has correct aria-expanded when collapsed', () => {
    renderWithTooltip(<SidebarHeader {...defaultProps} isCollapsed={true} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
