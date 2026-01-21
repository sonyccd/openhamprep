import { useState, useCallback, useEffect } from 'react';

const PERMISSION_ASKED_KEY = 'notification-permission-asked';

/**
 * Safely get item from localStorage.
 * Returns null if localStorage is unavailable (private browsing, storage full).
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely set item in localStorage.
 * Silently fails if localStorage is unavailable.
 */
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

/**
 * Result returned by the usePushNotifications hook.
 */
export interface UsePushNotificationsResult {
  /** Current notification permission state */
  permission: NotificationPermission;
  /** Whether the Notification API is supported in this browser */
  isSupported: boolean;
  /** Whether we've already asked the user for permission */
  hasAskedPermission: boolean;
  /** Request notification permission from the user */
  requestPermission: () => Promise<NotificationPermission>;
  /** Send a push notification (if permitted) */
  sendNotification: (title: string, options?: NotificationOptions) => void;
}

/**
 * Hook for managing browser push notifications.
 *
 * Provides permission state, request flow, and notification sending.
 * Tracks whether permission has been asked to avoid re-prompting.
 *
 * @example
 * ```tsx
 * const { permission, isSupported, requestPermission, sendNotification } = usePushNotifications();
 *
 * if (permission === 'granted') {
 *   sendNotification('Study Reminder', { body: 'Your streak is at risk!' });
 * }
 * ```
 */
export function usePushNotifications(): UsePushNotificationsResult {
  // Check if Notification API is supported
  const isSupported = typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined';

  // Track permission state
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (!isSupported || typeof Notification === 'undefined') return 'denied';
    return Notification.permission;
  });

  // Track if we've asked before
  const [hasAskedPermission, setHasAskedPermission] = useState(() => {
    if (typeof window === 'undefined') return false;
    return safeGetItem(PERMISSION_ASKED_KEY) === 'true';
  });

  // Check permission when tab regains focus (instead of polling)
  useEffect(() => {
    if (!isSupported) return;

    const checkPermission = () => {
      const currentPermission = Notification.permission;
      if (currentPermission !== permission) {
        setPermission(currentPermission);
      }
    };

    // Check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPermission();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSupported, permission]);

  /**
   * Request notification permission from the user.
   * Records that we've asked to avoid re-prompting.
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setHasAskedPermission(true);
      safeSetItem(PERMISSION_ASKED_KEY, 'true');
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, [isSupported]);

  /**
   * Send a notification if permission is granted.
   * Silently does nothing if permission is not granted.
   */
  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') return;

      try {
        new Notification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options,
        });
      } catch (error) {
        // Safari on iOS doesn't support the Notification constructor
        console.warn('Failed to create notification:', error);
      }
    },
    [isSupported, permission]
  );

  return {
    permission,
    isSupported,
    hasAskedPermission,
    requestPermission,
    sendNotification,
  };
}
