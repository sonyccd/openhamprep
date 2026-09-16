import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackSignIn, trackSignUp } from '@/lib/amplitude';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export interface AuthFieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface UseAuthFormOptions {
  /** Where to go after a successful sign-in, from the OAuth consent flow. */
  returnTo: string | null;
  navigate: (to: string) => void;
}

/**
 * Sign-in, sign-up and password-reset for the Auth page.
 *
 * Validation stays on zod, which the page already used and the project already
 * depends on. react-hook-form is deliberately not introduced: it is not a
 * dependency of this project, appears nowhere in src, and this migration is a
 * vendor *consolidation* — adding a form library for one page would cut against
 * that and leave two form idioms in the codebase.
 */
export function useAuthForm({ returnTo, navigate }: UseAuthFormOptions) {
  const { signIn, signUp } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  /** Typing in a field clears that field's complaint and the form-level one. */
  const clearError = (field: keyof AuthFieldErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const validate = (): AuthFieldErrors => {
    const next: AuthFieldErrors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) next.email = emailResult.error.errors[0].message;

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) next.password = passwordResult.error.errors[0].message;

    if (!isLogin && password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }

    return next;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setFormError(
            error.message.includes('Invalid login credentials')
              ? 'Invalid email or password'
              : error.message
          );
        } else {
          trackSignIn('email');
          toast.success('Welcome back!');
          navigate(returnTo || '/');
        }
      } else {
        const { error } = await signUp(email, password, displayName || undefined);
        if (error) {
          setFormError(
            error.message.includes('User already registered')
              ? 'An account with this email already exists'
              : error.message
          );
        } else {
          trackSignUp();
          setShowEmailConfirmation(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      if (error) throw error;
      setForgotPasswordSent(true);
    } catch (error: unknown) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to send password reset email'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Carry returnTo through the round trip, so an OAuth consent flow
      // resumes where it left off.
      const redirectTo = returnTo
        ? `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`
        : `${window.location.origin}/auth`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Failed to sign in with Google');
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setErrors({});
    setFormError(null);
  };

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setErrors({});
    setFormError(null);
  };

  /**
   * Backing out of the reset *form* keeps the typed address, so it carries
   * over to sign-in. Backing out of the *sent* screen clears it — the reset
   * is already on its way and the next thing shown is a fresh sign-in.
   */
  const backToSignInFromResetForm = () => {
    setShowForgotPassword(false);
    setErrors({});
    setFormError(null);
  };

  const backToSignInFromResetSent = () => {
    setShowForgotPassword(false);
    setForgotPasswordSent(false);
    setEmail('');
  };

  const backToSignInFromConfirmation = () => {
    setShowEmailConfirmation(false);
    setIsLogin(true);
    setPassword('');
    setConfirmPassword('');
  };

  return {
    isLogin,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    displayName,
    setDisplayName,
    isSubmitting,
    errors,
    formError,
    setFormError,
    showEmailConfirmation,
    showForgotPassword,
    forgotPasswordSent,
    clearError,
    submit,
    submitForgotPassword,
    signInWithGoogle,
    toggleMode,
    openForgotPassword,
    backToSignInFromResetForm,
    backToSignInFromResetSent,
    backToSignInFromConfirmation,
  };
}
