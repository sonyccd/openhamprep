import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from './useAuth';

// Mock supabase
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockSetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: () => mockSignOut(),
      getSession: () => mockGetSession(),
      setSession: (...args: unknown[]) => mockSetSession(...args),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => mockOnAuthStateChange(callback),
    },
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    // Clear window.location.hash
    Object.defineProperty(window, 'location', {
      value: { hash: '', pathname: '/' },
      writable: true,
    });
  });

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('AuthProvider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    it('provides user as null initially', async () => {
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBe(null);
    });

    it('provides loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading should be true
      expect(typeof result.current.loading).toBe('boolean');
    });

    it('provides signUp function', async () => {
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.signUp).toBe('function');
    });

    it('provides signIn function', async () => {
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.signIn).toBe('function');
    });

    it('provides signOut function', async () => {
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.signOut).toBe('function');
    });

    it('provides session', async () => {
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toBe(null);
    });
  });

  describe('signUp', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    it('calls supabase signUp with email and password', async () => {
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      mockSignUp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123');
      });

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
        })
      );
    });

    it('passes display name in options', async () => {
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      mockSignUp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'Test User');
      });

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: expect.objectContaining({
              display_name: 'Test User',
            }),
          }),
        })
      );
    });

    it('returns error when signup fails', async () => {
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      const signupError = new Error('Signup failed');
      mockSignUp.mockResolvedValue({ error: signupError });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123');
      });

      expect(signUpResult).toEqual({ error: signupError });
    });
  });

  describe('signIn', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    it('calls supabase signInWithPassword', async () => {
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      mockSignInWithPassword.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('returns error when signin fails', async () => {
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      const signinError = new Error('Invalid credentials');
      mockSignInWithPassword.mockResolvedValue({ error: signinError });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrong');
      });

      expect(signInResult).toEqual({ error: signinError });
    });
  });

  describe('signOut', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    it('calls supabase signOut', async () => {
      mockOnAuthStateChange.mockImplementation((callback) => {
        callback('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
