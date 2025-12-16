import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Use vi.hoisted to ensure mocks are available before imports
const { mockNavigate, mockUser } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUser: { id: 'test-user-id', email: 'test@example.com' },
}));

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
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock supabase with vi.hoisted
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { forum_username: 'testuser' }, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    auth: {
      oauth: {
        getAuthorizationDetails: vi.fn(() => Promise.resolve({
          data: {
            client_id: 'test-client',
            client_name: 'Test App',
            redirect_uri: 'https://example.com/callback',
            scopes: ['openid', 'email'],
          },
          error: null,
        })),
        approveAuthorization: vi.fn(() => Promise.resolve({
          data: { redirect_to: 'https://example.com/callback?code=abc' },
          error: null,
        })),
        denyAuthorization: vi.fn(() => Promise.resolve({
          data: { redirect_to: 'https://example.com/callback?error=access_denied' },
          error: null,
        })),
      },
    },
  },
}));

// Import after mocks are set up
import { useOAuthConsent } from './useOAuthConsent';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useOAuthConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  describe('Error Handling', () => {
    it('should have error state available', () => {
      const { result } = renderHook(() => useOAuthConsent(), { wrapper });

      // Error is null initially
      expect(result.current.error).toBe(null);
    });
  });
});
