/**
 * Safe localStorage utilities that handle errors gracefully.
 *
 * localStorage can throw in several scenarios:
 * - Private/incognito browsing mode
 * - Storage quota exceeded
 * - SecurityError in certain iframe contexts
 * - Browser settings that disable storage
 *
 * These helpers prevent errors from propagating while still logging
 * warnings for debugging purposes.
 */

/**
 * Safely get an item from localStorage.
 * Returns null if localStorage is unavailable or throws an error.
 *
 * @param key - The localStorage key to retrieve
 * @returns The stored value, or null if not found or unavailable
 *
 * @example
 * const dismissed = safeGetItem('notification-dismissed-exam-urgent');
 * if (dismissed === 'true') {
 *   // User previously dismissed this notification
 * }
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely set an item in localStorage.
 * Silently fails if localStorage is unavailable or quota exceeded.
 *
 * @param key - The localStorage key to set
 * @param value - The value to store
 *
 * @example
 * safeSetItem('notification-dismissed-exam-urgent-2026-01-21', 'true');
 */
export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

/**
 * Safely remove an item from localStorage.
 * Silently fails if localStorage is unavailable.
 *
 * @param key - The localStorage key to remove
 *
 * @example
 * safeRemoveItem('notification-permission-asked');
 */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
  }
}
