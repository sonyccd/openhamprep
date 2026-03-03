import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// vi.hoisted runs before imports — set env vars and create mock fns
const { mockIdentify, mockReset } = vi.hoisted(() => {
  import.meta.env.VITE_RUDDERSTACK_WRITE_KEY = 'test-write-key';
  import.meta.env.VITE_RUDDERSTACK_DATA_PLANE_URL = 'https://test.dataplane.rudderstack.com';

  const _mockIdentify = vi.fn();
  const _mockReset = vi.fn();

  (globalThis as any).window = globalThis.window || {};
  (window as any).rudderanalytics = {
    identify: _mockIdentify,
    reset: _mockReset,
  };

  return {
    mockIdentify: _mockIdentify,
    mockReset: _mockReset,
  };
});

// Mock useAuth with controllable user state
let mockUser: { id: string; email?: string } | null = null;
vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

import { RudderStackProvider } from './useRudderStack';

describe('RudderStackProvider', () => {
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
        <RudderStackProvider>
          <span>child content</span>
        </RudderStackProvider>
      );

      expect(getByText('child content')).toBeInTheDocument();
    });
  });

  describe('user identity', () => {
    it('calls identify when user is authenticated', () => {
      mockUser = { id: 'user-abc-123', email: 'test@example.com' };

      render(
        <RudderStackProvider>
          <div />
        </RudderStackProvider>
      );

      expect(mockIdentify).toHaveBeenCalledWith('user-abc-123', { email: 'test@example.com' });
      expect(mockIdentify).toHaveBeenCalledTimes(1);
    });

    it('calls identify without email when user has no email', () => {
      mockUser = { id: 'user-abc-123' };

      render(
        <RudderStackProvider>
          <div />
        </RudderStackProvider>
      );

      expect(mockIdentify).toHaveBeenCalledWith('user-abc-123', {});
      expect(mockIdentify).toHaveBeenCalledTimes(1);
    });

    it('does not call identify when no user is present', () => {
      mockUser = null;

      render(
        <RudderStackProvider>
          <div />
        </RudderStackProvider>
      );

      expect(mockIdentify).not.toHaveBeenCalled();
      expect(mockReset).not.toHaveBeenCalled();
    });

    it('calls reset when user logs out', () => {
      mockUser = { id: 'user-abc-123' };

      const { rerender } = render(
        <RudderStackProvider>
          <div />
        </RudderStackProvider>
      );

      mockUser = null;
      rerender(
        <RudderStackProvider>
          <div />
        </RudderStackProvider>
      );

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('does not call identify again for the same user ID', () => {
      mockUser = { id: 'user-abc-123', email: 'a@test.com' };

      const { rerender } = render(
        <RudderStackProvider>
          <div />
        </RudderStackProvider>
      );

      expect(mockIdentify).toHaveBeenCalledTimes(1);

      mockUser = { id: 'user-abc-123', email: 'b@test.com' };
      rerender(
        <RudderStackProvider>
          <div />
        </RudderStackProvider>
      );

      // Same user ID — should not re-identify
      expect(mockIdentify).toHaveBeenCalledTimes(1);
    });

    it('re-identifies when user switches accounts', () => {
      mockUser = { id: 'user-abc-123' };

      const { rerender } = render(
        <RudderStackProvider>
          <div />
        </RudderStackProvider>
      );

      mockUser = { id: 'user-xyz-456' };
      rerender(
        <RudderStackProvider>
          <div />
        </RudderStackProvider>
      );

      expect(mockIdentify).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('catches and warns on identify errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockIdentify.mockImplementation(() => {
        throw new Error('SDK error');
      });

      mockUser = { id: 'user-abc-123' };

      render(
        <RudderStackProvider>
          <div />
        </RudderStackProvider>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to set RudderStack user identity:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});

describe('RudderStackProvider without SDK', () => {
  it('does not throw when rudderanalytics is not on window', () => {
    const savedAnalytics = (window as any).rudderanalytics;
    delete (window as any).rudderanalytics;

    mockUser = { id: 'user-abc-123' };

    expect(() =>
      render(
        <RudderStackProvider>
          <div />
        </RudderStackProvider>
      )
    ).not.toThrow();

    (window as any).rudderanalytics = savedAnalytics;
  });
});
