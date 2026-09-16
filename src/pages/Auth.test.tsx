import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { muiTheme } from '@/theme/muiTheme';
import Auth from './Auth';

const mockNavigate = vi.fn();
const mockLocation = { hash: '', search: '', pathname: '/auth' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockAuthReturn = { signIn: mockSignIn, signUp: mockSignUp, user: null, loading: false };

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockAuthReturn }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('framer-motion', async () => {
  const { framerMotionMock } = await import('@/test/mocks/framerMotion');
  return framerMotionMock();
});

const mockResetPassword = vi.fn();
const mockOAuth = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => mockResetPassword(...args),
      signInWithOAuth: (...args: unknown[]) => mockOAuth(...args),
    },
  },
}));

vi.mock('@/lib/amplitude', () => ({ trackSignIn: vi.fn(), trackSignUp: vi.fn() }));

const renderAuth = () =>
  render(
    <MemoryRouter>
      <MuiThemeProvider theme={muiTheme} defaultMode="light" noSsr>
        <Auth />
      </MuiThemeProvider>
    </MemoryRouter>
  );

/**
 * A password input has no implicit role, so it has to be found by label — and
 * `required` makes MUI append an asterisk to the label's text. The asterisk
 * span is aria-hidden, so role+name queries still see a clean "Email", but
 * getByLabelText reads textContent and sees "Password *". Anchored regexes
 * keep "Password" from also matching "Confirm Password".
 */
const passwordField = () => screen.getByLabelText(/^Password/);
const confirmField = () => screen.getByLabelText(/^Confirm Password/);

const goToSignUp = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: /Don't have an account/ }));

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthReturn.user = null;
    mockAuthReturn.loading = false;
    mockLocation.hash = '';
    mockLocation.search = '';
    mockSignIn.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ error: null });
    mockResetPassword.mockResolvedValue({ error: null });
    mockOAuth.mockResolvedValue({ error: null });
  });

  describe('sign in', () => {
    it('opens on the sign-in form', () => {
      renderAuth();

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
      expect(passwordField()).toBeInTheDocument();
    });

    it('signs in with what was typed', async () => {
      const user = userEvent.setup();
      renderAuth();

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.type(passwordField(), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Sign In' }));

      await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('ham@example.com', 'secret123'));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('rewrites a credentials failure into something readable', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
      renderAuth();

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.type(passwordField(), 'wrongpass');
      await user.click(screen.getByRole('button', { name: 'Sign In' }));

      expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('passes any other failure through unchanged', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: { message: 'Service unavailable' } });
      renderAuth();

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.type(passwordField(), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Sign In' }));

      expect(await screen.findByText('Service unavailable')).toBeInTheDocument();
    });
  });

  /**
   * Both toggles were bare <button>s wrapping only an icon, with no
   * aria-label, so each announced as "button" and nothing else — and with two
   * on the sign-up form they were indistinguishable from one another.
   */
  describe('password visibility', () => {
    it('names the toggle, and says which state it is in', async () => {
      const user = userEvent.setup();
      renderAuth();

      const field = passwordField();
      expect(field).toHaveAttribute('type', 'password');

      const toggle = screen.getByRole('button', { name: 'Show password' });
      expect(toggle).toHaveAttribute('aria-pressed', 'false');

      await user.click(toggle);

      expect(field).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('tells the two toggles apart on the sign-up form', async () => {
      const user = userEvent.setup();
      renderAuth();
      await goToSignUp(user);

      expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Show confirm password' })).toBeInTheDocument();
    });

    it('reveals only the field its toggle belongs to', async () => {
      const user = userEvent.setup();
      renderAuth();
      await goToSignUp(user);

      await user.click(screen.getByRole('button', { name: 'Show confirm password' }));

      expect(confirmField()).toHaveAttribute('type', 'text');
      expect(passwordField()).toHaveAttribute('type', 'password');
    });
  });

  /**
   * Each message used to be a loose <p> under its input, with no aria-invalid
   * and nothing tying the two together.
   */
  describe('validation', () => {
    /**
     * "a@b" is chosen deliberately: the input is type="email" and required, so
     * the browser rejects anything obviously malformed before submit and zod
     * never runs. HTML5's check is laxer than zod's, which wants a real TLD —
     * "a@b" passes the browser and fails zod, so it is what actually exercises
     * this layer.
     */
    it('ties a bad email to its field', async () => {
      const user = userEvent.setup();
      renderAuth();

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'a@b');
      await user.type(passwordField(), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Sign In' }));

      const email = screen.getByRole('textbox', { name: 'Email' });
      expect(email).toHaveAttribute('aria-invalid', 'true');
      expect(email).toHaveAccessibleDescription('Please enter a valid email address');
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('ties a short password to its field', async () => {
      const user = userEvent.setup();
      renderAuth();

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.type(passwordField(), 'short');
      await user.click(screen.getByRole('button', { name: 'Sign In' }));

      expect(passwordField()).toHaveAccessibleDescription(
        'Password must be at least 6 characters'
      );
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('catches a mismatched confirmation on sign-up', async () => {
      const user = userEvent.setup();
      renderAuth();
      await goToSignUp(user);

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.type(passwordField(), 'secret123');
      await user.type(confirmField(), 'secret124');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(confirmField()).toHaveAccessibleDescription(
        'Passwords do not match'
      );
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('clears a field error once it is being retyped', async () => {
      const user = userEvent.setup();
      renderAuth();

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'a@b');
      await user.type(passwordField(), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Sign In' }));
      expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
        'aria-invalid',
        'true'
      );

      await user.type(screen.getByRole('textbox', { name: 'Email' }), '.example.com');

      expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
        'aria-invalid',
        'false'
      );
    });
  });

  describe('sign up', () => {
    it('offers the extra fields once switched', async () => {
      const user = userEvent.setup();
      renderAuth();
      await goToSignUp(user);

      expect(screen.getByRole('textbox', { name: 'Display Name (optional)' })).toBeInTheDocument();
      expect(confirmField()).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('sends the display name when one is given, and undefined when not', async () => {
      const user = userEvent.setup();
      renderAuth();
      await goToSignUp(user);

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.type(passwordField(), 'secret123');
      await user.type(confirmField(), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      await waitFor(() =>
        expect(mockSignUp).toHaveBeenCalledWith('ham@example.com', 'secret123', undefined)
      );
    });

    it('shows the confirmation screen after signing up', async () => {
      const user = userEvent.setup();
      renderAuth();
      await goToSignUp(user);

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.type(passwordField(), 'secret123');
      await user.type(confirmField(), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(await screen.findByRole('heading', { name: 'Check Your Email' })).toBeInTheDocument();
      expect(
        screen.getByText(/click the link to verify your account/)
      ).toBeInTheDocument();
    });

    it('names an existing account plainly', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: { message: 'User already registered' } });
      renderAuth();
      await goToSignUp(user);

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.type(passwordField(), 'secret123');
      await user.type(confirmField(), 'secret123');
      await user.click(screen.getByRole('button', { name: 'Create Account' }));

      expect(
        await screen.findByText('An account with this email already exists')
      ).toBeInTheDocument();
    });
  });

  describe('password reset', () => {
    const openReset = async (user: ReturnType<typeof userEvent.setup>) => {
      renderAuth();
      await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    };

    it('asks for an address and sends the link', async () => {
      const user = userEvent.setup();
      await openReset(user);

      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

      await waitFor(() =>
        expect(mockResetPassword).toHaveBeenCalledWith('ham@example.com', expect.anything())
      );
      expect(await screen.findByRole('heading', { name: 'Check Your Email' })).toBeInTheDocument();
    });

    it('refuses to send to an invalid address', async () => {
      const user = userEvent.setup();
      await openReset(user);

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'a@b');
      await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

      expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
        'Please enter a valid email address'
      );
      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    /** Backing out of the form keeps the address, so it carries to sign-in. */
    it('keeps the typed address when backing out of the form', async () => {
      const user = userEvent.setup();
      await openReset(user);

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.click(screen.getByRole('button', { name: 'Back to Sign In' }));

      expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('ham@example.com');
    });

    /** Backing out of the sent screen clears it — that request is already away. */
    it('clears the address when backing out of the sent screen', async () => {
      const user = userEvent.setup();
      await openReset(user);

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));
      await screen.findByRole('heading', { name: 'Check Your Email' });
      await user.click(screen.getByRole('button', { name: 'Back to Sign In' }));

      expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('');
    });

    it('surfaces a send failure', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({ error: new Error('rate limited') });
      await openReset(user);

      await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ham@example.com');
      await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

      expect(await screen.findByText('rate limited')).toBeInTheDocument();
    });
  });

  describe('other ways in', () => {
    it('starts the Google flow', async () => {
      const user = userEvent.setup();
      renderAuth();

      await user.click(screen.getByRole('button', { name: /Continue with Google/ }));

      await waitFor(() =>
        expect(mockOAuth).toHaveBeenCalledWith(
          expect.objectContaining({ provider: 'google' })
        )
      );
    });

    it('lets a guest through to the dashboard', async () => {
      const user = userEvent.setup();
      renderAuth();

      await user.click(screen.getByRole('button', { name: /Continue as guest/ }));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('returning from elsewhere', () => {
    it('sends an already-signed-in user home', () => {
      mockAuthReturn.user = { id: 'u1' } as never;
      renderAuth();

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    /** returnTo carries the OAuth consent flow back where it started. */
    it('honours returnTo over the home page', () => {
      mockAuthReturn.user = { id: 'u1' } as never;
      mockLocation.search = '?returnTo=%2Foauth%2Fconsent';
      renderAuth();

      expect(mockNavigate).toHaveBeenCalledWith('/oauth/consent');
    });

    it('names the loading indicator while auth resolves', () => {
      mockAuthReturn.loading = true;
      renderAuth();

      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('confirms a verified email', () => {
      mockLocation.hash = '#access_token=abc&type=signup';
      renderAuth();

      expect(screen.getByText(/Your email has been verified/)).toBeInTheDocument();
    });

    it('reports a failed verification', () => {
      mockLocation.hash = '#error=expired&error_description=Link%20has%20expired';
      renderAuth();

      expect(screen.getByText('Link has expired')).toBeInTheDocument();
    });
  });
});
