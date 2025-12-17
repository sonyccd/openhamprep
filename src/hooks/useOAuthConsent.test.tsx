import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Use vi.hoisted to ensure mocks are available before imports
const {
  mockNavigate,
  mockUser,
  mockGetAuthorizationDetails,
  mockApproveAuthorization,
  mockFrom,
  mockToastError,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUser: { id: 'test-user-id', email: 'test@example.com' },
  mockGetAuthorizationDetails: vi.fn(),
  mockApproveAuthorization: vi.fn(),
  mockFrom: vi.fn(),
  mockToastError: vi.fn(),
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

  // Default: user has no forum username
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

    it('should return handleCancel function', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(typeof result.current.handleCancel).toBe('function');
    });

    it('should return forumUsername state', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      expect(result.current.forumUsername).toBeDefined();
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

  describe('Auto-approve with existing forum username', () => {
    it('should auto-approve when user has existing forum username', async () => {
      const originalLocation = window.location;
      // @ts-expect-error - mocking window.location
      delete window.location;
      window.location = { ...originalLocation, href: '' };

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
        return {};
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAutoApproving).toBe(true);
      });

      expect(mockApproveAuthorization).toHaveBeenCalledWith('test-auth-id');

      window.location = originalLocation;
    });

    it('should show username form when user has no forum username', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { forum_username: null }, error: null })),
              })),
            })),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAutoApproving).toBe(false);
      expect(result.current.authorizationDetails).not.toBe(null);
    });
  });

  describe('Error Handling', () => {
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

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleApprove('ab');
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
        await result.current.handleApprove('a'.repeat(21));
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
        await result.current.handleApprove('test@user!');
      });

      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining('letters, numbers, underscores, or hyphens')
      );
    });

    it('should accept valid username with underscores and hyphens', async () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleApprove('valid_user-123');
      });

      // Should proceed to approval, not show validation error
      expect(mockToastError).not.toHaveBeenCalledWith(
        expect.stringContaining('3-20 characters')
      );
    });
  });

  describe('handleApprove', () => {
    it('should not proceed if authorizationDetails is null', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await act(async () => {
        await result.current.handleApprove('testuser');
      });

      expect(mockApproveAuthorization).not.toHaveBeenCalled();
    });

    it('should show error for duplicate username', async () => {
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
        return {};
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      await act(async () => {
        await result.current.handleApprove('existinguser');
      });

      expect(mockToastError).toHaveBeenCalledWith('This username is already taken');
    });

    it('should show generic error for non-unique constraint database errors', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { forum_username: null }, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: { code: 'PGRST001', message: 'Network error' } })),
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
        await result.current.handleApprove('testuser');
      });

      expect(mockToastError).toHaveBeenCalledWith('Failed to save forum username');
      expect(mockApproveAuthorization).not.toHaveBeenCalled();
    });
  });

  describe('handleCancel', () => {
    it('should navigate to dashboard', async () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails).not.toBe(null);
      });

      act(() => {
        result.current.handleCancel();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Pre-approved Consent (Redirect URL with Code)', () => {
    it('should redirect immediately when response contains redirect_url with code', async () => {
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

    it('should throw error when no client_id can be found', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
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

    it('should use Unknown Application as last resort', async () => {
      mockGetAuthorizationDetails.mockResolvedValue({
        data: {
          client_id: 'test',
          redirect_uri: 'https://example.com/callback',
          scopes: ['openid'],
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      await waitFor(() => {
        expect(result.current.authorizationDetails?.client_name).toBe('Unknown Application');
      });
    });
  });

  describe('Real-world Supabase Response Format', () => {
    it('should handle actual Supabase OAuth Server response format', async () => {
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
