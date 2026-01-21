import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePushNotifications } from './usePushNotifications';

describe('usePushNotifications', () => {
  // Store original values
  const originalNotification = global.Notification;

  // Mock localStorage
  let mockStorage: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      mockStorage = {};
    }),
    length: 0,
    key: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = {};

    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original Notification
    Object.defineProperty(global, 'Notification', {
      value: originalNotification,
      writable: true,
    });
  });

  describe('when Notification API is supported', () => {
    let mockRequestPermission: ReturnType<typeof vi.fn>;
    let MockNotification: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockRequestPermission = vi.fn().mockResolvedValue('granted');

      // Create mock Notification constructor
      MockNotification = vi.fn();
      Object.defineProperty(MockNotification, 'permission', {
        value: 'default',
        writable: true,
        configurable: true,
      });
      MockNotification.requestPermission = mockRequestPermission;

      Object.defineProperty(global, 'Notification', {
        value: MockNotification,
        writable: true,
        configurable: true,
      });
    });

    it('returns isSupported as true', () => {
      const { result } = renderHook(() => usePushNotifications());
      expect(result.current.isSupported).toBe(true);
    });

    it('returns initial permission from Notification.permission', () => {
      const { result } = renderHook(() => usePushNotifications());
      expect(result.current.permission).toBe('default');
    });

    it('returns hasAskedPermission as false initially', () => {
      const { result } = renderHook(() => usePushNotifications());
      expect(result.current.hasAskedPermission).toBe(false);
    });

    it('returns hasAskedPermission as true when stored in localStorage', () => {
      mockStorage['notification-permission-asked'] = 'true';

      const { result } = renderHook(() => usePushNotifications());
      expect(result.current.hasAskedPermission).toBe(true);
    });

    describe('requestPermission', () => {
      it('requests permission and updates state', async () => {
        const { result } = renderHook(() => usePushNotifications());

        let permission: NotificationPermission;
        await act(async () => {
          permission = await result.current.requestPermission();
        });

        expect(mockRequestPermission).toHaveBeenCalled();
        expect(permission!).toBe('granted');
        expect(result.current.permission).toBe('granted');
        expect(result.current.hasAskedPermission).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'notification-permission-asked',
          'true'
        );
      });

      it('handles permission denied', async () => {
        mockRequestPermission.mockResolvedValue('denied');

        const { result } = renderHook(() => usePushNotifications());

        let permission: NotificationPermission;
        await act(async () => {
          permission = await result.current.requestPermission();
        });

        expect(permission!).toBe('denied');
        expect(result.current.permission).toBe('denied');
      });

      it('handles errors gracefully', async () => {
        mockRequestPermission.mockRejectedValue(new Error('Permission error'));

        const { result } = renderHook(() => usePushNotifications());

        let permission: NotificationPermission;
        await act(async () => {
          permission = await result.current.requestPermission();
        });

        expect(permission!).toBe('denied');
      });
    });

    describe('sendNotification', () => {
      it('creates notification when permission is granted', () => {
        Object.defineProperty(MockNotification, 'permission', {
          value: 'granted',
          writable: true,
          configurable: true,
        });

        const { result } = renderHook(() => usePushNotifications());
        result.current.sendNotification('Test Title', { body: 'Test Body' });

        expect(MockNotification).toHaveBeenCalledWith('Test Title', {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          body: 'Test Body',
        });
      });

      it('does nothing when permission is default', () => {
        const { result } = renderHook(() => usePushNotifications());
        result.current.sendNotification('Test Title', { body: 'Test Body' });

        expect(MockNotification).not.toHaveBeenCalled();
      });

      it('does nothing when permission is denied', () => {
        Object.defineProperty(MockNotification, 'permission', {
          value: 'denied',
          writable: true,
          configurable: true,
        });

        const { result } = renderHook(() => usePushNotifications());
        result.current.sendNotification('Test Title', { body: 'Test Body' });

        expect(MockNotification).not.toHaveBeenCalled();
      });

      it('handles notification creation errors gracefully', () => {
        Object.defineProperty(MockNotification, 'permission', {
          value: 'granted',
          writable: true,
          configurable: true,
        });

        MockNotification.mockImplementation(() => {
          throw new Error('Notification not supported');
        });

        const { result } = renderHook(() => usePushNotifications());

        // Should not throw
        expect(() =>
          result.current.sendNotification('Test Title', { body: 'Test Body' })
        ).not.toThrow();
      });
    });
  });

  describe('localStorage error handling', () => {
    let MockNotification: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      MockNotification = vi.fn();
      Object.defineProperty(MockNotification, 'permission', {
        value: 'default',
        writable: true,
        configurable: true,
      });
      MockNotification.requestPermission = vi.fn().mockResolvedValue('granted');

      Object.defineProperty(global, 'Notification', {
        value: MockNotification,
        writable: true,
        configurable: true,
      });
    });

    it('handles localStorage.getItem errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => usePushNotifications());
      expect(result.current.hasAskedPermission).toBe(false);
    });

    it('handles localStorage.setItem errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const { result } = renderHook(() => usePushNotifications());

      // Should not throw
      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permission).toBe('granted');
    });
  });

  describe('visibility change handling', () => {
    let MockNotification: ReturnType<typeof vi.fn>;
    let visibilityChangeHandler: ((event: Event) => void) | undefined;

    beforeEach(() => {
      MockNotification = vi.fn();
      Object.defineProperty(MockNotification, 'permission', {
        value: 'default',
        writable: true,
        configurable: true,
      });
      MockNotification.requestPermission = vi.fn().mockResolvedValue('granted');

      Object.defineProperty(global, 'Notification', {
        value: MockNotification,
        writable: true,
        configurable: true,
      });

      // Capture visibilitychange handler
      const originalAddEventListener = document.addEventListener.bind(document);
      vi.spyOn(document, 'addEventListener').mockImplementation((event, handler, options) => {
        if (event === 'visibilitychange') {
          visibilityChangeHandler = handler as (event: Event) => void;
        }
        return originalAddEventListener(event, handler, options);
      });
    });

    it('updates permission state when tab becomes visible and permission changed', () => {
      const { result } = renderHook(() => usePushNotifications());

      // Initial permission should be 'default'
      expect(result.current.permission).toBe('default');

      // Simulate permission change in browser settings
      Object.defineProperty(MockNotification, 'permission', {
        value: 'granted',
        writable: true,
        configurable: true,
      });

      // Simulate visibility change
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });

      if (visibilityChangeHandler) {
        act(() => {
          visibilityChangeHandler!(new Event('visibilitychange'));
        });
      }

      expect(result.current.permission).toBe('granted');
    });

    it('cleans up event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => usePushNotifications());
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });
  });
});
