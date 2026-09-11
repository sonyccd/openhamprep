import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import Auth from './Auth';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      hash: '',
      search: '',
      pathname: '/auth',
    }),
  };
});

// Mock useAuth
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockAuthReturn = {
  signIn: mockSignIn,
  signUp: mockSignUp,
  user: null,
  loading: false,
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthReturn,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

const renderAuth = () => {
  return render(
    <MemoryRouter>
      <TooltipProvider>
        <Auth />
      </TooltipProvider>
    </MemoryRouter>
  );
};

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth mock to default (no user)
    Object.assign(mockAuthReturn, {
      signIn: mockSignIn,
      signUp: mockSignUp,
      user: null,
      loading: false,
    });
  });

  describe('Rendering', () => {
    it('renders the auth page', () => {
      renderAuth();

      expect(screen.getByText('Open Ham Prep')).toBeInTheDocument();
    });

    it('displays login form by default', () => {
      renderAuth();

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it('has email input field', () => {
      renderAuth();

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('has password input field', () => {
      renderAuth();

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('displays forgot password link', () => {
      renderAuth();

      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('displays sign up link', () => {
      renderAuth();

      expect(screen.getByText(/don.*t have an account/i)).toBeInTheDocument();
    });
  });

  describe('Authentication redirect', () => {
    it('redirects to home when user is already logged in', () => {
      mockAuthReturn.user = { id: 'test-user', email: 'test@example.com' };

      renderAuth();

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner when auth is loading', () => {
      mockAuthReturn.loading = true;

      renderAuth();

      // When loading, a spinner is shown instead of the full page
      const spinner = screen.queryByRole('status', { name: /loading/i });
      expect(spinner).toBeInTheDocument();
    });
  });
});
