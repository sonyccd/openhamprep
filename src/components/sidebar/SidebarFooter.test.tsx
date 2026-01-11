import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarFooter } from './SidebarFooter';
import { TooltipProvider } from '@/components/ui/tooltip';

const renderWithTooltip = (component: React.ReactNode) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

describe('SidebarFooter', () => {
  const defaultProps = {
    userInfo: {
      displayName: 'John Doe',
      email: 'john@example.com',
      forumUsername: 'johndoe',
    },
    isAdmin: false,
    isOnAdminPage: false,
    isCollapsed: false,
    isMobile: false,
    onProfileClick: vi.fn(),
    onAdminClick: vi.fn(),
  };

  describe('User Profile Section', () => {
    it('displays user display name', () => {
      renderWithTooltip(<SidebarFooter {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays user email', () => {
      renderWithTooltip(<SidebarFooter {...defaultProps} />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('displays initials from display name', () => {
      renderWithTooltip(<SidebarFooter {...defaultProps} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('displays initial from email when no display name', () => {
      renderWithTooltip(
        <SidebarFooter
          {...defaultProps}
          userInfo={{ displayName: null, email: 'john@example.com', forumUsername: null }}
        />
      );
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('displays U when no user info', () => {
      renderWithTooltip(
        <SidebarFooter
          {...defaultProps}
          userInfo={{ displayName: null, email: null, forumUsername: null }}
        />
      );
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('displays "User" when no display name', () => {
      renderWithTooltip(
        <SidebarFooter
          {...defaultProps}
          userInfo={{ displayName: null, email: 'john@example.com', forumUsername: null }}
        />
      );
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('calls onProfileClick when profile is clicked', async () => {
      const user = userEvent.setup();
      const onProfileClick = vi.fn();
      renderWithTooltip(
        <SidebarFooter {...defaultProps} onProfileClick={onProfileClick} />
      );

      const profileButton = screen.getByText('John Doe').closest('button');
      await user.click(profileButton!);

      expect(onProfileClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Admin Link', () => {
    it('shows admin link when user is admin', () => {
      renderWithTooltip(<SidebarFooter {...defaultProps} isAdmin={true} />);
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('hides admin link when user is not admin', () => {
      renderWithTooltip(<SidebarFooter {...defaultProps} isAdmin={false} />);
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('calls onAdminClick when admin button is clicked', async () => {
      const user = userEvent.setup();
      const onAdminClick = vi.fn();
      renderWithTooltip(
        <SidebarFooter {...defaultProps} isAdmin={true} onAdminClick={onAdminClick} />
      );

      const adminButton = screen.getByText('Admin').closest('button');
      await user.click(adminButton!);

      expect(onAdminClick).toHaveBeenCalledTimes(1);
    });

    it('applies active style when on admin page', () => {
      renderWithTooltip(
        <SidebarFooter {...defaultProps} isAdmin={true} isOnAdminPage={true} />
      );
      const button = screen.getByText('Admin').closest('button');
      expect(button?.className).toContain('text-primary');
      expect(button?.className).toContain('bg-primary/10');
    });
  });

  describe('Collapsed State', () => {
    it('hides text labels when collapsed on desktop', () => {
      renderWithTooltip(
        <SidebarFooter {...defaultProps} isCollapsed={true} isMobile={false} isAdmin={true} />
      );
      // Text should not be visible in collapsed state
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('shows text labels when expanded', () => {
      renderWithTooltip(
        <SidebarFooter {...defaultProps} isCollapsed={false} isMobile={false} isAdmin={true} />
      );
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('shows text labels on mobile even if isCollapsed is true', () => {
      renderWithTooltip(
        <SidebarFooter {...defaultProps} isCollapsed={true} isMobile={true} isAdmin={true} />
      );
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });
});
