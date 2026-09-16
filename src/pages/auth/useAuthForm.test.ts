import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAuthForm } from './useAuthForm';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signIn: mockSignIn, signUp: mockSignUp }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/amplitude', () => ({ trackSignIn: vi.fn(), trackSignUp: vi.fn() }));

const mockResetPassword = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => mockResetPassword(...args),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.FormEvent;

const setUp = (returnTo: string | null = null) => {
  const navigate = vi.fn();
  const view = renderHook(() => useAuthForm({ returnTo, navigate }));
  return { ...view, navigate };
};

/**
 * Exercised directly as well as through the page, so the rules stay pinned if
 * CredentialsForm or ResetPasswordForm are rearranged later.
 */
describe('useAuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ error: null });
    mockResetPassword.mockResolvedValue({ error: null });
  });

  describe('validation', () => {
    it('rejects an address the browser would let through', async () => {
      const { result } = setUp();

      // "a@b" satisfies type="email"; zod wants a real TLD.
      act(() => result.current.setEmail('a@b'));
      act(() => result.current.setPassword('secret123'));
      await act(async () => result.current.submit(submitEvent()));

      expect(result.current.errors.email).toBe('Please enter a valid email address');
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('requires six characters of password', async () => {
      const { result } = setUp();

      act(() => result.current.setEmail('ham@example.com'));
      act(() => result.current.setPassword('short'));
      await act(async () => result.current.submit(submitEvent()));

      expect(result.current.errors.password).toBe('Password must be at least 6 characters');
    });

    it('checks the confirmation only when signing up', async () => {
      const { result } = setUp();

      act(() => result.current.setEmail('ham@example.com'));
      act(() => result.current.setPassword('secret123'));
      act(() => result.current.setConfirmPassword('different'));

      // Signing in: the confirmation field is not on screen and does not apply.
      await act(async () => result.current.submit(submitEvent()));
      expect(result.current.errors.confirmPassword).toBeUndefined();

      act(() => result.current.toggleMode());
      await act(async () => result.current.submit(submitEvent()));
      expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
    });

    it('reports every problem at once rather than one at a time', async () => {
      const { result } = setUp();

      act(() => result.current.setEmail('a@b'));
      act(() => result.current.setPassword('x'));
      await act(async () => result.current.submit(submitEvent()));

      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.password).toBeDefined();
    });

    it('clears one field without disturbing the others', async () => {
      const { result } = setUp();

      act(() => result.current.setEmail('a@b'));
      act(() => result.current.setPassword('x'));
      await act(async () => result.current.submit(submitEvent()));

      act(() => result.current.clearError('email'));

      expect(result.current.errors.email).toBeUndefined();
      expect(result.current.errors.password).toBeDefined();
    });
  });

  describe('sign in', () => {
    it('goes home on success', async () => {
      const { result, navigate } = setUp();

      act(() => result.current.setEmail('ham@example.com'));
      act(() => result.current.setPassword('secret123'));
      await act(async () => result.current.submit(submitEvent()));

      expect(navigate).toHaveBeenCalledWith('/');
    });

    /** returnTo brings the OAuth consent flow back where it started. */
    it('honours returnTo over home', async () => {
      const { result, navigate } = setUp('/oauth/consent?x=1');

      act(() => result.current.setEmail('ham@example.com'));
      act(() => result.current.setPassword('secret123'));
      await act(async () => result.current.submit(submitEvent()));

      expect(navigate).toHaveBeenCalledWith('/oauth/consent?x=1');
    });

    it('rewrites only the credentials failure', async () => {
      const { result } = setUp();
      mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });

      act(() => result.current.setEmail('ham@example.com'));
      act(() => result.current.setPassword('secret123'));
      await act(async () => result.current.submit(submitEvent()));

      expect(result.current.formError).toBe('Invalid email or password');
    });

    it('stops submitting even when the call fails', async () => {
      const { result } = setUp();
      mockSignIn.mockRejectedValue(new Error('network'));

      act(() => result.current.setEmail('ham@example.com'));
      act(() => result.current.setPassword('secret123'));
      await act(async () => result.current.submit(submitEvent()).catch(() => {}));

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('sign up', () => {
    const fillSignUp = (result: { current: ReturnType<typeof useAuthForm> }) => {
      act(() => result.current.toggleMode());
      act(() => result.current.setEmail('ham@example.com'));
      act(() => result.current.setPassword('secret123'));
      act(() => result.current.setConfirmPassword('secret123'));
    };

    it('sends undefined rather than an empty display name', async () => {
      const { result } = setUp();
      fillSignUp(result);

      await act(async () => result.current.submit(submitEvent()));

      expect(mockSignUp).toHaveBeenCalledWith('ham@example.com', 'secret123', undefined);
    });

    it('sends a display name when one was given', async () => {
      const { result } = setUp();
      fillSignUp(result);
      act(() => result.current.setDisplayName('Brad'));

      await act(async () => result.current.submit(submitEvent()));

      expect(mockSignUp).toHaveBeenCalledWith('ham@example.com', 'secret123', 'Brad');
    });

    it('shows the confirmation screen rather than navigating away', async () => {
      const { result, navigate } = setUp();
      fillSignUp(result);

      await act(async () => result.current.submit(submitEvent()));

      expect(result.current.showEmailConfirmation).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('leaving a screen', () => {
    /** Backing out of the reset form keeps the address; the sent screen clears it. */
    it('keeps the address from the form and drops it from the sent screen', async () => {
      const { result } = setUp();

      act(() => result.current.openForgotPassword());
      act(() => result.current.setEmail('ham@example.com'));
      act(() => result.current.backToSignInFromResetForm());
      expect(result.current.email).toBe('ham@example.com');

      act(() => result.current.openForgotPassword());
      await act(async () => result.current.submitForgotPassword(submitEvent()));
      expect(result.current.forgotPasswordSent).toBe(true);

      act(() => result.current.backToSignInFromResetSent());
      expect(result.current.email).toBe('');
      expect(result.current.forgotPasswordSent).toBe(false);
    });

    it('drops the passwords when returning from the signup confirmation', async () => {
      const { result } = setUp();

      act(() => result.current.toggleMode());
      act(() => result.current.setPassword('secret123'));
      act(() => result.current.setConfirmPassword('secret123'));
      act(() => result.current.backToSignInFromConfirmation());

      expect(result.current.password).toBe('');
      expect(result.current.confirmPassword).toBe('');
      expect(result.current.isLogin).toBe(true);
    });

    it('clears errors when switching between sign in and sign up', async () => {
      const { result } = setUp();

      act(() => result.current.setEmail('a@b'));
      act(() => result.current.setPassword('x'));
      await act(async () => result.current.submit(submitEvent()));
      expect(result.current.errors.email).toBeDefined();

      act(() => result.current.toggleMode());

      expect(result.current.errors).toEqual({});
      expect(result.current.formError).toBeNull();
    });
  });
});
