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
 * Get the current local date as a YYYY-MM-DD string.
 * Uses the user's local timezone, not UTC.
 * This ensures consistent date handling between client and server.
 */
export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
