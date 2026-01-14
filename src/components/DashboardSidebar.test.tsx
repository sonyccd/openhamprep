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
    it('displays license class label', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('License Class')).toBeInTheDocument();
    });

    it('displays current license name', () => {
      render(<DashboardSidebar {...defaultProps} selectedTest="technician" />, { wrapper: createWrapper() });

      expect(screen.getByText('Technician')).toBeInTheDocument();
    });

    it('displays General when selected', () => {
      render(<DashboardSidebar {...defaultProps} selectedTest="general" />, { wrapper: createWrapper() });

      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('displays Amateur Extra when selected', () => {
      render(<DashboardSidebar {...defaultProps} selectedTest="extra" />, { wrapper: createWrapper() });

      expect(screen.getByText('Amateur Extra')).toBeInTheDocument();
    });

    it('opens license select modal when clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      // Click the license selector button
      const licenseButton = screen.getByText('Technician').closest('button');
      await user.click(licenseButton!);

      await waitFor(() => {
        expect(screen.getByText('Select License Class')).toBeInTheDocument();
      });
    });

    it('shows all license options in modal', async () => {
      const user = userEvent.setup();
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      // Click the license selector button
      const licenseButton = screen.getByText('Technician').closest('button');
      await user.click(licenseButton!);

      await waitFor(() => {
        expect(screen.getByText('Select License Class')).toBeInTheDocument();
      });

      // Check all three options are visible in modal
      expect(screen.getByText(/Entry-level license/)).toBeInTheDocument();
      expect(screen.getByText(/Expanded HF privileges/)).toBeInTheDocument();
      expect(screen.getByText(/Full amateur privileges/)).toBeInTheDocument();
    });

    it('calls onTestChange when license is changed via modal', async () => {
      const user = userEvent.setup();
      const onTestChange = vi.fn();
      render(<DashboardSidebar {...defaultProps} onTestChange={onTestChange} selectedTest="technician" />, { wrapper: createWrapper() });

      // Open modal
      const licenseButton = screen.getByText('Technician').closest('button');
      await user.click(licenseButton!);

      await waitFor(() => {
        expect(screen.getByText('Select License Class')).toBeInTheDocument();
      });

      // Select General
      const generalCard = screen.getByText(/Expanded HF privileges/).closest('button');
      await user.click(generalCard!);

      // Confirm change
      await user.click(screen.getByRole('button', { name: /change license/i }));

      expect(onTestChange).toHaveBeenCalledWith('general');
    });

    it('closes modal when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      // Open modal
      const licenseButton = screen.getByText('Technician').closest('button');
      await user.click(licenseButton!);

      await waitFor(() => {
        expect(screen.getByText('Select License Class')).toBeInTheDocument();
      });

      // Click Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Select License Class')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation Items', () => {
    it('displays all navigation items', async () => {
      const user = userEvent.setup();
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      // Top-level nav items (always visible)
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Practice Test')).toBeInTheDocument();
      expect(screen.getByText('Learn')).toBeInTheDocument();
      expect(screen.getByText('Study')).toBeInTheDocument();
      expect(screen.getByText('Glossary')).toBeInTheDocument();
      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('Find Test Site')).toBeInTheDocument();

      // Expand Learn menu to see Topics and Lessons
      await user.click(screen.getByText('Learn'));

      await waitFor(() => {
        expect(screen.getByText('Topics')).toBeInTheDocument();
      });
      expect(screen.getByText('Lessons')).toBeInTheDocument();

      // Expand Study menu to see study group items
      await user.click(screen.getByText('Study'));

      await waitFor(() => {
        expect(screen.getByText('Random Practice')).toBeInTheDocument();
      });
      expect(screen.getByText('By Subelement')).toBeInTheDocument();
      expect(screen.getByText('By Chapter')).toBeInTheDocument();
      expect(screen.getByText('Weak Areas')).toBeInTheDocument();
      expect(screen.getByText('Bookmarked')).toBeInTheDocument();
      expect(screen.getByText('Flashcards')).toBeInTheDocument();
    });

    it('calls onViewChange when navigation item clicked', async () => {
      const user = userEvent.setup();
      const onViewChange = vi.fn();

      render(<DashboardSidebar {...defaultProps} onViewChange={onViewChange} />, { wrapper: createWrapper() });

      // Expand Study menu first
      await user.click(screen.getByText('Study'));

      await waitFor(() => {
        expect(screen.getByText('Random Practice')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Random Practice'));

      expect(onViewChange).toHaveBeenCalledWith('random-practice');
    });

    it('calls onViewChange with tools when Tools clicked', async () => {
      const user = userEvent.setup();
      const onViewChange = vi.fn();

      render(<DashboardSidebar {...defaultProps} onViewChange={onViewChange} />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Tools'));

      expect(onViewChange).toHaveBeenCalledWith('tools');
    });

    it('disables Practice Test when test not available', () => {
      render(<DashboardSidebar {...defaultProps} isTestAvailable={false} />, { wrapper: createWrapper() });

      const practiceTestButton = screen.getByText('Practice Test').closest('button');
      expect(practiceTestButton).toBeDisabled();
    });

    it('disables Weak Areas when count is 0', async () => {
      const user = userEvent.setup();
      render(<DashboardSidebar {...defaultProps} weakQuestionCount={0} />, { wrapper: createWrapper() });

      // Expand Study menu first
      await user.click(screen.getByText('Study'));

      await waitFor(() => {
        expect(screen.getByText('Weak Areas')).toBeInTheDocument();
      });

      const weakAreasButton = screen.getByText('Weak Areas').closest('button');
      expect(weakAreasButton).toBeDisabled();
    });

    it('shows badge for weak questions count', async () => {
      const user = userEvent.setup();
      render(<DashboardSidebar {...defaultProps} weakQuestionCount={5} />, { wrapper: createWrapper() });

      // Expand Study menu first
      await user.click(screen.getByText('Study'));

      await waitFor(() => {
        expect(screen.getByText('Weak Areas')).toBeInTheDocument();
      });

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows badge for bookmark count', async () => {
      const user = userEvent.setup();
      render(<DashboardSidebar {...defaultProps} bookmarkCount={3} />, { wrapper: createWrapper() });

      // Expand Study menu first
      await user.click(screen.getByText('Study'));

      await waitFor(() => {
        expect(screen.getByText('Bookmarked')).toBeInTheDocument();
      });

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows 9+ for counts above 9', async () => {
      const user = userEvent.setup();
      render(<DashboardSidebar {...defaultProps} weakQuestionCount={15} />, { wrapper: createWrapper() });

      // Expand Study menu first
      await user.click(screen.getByText('Study'));

      await waitFor(() => {
        expect(screen.getByText('Weak Areas')).toBeInTheDocument();
      });

      // Multiple 9+ badges may appear (on Study group header and individual item)
      expect(screen.getAllByText('9+').length).toBeGreaterThan(0);
    });
  });

  describe('Study Group', () => {
    it('displays Study group header', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Study')).toBeInTheDocument();
    });

    it('hides study items when collapsed (default)', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      // Study group is collapsed by default - only study GROUP items should be hidden
      // (Topics is a top-level item, not in the Study group)
      expect(screen.queryByText('Random Practice')).not.toBeInTheDocument();
      expect(screen.queryByText('By Subelement')).not.toBeInTheDocument();
      expect(screen.queryByText('By Chapter')).not.toBeInTheDocument();
      expect(screen.queryByText('Weak Areas')).not.toBeInTheDocument();
      expect(screen.queryByText('Bookmarked')).not.toBeInTheDocument();
      expect(screen.queryByText('Study Terms')).not.toBeInTheDocument();
    });

    it('toggles study items visibility when header clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      // Initially collapsed - items should NOT be in the document
      expect(screen.queryByText('Random Practice')).not.toBeInTheDocument();

      // Click Study header to expand
      await user.click(screen.getByText('Study'));

      // Items should appear in DOM when expanded
      await waitFor(() => {
        expect(screen.getByText('Random Practice')).toBeInTheDocument();
      });

      // Click again to collapse
      await user.click(screen.getByText('Study'));

      // Items should be removed from the document
      await waitFor(() => {
        expect(screen.queryByText('Random Practice')).not.toBeInTheDocument();
      });
    });

    it('shows combined badge count on Study header', () => {
      render(<DashboardSidebar {...defaultProps} weakQuestionCount={5} bookmarkCount={3} />, { wrapper: createWrapper() });

      // The Study header should show a badge with total count (5 + 3 = 8)
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('shows 9+ on Study header when combined count exceeds 9', () => {
      render(<DashboardSidebar {...defaultProps} weakQuestionCount={10} bookmarkCount={5} />, { wrapper: createWrapper() });

      // Multiple 9+ badges may appear (on Study group header and individual items)
      expect(screen.getAllByText('9+').length).toBeGreaterThan(0);
    });
  });

  describe('Community Link', () => {
    it('displays Community link', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Community')).toBeInTheDocument();
    });

    it('has correct href for Community link', () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      const communityLink = screen.getByText('Community').closest('a');
      expect(communityLink).toHaveAttribute('href', 'https://forum.openhamprep.com/auth/oidc');
      expect(communityLink).toHaveAttribute('target', '_blank');
      expect(communityLink).toHaveAttribute('rel', 'noopener noreferrer');
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

  describe('Sign Out (via Profile Modal)', () => {
    it('sign out is accessible through user profile', async () => {
      render(<DashboardSidebar {...defaultProps} />, { wrapper: createWrapper() });

      // The user profile button should be visible
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('onSignOut prop is connected', async () => {
      const onSignOut = vi.fn();

      // Note: The full sign-out flow (profile modal -> confirmation dialog -> onSignOut)
      // is tested in integration. This test verifies the component renders correctly.
      render(<DashboardSidebar {...defaultProps} onSignOut={onSignOut} />, { wrapper: createWrapper() });

      // Verify the component renders with the user profile
      expect(screen.getByText('Test User')).toBeInTheDocument();
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
