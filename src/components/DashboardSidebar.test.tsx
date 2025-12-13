import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock hooks
vi.mock('@/hooks/useAdmin', () => ({
  useAdmin: vi.fn(() => ({
    isAdmin: false,
    isLoading: false,
  })),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('DashboardSidebar', () => {
  const defaultProps = {
    currentView: 'dashboard' as const,
    onViewChange: vi.fn(),
    onSignOut: vi.fn(),
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    weakQuestionCount: 5,
    bookmarkCount: 3,
    isTestAvailable: true,
    userInfo: {
      displayName: 'Test User',
      email: 'test@example.com',
    },
    userId: 'test-user-id',
    onProfileUpdate: vi.fn(),
    selectedTest: 'technician' as const,
    onTestChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header', () => {
    it('displays the app name when expanded', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Open Ham Prep')).toBeInTheDocument();
    });

    it('hides the app name when collapsed', () => {
      render(<DashboardSidebar {...defaultProps} isCollapsed={true} />, { wrapper: createWrapper() });

      // In collapsed mode, the app name should not be visible in desktop view
      // The mobile view still shows it
      const appNames = screen.queryAllByText('Open Ham Prep');
      // Only the mobile version should be present (inside Sheet)
      expect(appNames.length).toBeLessThanOrEqual(1);
    });

    it('displays collapse/expand button', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
    });

    it('calls onToggleCollapse when collapse button clicked', async () => {
      const user = userEvent.setup();
      const onToggleCollapse = vi.fn();

      render(<DashboardSidebar {...defaultProps} onToggleCollapse={onToggleCollapse} />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /collapse sidebar/i }));

      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });
  });

  describe('License Class Selector', () => {
    it('displays license class selector', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('License Class')).toBeInTheDocument();
    });
  });

  describe('Navigation Items', () => {
    it('displays all navigation items', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Practice Test')).toBeInTheDocument();
      expect(screen.getByText('Random Practice')).toBeInTheDocument();
      expect(screen.getByText('Study by Topic')).toBeInTheDocument();
      expect(screen.getByText('Weak Areas')).toBeInTheDocument();
      expect(screen.getByText('Bookmarked')).toBeInTheDocument();
      expect(screen.getByText('Glossary')).toBeInTheDocument();
      expect(screen.getByText('Find Test Site')).toBeInTheDocument();
      expect(screen.getByText('Forum')).toBeInTheDocument();
    });

    it('calls onViewChange when navigation item clicked', async () => {
      const user = userEvent.setup();
      const onViewChange = vi.fn();

      render(<DashboardSidebar {...defaultProps} onViewChange={onViewChange} />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Random Practice'));

      expect(onViewChange).toHaveBeenCalledWith('random-practice');
    });

    it('disables Practice Test when test not available', () => {
      render(<DashboardSidebar {...defaultProps} isTestAvailable={false} />, { wrapper: createWrapper() });

      const practiceTestButton = screen.getByText('Practice Test').closest('button');
      expect(practiceTestButton).toBeDisabled();
    });

    it('disables Weak Areas when count is 0', () => {
      render(<DashboardSidebar {...defaultProps} weakQuestionCount={0} />, { wrapper: createWrapper() });

      const weakAreasButton = screen.getByText('Weak Areas').closest('button');
      expect(weakAreasButton).toBeDisabled();
    });

    it('shows badge for weak questions count', () => {
      render(<DashboardSidebar {...defaultProps} weakQuestionCount={5} />, { wrapper: createWrapper() });

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows badge for bookmark count', () => {
      render(<DashboardSidebar {...defaultProps} bookmarkCount={3} />, { wrapper: createWrapper() });

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows 9+ for counts above 9', () => {
      render(<DashboardSidebar {...defaultProps} weakQuestionCount={15} />, { wrapper: createWrapper() });

      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  describe('Forum Link', () => {
    it('displays Forum link', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Forum')).toBeInTheDocument();
    });

    it('has correct href for Forum link', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      const forumLink = screen.getByText('Forum').closest('a');
      expect(forumLink).toHaveAttribute('href', 'https://forum.openhamprep.com/');
      expect(forumLink).toHaveAttribute('target', '_blank');
      expect(forumLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('User Profile', () => {
    it('displays user display name', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('displays user email', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays initials in avatar', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('TU')).toBeInTheDocument(); // Test User initials
    });

    it('uses email initial when no display name', () => {
      render(
        <DashboardSidebar
          {...defaultProps}
          userInfo={{ displayName: null, email: 'test@example.com' }}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of email
    });

    it('uses U as fallback when no user info', () => {
      render(
        <DashboardSidebar
          {...defaultProps}
          userInfo={{ displayName: null, email: null }}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('U')).toBeInTheDocument(); // Fallback
    });
  });

  describe('Sign Out', () => {
    it('displays sign out button', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('opens confirmation dialog when sign out clicked', async () => {
      const user = userEvent.setup();

      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(screen.getByText('Sign out?')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to sign out of your account?')).toBeInTheDocument();
      });
    });

    it('calls onSignOut when confirmed', async () => {
      const user = userEvent.setup();
      const onSignOut = vi.fn();

      render(<DashboardSidebar {...defaultProps} onSignOut={onSignOut} />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(screen.getByText('Sign out?')).toBeInTheDocument();
      });

      // Click the Sign Out button in the dialog (not the nav item)
      const dialogButtons = screen.getAllByRole('button', { name: /sign out/i });
      await user.click(dialogButtons[dialogButtons.length - 1]); // Last one is the confirmation

      expect(onSignOut).toHaveBeenCalledTimes(1);
    });

    it('does not call onSignOut when cancelled', async () => {
      const user = userEvent.setup();
      const onSignOut = vi.fn();

      render(<DashboardSidebar {...defaultProps} onSignOut={onSignOut} />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(screen.getByText('Sign out?')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onSignOut).not.toHaveBeenCalled();
    });
  });

  describe('Admin Link', () => {
    it('does not show admin link for non-admin users', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('shows admin link for admin users', async () => {
      const { useAdmin } = await import('@/hooks/useAdmin');
      vi.mocked(useAdmin).mockReturnValue({ isAdmin: true, isLoading: false });

      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  describe('Collapsed State', () => {
    it('shows expand button when collapsed', () => {
      render(<DashboardSidebar {...defaultProps} isCollapsed={true} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
    });
  });
});
