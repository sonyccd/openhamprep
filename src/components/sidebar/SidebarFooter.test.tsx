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
    onSignOutClick: vi.fn(),
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

  describe('Forum Link', () => {
    it('renders forum link', () => {
      renderWithTooltip(<SidebarFooter {...defaultProps} />);
      expect(screen.getByText('Forum')).toBeInTheDocument();
    });

    it('forum link opens in new tab', () => {
      renderWithTooltip(<SidebarFooter {...defaultProps} />);
      const link = screen.getByText('Forum').closest('a');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
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

  describe('Sign Out', () => {
    it('renders sign out button', () => {
      renderWithTooltip(<SidebarFooter {...defaultProps} />);
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('calls onSignOutClick when sign out is clicked', async () => {
      const user = userEvent.setup();
      const onSignOutClick = vi.fn();
      renderWithTooltip(
        <SidebarFooter {...defaultProps} onSignOutClick={onSignOutClick} />
      );

      const signOutButton = screen.getByText('Sign Out').closest('button');
      await user.click(signOutButton!);

      expect(onSignOutClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Collapsed State', () => {
    it('hides text labels when collapsed on desktop', () => {
      renderWithTooltip(
        <SidebarFooter {...defaultProps} isCollapsed={true} isMobile={false} />
      );
      // Text should not be visible in collapsed state
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });

    it('shows text labels when expanded', () => {
      renderWithTooltip(
        <SidebarFooter {...defaultProps} isCollapsed={false} isMobile={false} />
      );
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('shows text labels on mobile even if isCollapsed is true', () => {
      renderWithTooltip(
        <SidebarFooter {...defaultProps} isCollapsed={true} isMobile={true} />
      );
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });
});
