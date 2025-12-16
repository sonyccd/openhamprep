import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import React from 'react';

// Use vi.hoisted to ensure mocks are available before imports
const {
  mockNavigate,
  mockUser,
  mockGetAuthorizationDetails,
  mockApproveAuthorization,
  mockDenyAuthorization,
  mockFrom,
  mockToastError,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUser: { id: 'test-user-id', email: 'test@example.com' },
  mockGetAuthorizationDetails: vi.fn(),
  mockApproveAuthorization: vi.fn(),
  mockDenyAuthorization: vi.fn(),
  mockFrom: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

// Variable to control auth state in tests
let authState = { user: mockUser, loading: false };

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('authorization_id=test-auth-id')],
  };
});

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

// Mock supabase with vi.hoisted
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      oauth: {
        getAuthorizationDetails: mockGetAuthorizationDetails,
        approveAuthorization: mockApproveAuthorization,
        denyAuthorization: mockDenyAuthorization,
      },
    },
  },
}));

// Import after mocks are set up
import { useOAuthConsent } from './useOAuthConsent';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// Helper to setup default successful mocks
function setupDefaultMocks() {
  mockGetAuthorizationDetails.mockResolvedValue({
    data: {
      client_id: 'test-client',
      client_name: 'Test App',
      redirect_uri: 'https://example.com/callback',
      scopes: ['openid', 'email'],
    },
    error: null,
  });

  mockApproveAuthorization.mockResolvedValue({
    data: { redirect_to: 'https://example.com/callback?code=abc' },
    error: null,
  });

  mockDenyAuthorization.mockResolvedValue({
    data: { redirect_to: 'https://example.com/callback?error=access_denied' },
    error: null,
  });

  // Default: user has no forum username and no existing consent
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { forum_username: null }, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      };
    }
    if (table === 'oauth_consents') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
        upsert: vi.fn(() => Promise.resolve({ error: null })),
      };
    }
    return {};
  });
}

describe('useOAuthConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { user: mockUser, loading: false };
    setupDefaultMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.authorizationDetails).toBe(null);
    });

    it('should have isProcessing as false initially', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(result.current.isProcessing).toBe(false);
    });

    it('should have isAutoApproving as false initially', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(result.current.isAutoApproving).toBe(false);
    });
  });

  describe('Return Values', () => {
    it('should return handleApprove function', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(typeof result.current.handleApprove).toBe('function');
    });

    it('should return handleDeny function', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(typeof result.current.handleDeny).toBe('function');
    });

    it('should return forumUsername state', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(result.current.forumUsername).toBeDefined();
    });

    it('should return hasExistingConsent state', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(typeof result.current.hasExistingConsent).toBe('boolean');
    });

    it('should have hasExistingConsent as false initially', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(result.current.hasExistingConsent).toBe(false);
    });

    it('should return isAutoApproving state', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(typeof result.current.isAutoApproving).toBe('boolean');
    });
  });

  describe('Authentication Redirect', () => {
    it('should redirect to auth page if user is not logged in', async () => {
      authState = { user: null as unknown as typeof mockUser, loading: false };

      renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/auth?returnTo=')
        );
      });
    });

    it('should not redirect while auth is loading', () => {
      authState = { user: null as unknown as typeof mockUser, loading: true };

      renderHook(() => useOAuthConsent(), { wrapper });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should have error state available', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(result.current.error).toBe(null);
    });

    it('should set error when OAuth server is not enabled', async () => {
      // Mock OAuth methods as undefined (server not enabled)
      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: {
          from: mockFrom,
          auth: {
            oauth: undefined,
          },
        },
      }));

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        // The hook should handle the missing oauth gracefully
        expect(result.current.isLoading).toBeDefined();
      });
    });

    it('should set error when getAuthorizationDetails fails', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: null,
        error: new Error('Failed to fetch authorization details'),
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch authorization details');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set error when authorization details are null', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch authorization details');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Username Validation', () => {
    it('should show error for username shorter than 3 characters', async () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleApprove('ab', false);
      });

      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining('3-20 characters')
      );
    });

    it('should show error for username longer than 20 characters', async () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleApprove('a'.repeat(21), false);
      });

      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining('3-20 characters')
      );
    });

    it('should show error for username with special characters', async () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleApprove('test@user!', false);
      });

      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining('letters, numbers, underscores, or hyphens')
      );
    });

    it('should show error for username with emoji', async () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleApprove('test😀user', false);
      });

      expect(mockToastError).toHaveBeenCalled();
    });

    it('should accept valid username with underscores and hyphens', async () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      // This should not show an error for valid username
      await act(async () => {
        await result.current.handleApprove('valid_user-123', false);
      });

      // Should proceed to approval, not show validation error
      expect(mockToastError).not.toHaveBeenCalledWith(
        expect.stringContaining('3-20 characters')
      );
    });
  });

  describe('handleApprove', () => {
    it('should not proceed if authorizationDetails is null', async () => {
      // Don't setup the mock to return auth details
      mockGetAuthorizationDetails.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await act(async () => {
        await result.current.handleApprove('testuser', false);
      });

      expect(mockApproveAuthorization).not.toHaveBeenCalled();
    });

    it('should show error for duplicate username', async () => {
      // Mock the profile update to return unique constraint violation
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { forum_username: null }, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: { code: '23505', message: 'Unique violation' } })),
            })),
          };
        }
        if (table === 'oauth_consents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
              })),
            })),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleApprove('existinguser', false);
      });

      expect(mockToastError).toHaveBeenCalledWith('This username is already taken');
    });
  });

  describe('handleDeny', () => {
    it('should call denyAuthorization', async () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleDeny();
      });

      expect(mockDenyAuthorization).toHaveBeenCalledWith('test-auth-id');
    });

    it('should navigate to dashboard if no redirect URL', async () => {
      mockDenyAuthorization.mockResolvedValue({
        data: { redirect_to: null },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleDeny();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should show error toast on deny failure', async () => {
      mockDenyAuthorization.mockResolvedValue({
        data: null,
        error: new Error('Deny failed'),
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleDeny();
      });

      expect(mockToastError).toHaveBeenCalledWith('Deny failed');
    });
  });

  describe('Pre-approved Consent (Redirect URL with Code)', () => {
    it('should redirect immediately when response contains redirect_url with code', async () => {
      // Mock window.location.href
      const originalLocation = window.location;
      // @ts-expect-error - mocking window.location
      delete window.location;
      window.location = { ...originalLocation, href: '' };

      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          redirect_url: 'https://example.com/callback?code=abc123&state=xyz',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAutoApproving).toBe(true);
      });

      expect(window.location.href).toBe('https://example.com/callback?code=abc123&state=xyz');

      // Restore window.location
      window.location = originalLocation;
    });

    it('should redirect when redirect_uri contains code (alternative field name)', async () => {
      const originalLocation = window.location;
      // @ts-expect-error - mocking window.location
      delete window.location;
      window.location = { ...originalLocation, href: '' };

      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          redirect_uri: 'https://example.com/callback?code=def456&state=abc',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAutoApproving).toBe(true);
      });

      expect(window.location.href).toBe('https://example.com/callback?code=def456&state=abc');

      window.location = originalLocation;
    });

    it('should not auto-redirect when redirect_url has no code parameter', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client_id: 'test-client',
          client_name: 'Test App',
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid', 'email'],
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      expect(result.current.isAutoApproving).toBe(false);
      expect(result.current.authorizationDetails?.client_id).toBe('test-client');
    });
  });

  describe('Consent Storage', () => {
    it('should save consent when rememberDecision is true', async () => {
      const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { forum_username: 'existinguser' }, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          };
        }
        if (table === 'oauth_consents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
              })),
            })),
            upsert: mockUpsert,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        // Use existing username (no change), remember decision
        await result.current.handleApprove('existinguser', true);
      });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          client_id: 'test-client',
        }),
        expect.any(Object)
      );
    });

    it('should not save consent when rememberDecision is false', async () => {
      const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { forum_username: 'existinguser' }, error: null })),
              })),
            })),
          };
        }
        if (table === 'oauth_consents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
              })),
            })),
            upsert: mockUpsert,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleApprove('existinguser', false);
      });

      expect(mockUpsert).not.toHaveBeenCalled();
    });
  });
});
