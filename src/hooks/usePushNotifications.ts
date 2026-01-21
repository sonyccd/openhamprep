import { useState, useCallback, useEffect } from 'react';
import { safeGetItem, safeSetItem } from '@/lib/localStorage';

const PERMISSION_ASKED_KEY = 'notification-permission-asked';

/**
 * Default notification icon paths.
 * These must match actual files in public/icons/
 */
const NOTIFICATION_ICON = '/icons/icon-192.png';
const NOTIFICATION_BADGE = '/icons/icon-96.png';

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
 * ## Browser Compatibility Notes
 *
 * - **Safari on iOS**: Does not support the `new Notification()` constructor.
 *   Notifications require Service Worker + Push API. We catch and log this gracefully.
 * - **Firefox**: Requires HTTPS for Notification API (not an issue in production).
 * - **Chrome/Edge**: Full support, but user gesture required for permission request.
 * - **Safari on macOS**: Supported with some limitations on options.
 *
 * The hook handles all these cases gracefully - unsupported browsers will
 * simply have `isSupported: false` or fail silently when sending.
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
          icon: NOTIFICATION_ICON,
          badge: NOTIFICATION_BADGE,
          ...options,
        });
      } catch (error) {
        // Safari on iOS doesn't support the Notification constructor (requires Service Worker)
        // Other browsers may also fail for various reasons (permissions, settings)
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
