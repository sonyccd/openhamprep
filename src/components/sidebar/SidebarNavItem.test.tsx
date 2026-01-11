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

  describe('External Links', () => {
    const externalItem = {
      id: 'forum',
      label: 'Forum',
      icon: BarChart3,
      external: 'https://forum.example.com',
    };

    it('renders as anchor tag for external links', () => {
      renderWithTooltip(
        <SidebarNavItem
          item={externalItem}
          isActive={false}
          showExpanded={true}
          onClick={vi.fn()}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://forum.example.com');
    });

    it('opens external links in new tab', () => {
      renderWithTooltip(
        <SidebarNavItem
          item={externalItem}
          isActive={false}
          showExpanded={true}
          onClick={vi.fn()}
        />
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('shows external link icon when expanded', () => {
      renderWithTooltip(
        <SidebarNavItem
          item={externalItem}
          isActive={false}
          showExpanded={true}
          onClick={vi.fn()}
        />
      );
      // Should have two SVGs: the item icon and the ExternalLink icon
      const link = screen.getByRole('link');
      const svgs = link.querySelectorAll('svg');
      expect(svgs.length).toBe(2);
    });

    it('hides label and external icon when collapsed', () => {
      renderWithTooltip(
        <SidebarNavItem
          item={externalItem}
          isActive={false}
          showExpanded={false}
          onClick={vi.fn()}
        />
      );
      expect(screen.queryByText('Forum')).not.toBeInTheDocument();
      // Should only have one SVG (the item icon) when collapsed
      const link = screen.getByRole('link');
      const svgs = link.querySelectorAll('svg');
      expect(svgs.length).toBe(1);
    });

    it('renders label for external links when expanded', () => {
      renderWithTooltip(
        <SidebarNavItem
          item={externalItem}
          isActive={false}
          showExpanded={true}
          onClick={vi.fn()}
        />
      );
      expect(screen.getByText('Forum')).toBeInTheDocument();
    });
  });

});
