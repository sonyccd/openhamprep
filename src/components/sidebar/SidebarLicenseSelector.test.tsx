import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarLicenseSelector } from './SidebarLicenseSelector';
import { TooltipProvider } from '@/components/ui/tooltip';

const renderWithTooltip = (component: React.ReactNode) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

describe('SidebarLicenseSelector', () => {
  const defaultProps = {
    selectedTest: 'technician' as const,
    isCollapsed: false,
    isMobile: false,
    onOpenModal: vi.fn(),
  };

  it('displays license class label when expanded', () => {
    renderWithTooltip(<SidebarLicenseSelector {...defaultProps} />);
    expect(screen.getByText('License Class')).toBeInTheDocument();
  });

  it('displays technician test name when selected', () => {
    renderWithTooltip(<SidebarLicenseSelector {...defaultProps} selectedTest="technician" />);
    expect(screen.getByText('Technician')).toBeInTheDocument();
  });

  it('displays general test name when selected', () => {
    renderWithTooltip(<SidebarLicenseSelector {...defaultProps} selectedTest="general" />);
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('displays extra test name when selected', () => {
    renderWithTooltip(<SidebarLicenseSelector {...defaultProps} selectedTest="extra" />);
    expect(screen.getByText('Amateur Extra')).toBeInTheDocument();
  });

  it('calls onOpenModal when clicked (expanded)', async () => {
    const user = userEvent.setup();
    const onOpenModal = vi.fn();
    renderWithTooltip(
      <SidebarLicenseSelector {...defaultProps} onOpenModal={onOpenModal} />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onOpenModal).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenModal when clicked (collapsed)', async () => {
    const user = userEvent.setup();
    const onOpenModal = vi.fn();
    renderWithTooltip(
      <SidebarLicenseSelector
        {...defaultProps}
        isCollapsed={true}
        onOpenModal={onOpenModal}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onOpenModal).toHaveBeenCalledTimes(1);
  });

  it('does not show label when collapsed on desktop', () => {
    renderWithTooltip(
      <SidebarLicenseSelector {...defaultProps} isCollapsed={true} isMobile={false} />
    );
    expect(screen.queryByText('License Class')).not.toBeInTheDocument();
  });

  it('shows label on mobile even when collapsed', () => {
    renderWithTooltip(
      <SidebarLicenseSelector {...defaultProps} isCollapsed={true} isMobile={true} />
    );
    expect(screen.getByText('License Class')).toBeInTheDocument();
  });
});
