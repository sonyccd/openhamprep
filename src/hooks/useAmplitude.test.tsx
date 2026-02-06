import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// Ensure we test the real implementation, not the global mock from setup.ts
vi.unmock('@/hooks/useAmplitude');

// vi.hoisted runs before imports — set env var and create mock fns
const { mockSetUserId, mockReset, mockIdentify, MockIdentify } = vi.hoisted(() => {
  import.meta.env.VITE_AMPLITUDE_API_KEY = 'test-api-key';

  // Mock Identify class that records .set() calls
  class _MockIdentify {
    _properties: Record<string, unknown> = {};
    set(key: string, value: unknown) {
      this._properties[key] = value;
    }
  }

  return {
    mockSetUserId: vi.fn(),
    mockReset: vi.fn(),
    mockIdentify: vi.fn(),
    MockIdentify: _MockIdentify,
  };
});

// Mock amplitude SDK
vi.mock('@amplitude/analytics-browser', () => ({
  setUserId: mockSetUserId,
  reset: mockReset,
  identify: mockIdentify,
  Identify: MockIdentify,
}));

// Mock useAuth with controllable user state
let mockUser: { id: string; email?: string } | null = null;
vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

import { AmplitudeProvider } from './useAmplitude';

describe('AmplitudeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders children', () => {
      const { getByText } = render(
        <AmplitudeProvider>
          <span>child content</span>
        </AmplitudeProvider>
      );

      expect(getByText('child content')).toBeInTheDocument();
    });
  });

  describe('user identity', () => {
    it('calls setUserId when user is authenticated', () => {
      mockUser = { id: 'user-abc-123' };

      render(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(mockSetUserId).toHaveBeenCalledWith('user-abc-123');
      expect(mockSetUserId).toHaveBeenCalledTimes(1);
    });

    it('does not call amplitude methods when no user is present', () => {
      mockUser = null;

      render(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(mockSetUserId).not.toHaveBeenCalled();
      expect(mockReset).not.toHaveBeenCalled();
    });

    it('calls reset when user logs out', () => {
      mockUser = { id: 'user-abc-123' };

      const { rerender } = render(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(mockSetUserId).toHaveBeenCalledWith('user-abc-123');

      // Simulate logout
      mockUser = null;
      rerender(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('does not call setUserId again for the same user ID', () => {
      mockUser = { id: 'user-abc-123', email: 'a@test.com' };

      const { rerender } = render(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(mockSetUserId).toHaveBeenCalledTimes(1);

      // New user object reference but same ID (e.g., profile update)
      mockUser = { id: 'user-abc-123', email: 'b@test.com' };
      rerender(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      // identifiedUserRef prevents redundant call
      expect(mockSetUserId).toHaveBeenCalledTimes(1);
    });

    it('identifies email when it arrives after initial login', () => {
      // User logs in without email initially (e.g., profile fetch pending)
      mockUser = { id: 'user-abc-123' };

      const { rerender } = render(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(mockSetUserId).toHaveBeenCalledWith('user-abc-123');
      expect(mockIdentify).not.toHaveBeenCalled();

      // Email arrives in a later render (e.g., profile fetch completes)
      mockUser = { id: 'user-abc-123', email: 'late@example.com' };
      rerender(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      // setUserId should NOT be called again (same ID)
      expect(mockSetUserId).toHaveBeenCalledTimes(1);
      // But identify should fire for the late-arriving email
      expect(mockIdentify).toHaveBeenCalledTimes(1);
      const identifyArg = mockIdentify.mock.calls[0][0];
      expect(identifyArg._properties).toEqual({ email: 'late@example.com' });
    });

    it('calls setUserId with new ID when user switches accounts', () => {
      mockUser = { id: 'user-abc-123' };

      const { rerender } = render(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(mockSetUserId).toHaveBeenCalledWith('user-abc-123');

      // Switch to different user
      mockUser = { id: 'user-xyz-456' };
      rerender(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(mockSetUserId).toHaveBeenCalledWith('user-xyz-456');
      expect(mockSetUserId).toHaveBeenCalledTimes(2);
    });

    it('calls identify with email when user has email', () => {
      mockUser = { id: 'user-abc-123', email: 'test@example.com' };

      render(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(mockIdentify).toHaveBeenCalledTimes(1);
      const identifyArg = mockIdentify.mock.calls[0][0];
      expect(identifyArg._properties).toEqual({ email: 'test@example.com' });
    });

    it('does not call identify when user has no email', () => {
      mockUser = { id: 'user-abc-123' };

      render(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(mockSetUserId).toHaveBeenCalledWith('user-abc-123');
      expect(mockIdentify).not.toHaveBeenCalled();
    });

    it('does not call reset when no user was previously identified', () => {
      // Start with no user
      mockUser = null;

      const { rerender } = render(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      // Rerender still with no user
      rerender(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(mockReset).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('catches and warns on setUserId errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockSetUserId.mockImplementation(() => {
        throw new Error('SDK error');
      });

      mockUser = { id: 'user-abc-123' };

      render(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to set Amplitude user identity:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('catches and warns on reset errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockReset.mockImplementation(() => {
        throw new Error('SDK error');
      });

      mockUser = { id: 'user-abc-123' };

      const { rerender } = render(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      // Simulate logout to trigger reset
      mockUser = null;
      rerender(
        <AmplitudeProvider>
          <div />
        </AmplitudeProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to set Amplitude user identity:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});

describe('AmplitudeProvider without API key', () => {
  it('does not call amplitude methods even with authenticated user', async () => {
    vi.resetModules();

    // Override env to remove API key
    const savedKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
    import.meta.env.VITE_AMPLITUDE_API_KEY = '';

    const localSetUserId = vi.fn();
    const localReset = vi.fn();

    vi.doMock('@amplitude/analytics-browser', () => ({
      setUserId: localSetUserId,
      reset: localReset,
    }));

    vi.doMock('./useAuth', () => ({
      useAuth: () => ({ user: { id: 'user-abc-123' } }),
    }));

    const { AmplitudeProvider: NoKeyProvider } = await import('./useAmplitude');

    render(
      <NoKeyProvider>
        <div />
      </NoKeyProvider>
    );

    expect(localSetUserId).not.toHaveBeenCalled();
    expect(localReset).not.toHaveBeenCalled();

    // Restore
    import.meta.env.VITE_AMPLITUDE_API_KEY = savedKey;
  });
});
