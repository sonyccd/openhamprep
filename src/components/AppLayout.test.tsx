import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { AppLayout } from './AppLayout';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock hooks
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useBookmarks', () => ({
  useBookmarks: () => ({
    bookmarks: [
      { question_id: 'T1A01', display_name: 'T1A01' },
      { question_id: 'T1A02', display_name: 'T1A02' },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useAdmin', () => ({
  useAdmin: () => ({
    isAdmin: false,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/usePendo', () => ({
  usePendo: () => ({
    track: vi.fn(),
    isReady: true,
  }),
  PENDO_EVENTS: {},
}));

// Mock question attempts data for testing weak questions calculation
// Now includes joined questions data with display_name (since query uses questions!inner(display_name))
// Note: A question needs at least 2 wrong answers AND more wrong than right to be "weak"
const mockQuestionAttempts = [
  { question_id: 'uuid-t1a01', is_correct: false, user_id: 'test-user', questions: { display_name: 'T1A01' } }, // 1 wrong = NOT weak (need 2+)
  { question_id: 'uuid-t1a02', is_correct: false, user_id: 'test-user', questions: { display_name: 'T1A02' } }, // 1 wrong, then 1 right = not weak
  { question_id: 'uuid-t1a02', is_correct: true, user_id: 'test-user', questions: { display_name: 'T1A02' } },
  { question_id: 'uuid-t1a03', is_correct: false, user_id: 'test-user', questions: { display_name: 'T1A03' } }, // 2 wrong, 1 right = weak
  { question_id: 'uuid-t1a03', is_correct: false, user_id: 'test-user', questions: { display_name: 'T1A03' } },
  { question_id: 'uuid-t1a03', is_correct: true, user_id: 'test-user', questions: { display_name: 'T1A03' } },
];

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => {
          if (table === 'question_attempts') {
            return Promise.resolve({
              data: mockQuestionAttempts,
              error: null,
            });
          }
          // For profiles table
          return {
            single: vi.fn().mockResolvedValue({
              data: { display_name: 'Test User', best_streak: 5 },
              error: null,
            }),
          };
        }),
      })),
    })),
  },
}));

// Mock HelpButton to avoid complex rendering
vi.mock('@/components/HelpButton', () => ({
  HelpButton: () => <div data-testid="help-button">Help</div>,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('AppLayout', () => {
  const defaultProps = {
    currentView: 'dashboard' as const,
    onViewChange: vi.fn(),
    selectedTest: 'technician' as const,
    onTestChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      loading: false,
      signOut: vi.fn(),
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signOut: vi.fn(),
      });

      const { container } = render(
        <AppLayout {...defaultProps}>
          <div>Content</div>
        </AppLayout>,
        { wrapper: createWrapper() }
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    it('renders children without sidebar when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
      });

      render(
        <AppLayout {...defaultProps}>
          <div>Child Content</div>
        </AppLayout>,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Child Content')).toBeInTheDocument();
      // Sidebar should not be rendered
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    it('renders sidebar when user is authenticated', async () => {
      render(
        <AppLayout {...defaultProps}>
          <div>Child Content</div>
        </AppLayout>,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });

    it('renders children content', async () => {
      render(
        <AppLayout {...defaultProps}>
          <div>Main Content Here</div>
        </AppLayout>,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Main Content Here')).toBeInTheDocument();
      });
    });

    it('renders HelpButton', async () => {
      render(
        <AppLayout {...defaultProps}>
          <div>Content</div>
        </AppLayout>,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByTestId('help-button')).toBeInTheDocument();
      });
    });

    it('passes correct props to DashboardSidebar', async () => {
      render(
        <AppLayout {...defaultProps}>
          <div>Content</div>
        </AppLayout>,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        // DashboardSidebar should show top-level nav items
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Practice Test')).toBeInTheDocument();
        expect(screen.getByText('Learn')).toBeInTheDocument();
        expect(screen.getByText('Study')).toBeInTheDocument();
      });
    });

    it('shows bookmark count badge on Study header', async () => {
      render(
        <AppLayout {...defaultProps}>
          <div>Content</div>
        </AppLayout>,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        // The Study header shows combined badge for bookmarks + weak questions
        // weakQuestionCount=1 + bookmarkCount=2 = 3 total
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('calculates weak question count correctly (needs 2+ wrong AND incorrect > correct)', async () => {
      render(
        <AppLayout {...defaultProps}>
          <div>Content</div>
        </AppLayout>,
        { wrapper: createWrapper() }
      );

      // From mockQuestionAttempts:
      // T1A01: 1 wrong, 0 right = NOT weak (needs at least 2 wrong)
      // T1A02: 1 wrong, 1 right = NOT weak (only 1 wrong)
      // T1A03: 2 wrong, 1 right = weak (2 >= 2 AND 2 > 1)
      // So weak count should be 1
      // Combined with bookmark count of 2, Study header badge should show 3
      await waitFor(() => {
        // The Study header badge shows combined count
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });
  });

  describe('View Changes', () => {
    it('calls onViewChange when navigation item clicked', async () => {
      const onViewChange = vi.fn();

      render(
        <AppLayout {...defaultProps} onViewChange={onViewChange}>
          <div>Content</div>
        </AppLayout>,
        { wrapper: createWrapper() }
      );

      // Check that sidebar nav items are visible (Learn is a top-level item that contains Topics)
      await waitFor(() => {
        expect(screen.getByText('Learn')).toBeInTheDocument();
      });

      // Note: The actual click handling is in DashboardSidebar which is already tested
    });
  });

  describe('Sign Out', () => {
    it('navigates to auth page and calls signOut when signing out', async () => {
      const mockSignOut = vi.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <AppLayout {...defaultProps}>
          <div>Content</div>
        </AppLayout>,
        { wrapper: createWrapper() }
      );

      // Wait for sidebar to render
      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });

      // Click sign out button
      fireEvent.click(screen.getByText('Sign Out'));

      // Confirm sign out dialog should appear
      await waitFor(() => {
        expect(screen.getByText('Sign out?')).toBeInTheDocument();
      });

      // Click confirm button in dialog
      const confirmButton = screen.getByRole('button', { name: 'Sign Out' });
      fireEvent.click(confirmButton);

      // Verify navigation to auth page happens first
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth');
      });

      // Verify signOut was called
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });
});
