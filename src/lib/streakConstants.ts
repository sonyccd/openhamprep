/**
 * Constants for the daily streak system.
 * Centralized here to avoid hardcoding thresholds in multiple places.
 */

/** Minimum questions to answer in a day to qualify for streak */
export const STREAK_QUESTIONS_THRESHOLD = 5;

/** Minimum tests to complete in a day to qualify for streak */
export const STREAK_TESTS_THRESHOLD = 1;

/** Minimum glossary terms to study in a day to qualify for streak */
export const STREAK_GLOSSARY_THRESHOLD = 10;

/**
 * Get the current UTC date as a YYYY-MM-DD string.
 * Uses UTC to match PostgreSQL's CURRENT_DATE on the server.
 * This ensures consistent date handling between client and server.
 */
export function getUTCDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * @deprecated Use getUTCDateString instead. Kept for backwards compatibility.
 */
export const getLocalDateString = getUTCDateString;
