/**
 * Utility functions for global search functionality
 */

/**
 * Truncate text to a maximum length, adding ellipsis if truncated.
 * Tries to break at word boundaries for cleaner output.
 * @param text - The text to truncate
 * @param maxLength - Maximum character length (default 100)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  // Try to break at a word boundary
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  // If there's a space in the last 20% of the string, break there
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Check if the current platform is macOS.
 * Used for displaying the correct keyboard shortcut (Cmd vs Ctrl).
 * @returns true if running on macOS
 */
export function isMacOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Get the keyboard shortcut modifier key label for the current platform.
 * @returns '⌘' for macOS, 'Ctrl' for other platforms
 */
export function getModifierKey(): string {
  return isMacOS() ? '⌘' : 'Ctrl';
}
