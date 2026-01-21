import { useState, useCallback, useEffect } from 'react';

const PERMISSION_ASKED_KEY = 'notification-permission-asked';

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
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  // Track permission state
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (!isSupported) return 'denied';
    return Notification.permission;
  });

  // Track if we've asked before
  const [hasAskedPermission, setHasAskedPermission] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PERMISSION_ASKED_KEY) === 'true';
  });

  // Keep permission state in sync if it changes externally
  useEffect(() => {
    if (!isSupported) return;

    // Update state if permission changed (e.g., user changed in browser settings)
    const checkPermission = () => {
      setPermission(Notification.permission);
    };

    // Check periodically since there's no event for permission changes
    const interval = setInterval(checkPermission, 5000);
    return () => clearInterval(interval);
  }, [isSupported]);

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
      localStorage.setItem(PERMISSION_ASKED_KEY, 'true');
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
