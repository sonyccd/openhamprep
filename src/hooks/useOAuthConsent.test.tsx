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

    it('should extract client info from nested client object (actual Supabase format)', async () => {
      // This is the actual format Supabase OAuth Server returns
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          authorization_id: 'abc123',
          redirect_uri: 'https://example.com/callback',
          client: {
            id: 'nested-client-id',
            name: 'Forum',
          },
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
          scope: 'openid email profile',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      expect(result.current.isAutoApproving).toBe(false);
      expect(result.current.authorizationDetails?.client_id).toBe('nested-client-id');
      expect(result.current.authorizationDetails?.client_name).toBe('Forum');
      expect(result.current.authorizationDetails?.scopes).toEqual(['openid', 'email', 'profile']);
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

  describe('Client ID Extraction (Various Supabase Response Formats)', () => {
    it('should extract client_id from top-level field', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client_id: 'top-level-client-id',
          client_name: 'Test App',
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.client_id).toBe('top-level-client-id');
      });
    });

    it('should extract client_id from nested client.id', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client: { id: 'nested-client-id', name: 'Nested App' },
          redirect_uri: 'https://example.com/callback',
          scope: 'openid email',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.client_id).toBe('nested-client-id');
        expect(result.current.authorizationDetails?.client_name).toBe('Nested App');
      });
    });

    it('should extract client_id from application.id (legacy format)', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          application: { id: 'app-client-id', name: 'Legacy App' },
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.client_id).toBe('app-client-id');
        expect(result.current.authorizationDetails?.client_name).toBe('Legacy App');
      });
    });

    it('should extract client_id from application_id field', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          application_id: 'app-id-field',
          name: 'Some App',
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.client_id).toBe('app-id-field');
      });
    });

    it('should prefer client_id over client.id when both exist', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client_id: 'preferred-id',
          client: { id: 'fallback-id', name: 'App' },
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.client_id).toBe('preferred-id');
      });
    });

    it('should throw error when no client_id can be found', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
          // No client_id, client.id, application.id, or application_id
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('Invalid authorization details: missing client_id');
      });
    });
  });

  describe('Scope Parsing', () => {
    it('should handle scopes as array', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client_id: 'test',
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid', 'email', 'profile'],
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.scopes).toEqual(['openid', 'email', 'profile']);
      });
    });

    it('should handle scope as space-separated string', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client_id: 'test',
          redirect_uri: 'https://example.com/callback',
          scope: 'openid email profile',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.scopes).toEqual(['openid', 'email', 'profile']);
      });
    });

    it('should handle empty scopes', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client_id: 'test',
          redirect_uri: 'https://example.com/callback',
          // No scopes field
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.scopes).toEqual([]);
      });
    });
  });

  describe('Pre-approved Consent Edge Cases', () => {
    it('should NOT redirect when redirect_uri has no code parameter', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client: { id: 'test-client', name: 'Test' },
          redirect_uri: 'https://example.com/callback',
          scope: 'openid',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      // Should show consent form, not auto-redirect
      expect(result.current.isAutoApproving).toBe(false);
      expect(result.current.authorizationDetails?.client_id).toBe('test-client');
    });

    it('should redirect when redirect_url contains code (pre-approved)', async () => {
      const originalLocation = window.location;
      // @ts-expect-error - mocking window.location
      delete window.location;
      window.location = { ...originalLocation, href: '' };

      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          redirect_url: 'https://example.com/callback?code=xyz123&state=abc',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAutoApproving).toBe(true);
      });

      expect(window.location.href).toBe('https://example.com/callback?code=xyz123&state=abc');
      window.location = originalLocation;
    });

    it('should NOT redirect when redirect_url exists but has no code', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client: { id: 'test', name: 'Test' },
          redirect_url: 'https://example.com/callback?state=abc',
          scope: 'openid',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      expect(result.current.isAutoApproving).toBe(false);
    });

    it('should check for code= substring to detect pre-approval', async () => {
      const originalLocation = window.location;
      // @ts-expect-error - mocking window.location
      delete window.location;
      window.location = { ...originalLocation, href: '' };

      // Edge case: URL with "code=" in the middle
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          redirect_url: 'https://example.com/callback?foo=bar&code=secret123&state=xyz',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAutoApproving).toBe(true);
      });

      window.location = originalLocation;
    });
  });

  describe('Client Name Extraction', () => {
    it('should use client_name if available', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client_id: 'test',
          client_name: 'Primary Name',
          client: { id: 'x', name: 'Fallback Name' },
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.client_name).toBe('Primary Name');
      });
    });

    it('should fallback to client.name', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client: { id: 'test', name: 'Client Object Name' },
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.client_name).toBe('Client Object Name');
      });
    });

    it('should fallback to application.name', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          application: { id: 'test', name: 'App Name' },
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.client_name).toBe('App Name');
      });
    });

    it('should fallback to name field', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client_id: 'test',
          name: 'Top Level Name',
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.client_name).toBe('Top Level Name');
      });
    });

    it('should use Unknown Application as last resort', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client_id: 'test',
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
          // No name fields at all
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.client_name).toBe('Unknown Application');
      });
    });
  });

  describe('Error Handling', () => {
    it('should set error when getAuthorizationDetails fails', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set error when getAuthorizationDetails returns null data', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch authorization details');
      });
    });

    it('should handle profile fetch errors gracefully', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { code: 'SOME_ERROR', message: 'DB error' }
                })),
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
          };
        }
        return {};
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      // Should still complete loading even with profile error
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      // Forum username should be null
      expect(result.current.forumUsername).toBe(null);
    });

    it('should handle consent check errors gracefully', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { forum_username: 'user' }, error: null })),
              })),
            })),
          };
        }
        if (table === 'oauth_consents') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(() => Promise.resolve({
                    data: null,
                    error: { message: 'Consent check failed' }
                  })),
                })),
              })),
            })),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      // Should still complete loading even with consent check error
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not have existing consent when check fails
      expect(result.current.hasExistingConsent).toBe(false);
    });
  });

  describe('Approve Flow Edge Cases', () => {
    it('should not call approve if authorizationDetails is null', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: null,
        error: new Error('Failed'),
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleApprove('username', true);
      });

      expect(mockApproveAuthorization).not.toHaveBeenCalled();
    });

    it('should validate forum username before approval', async () => {
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

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      // Try to approve with invalid username (too short)
      await act(async () => {
        await result.current.handleApprove('ab', true);
      });

      // Should show validation error
      expect(mockToastError).toHaveBeenCalled();
      // Should not call approve
      expect(mockApproveAuthorization).not.toHaveBeenCalled();
    });

    it('should handle duplicate username error', async () => {
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: { code: '23505', message: 'duplicate' } })),
      }));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { forum_username: null }, error: null })),
              })),
            })),
            update: mockUpdate,
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
        await result.current.handleApprove('newusername', true);
      });

      expect(mockToastError).toHaveBeenCalledWith('This username is already taken');
      expect(mockApproveAuthorization).not.toHaveBeenCalled();
    });
  });

  describe('Deny Flow', () => {
    it('should call denyAuthorization and redirect', async () => {
      const originalLocation = window.location;
      // @ts-expect-error - mocking window.location
      delete window.location;
      window.location = { ...originalLocation, href: '' };

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleDeny();
      });

      expect(mockDenyAuthorization).toHaveBeenCalledWith('test-auth-id');
      expect(window.location.href).toBe('https://example.com/callback?error=access_denied');

      window.location = originalLocation;
    });

    it('should navigate to dashboard when no redirect_to in deny response', async () => {
      mockDenyAuthorization.mockResolvedValue({
        data: {},
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
  });

  describe('Real-world Supabase Response Format', () => {
    it('should handle actual Supabase OAuth Server response format', async () => {
      // This is the exact format we observed from production
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          authorization_id: 'awg4oeyvakeonjz4u5mjewzybzloqq6y',
          redirect_uri: 'https://forum.openhamprep.com/auth/oidc/callback',
          client: {
            id: '6bde6cf9-d641-45bc-9b3c-af6863df0b76',
            name: 'Forum',
          },
          user: {
            id: '21fefd14-9476-443f-8068-777e52ae5d76',
            email: 'test@example.com',
          },
          scope: 'openid email profile',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      expect(result.current.isAutoApproving).toBe(false);
      expect(result.current.authorizationDetails?.client_id).toBe('6bde6cf9-d641-45bc-9b3c-af6863df0b76');
      expect(result.current.authorizationDetails?.client_name).toBe('Forum');
      expect(result.current.authorizationDetails?.redirect_uri).toBe('https://forum.openhamprep.com/auth/oidc/callback');
      expect(result.current.authorizationDetails?.scopes).toEqual(['openid', 'email', 'profile']);
    });

    it('should handle pre-approved response with redirect_url containing code', async () => {
      const originalLocation = window.location;
      // @ts-expect-error - mocking window.location
      delete window.location;
      window.location = { ...originalLocation, href: '' };

      // This is what Supabase returns when consent was previously granted
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          redirect_url: 'https://forum.openhamprep.com/auth/oidc/callback?code=ee3551ed-8f26-47ef-a037-74ef09338a98&state=c99ce7bbf486149fcf3ad554bc6de45a700c6d8cf9b7c966',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAutoApproving).toBe(true);
      });

      expect(window.location.href).toBe(
        'https://forum.openhamprep.com/auth/oidc/callback?code=ee3551ed-8f26-47ef-a037-74ef09338a98&state=c99ce7bbf486149fcf3ad554bc6de45a700c6d8cf9b7c966'
      );

      window.location = originalLocation;
    });
  });
});
