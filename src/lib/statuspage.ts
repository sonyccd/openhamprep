/**
 * Statuspage integration utilities
 *
 * This module provides a typed interface to the Statuspage.io embed widget.
 * The embed script is loaded in index.html and exposes window.statusEmbedTest.
 */

export const STATUSPAGE_URL = 'https://openhamprep.statuspage.io';
export const STATUSPAGE_EMBED_SCRIPT = `${STATUSPAGE_URL}/embed/script.js`;

declare global {
  interface Window {
    statusEmbedTest?: () => void;
  }
}

/**
 * Check if the Statuspage widget is available
 */
export function isStatusPageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.statusEmbedTest === 'function';
}

/**
 * Open the Statuspage floating widget
 * @returns true if the widget was opened, false if not available
 */
export function openStatusWidget(): boolean {
  if (isStatusPageAvailable()) {
    window.statusEmbedTest!();
    return true;
  }
  return false;
}

/**
 * Get the Statuspage URL for the status page
 */
export function getStatusPageUrl(): string {
  return STATUSPAGE_URL;
}
