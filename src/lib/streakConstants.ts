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
 * Uses UTC to ensure consistent storage in the database.
 * Frontend handles conversion to local timezone for display.
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

/**
 * Calculate how many questions from a UTC day fall into the user's local "today".
 *
 * A user's local day can span two UTC days. For example, a PST user (UTC-8) on Jan 21:
 * - 12am-4pm PST = Jan 21 UTC
 * - 4pm-12am PST = Jan 22 UTC
 *
 * This function determines what portion of each UTC day's activity belongs to "today" local.
 *
 * @param todayUtc - The current UTC date (YYYY-MM-DD)
 * @param questionsTodayUtc - Questions answered on the current UTC date
 * @param questionsYesterdayUtc - Questions answered on the previous UTC date
 * @returns The number of questions that count toward the user's local "today"
 */
export function calculateLocalDayQuestions(
  todayUtc: string,
  questionsTodayUtc: number,
  questionsYesterdayUtc: number
): number {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset(); // minutes, positive = behind UTC

  if (timezoneOffset > 0) {
    // User is behind UTC (e.g., Americas: PST is UTC-8, EST is UTC-5)
    // Their local day spans two UTC days. For example, PST user on Jan 21 local:
    // - 12am-4pm PST = 8am-midnight UTC Jan 21 = "yesterday UTC" (after boundary)
    // - 4pm-midnight PST = midnight-8am UTC Jan 22 = "today UTC"
    //
    // The UTC day boundary occurs at (24 - offset) hours into the local day.
    // For PST (offset=8): boundary at 4pm local (16 hours into day)
    //
    // Before crossing: all local activity is in "today UTC"
    // After crossing: local activity spans "yesterday UTC" + "today UTC"

    const hoursIntoLocalDay = now.getHours() + now.getMinutes() / 60;
    const utcHoursOffset = timezoneOffset / 60;
    const utcBoundaryLocalHour = 24 - utcHoursOffset;

    if (hoursIntoLocalDay >= utcBoundaryLocalHour) {
      // Crossed UTC boundary - local day spans both UTC days
      // Need both yesterday (morning activity) + today (evening activity)
      return questionsYesterdayUtc + questionsTodayUtc;
    } else {
      // Haven't crossed UTC boundary yet
      // All local day activity so far is in "today UTC"
      return questionsTodayUtc;
    }
  } else {
    // User is ahead of or at UTC (e.g., Europe, Asia, Australia)
    // Their local "today" is mostly "today UTC"
    // Note: For users far ahead of UTC, some morning activity might be in
    // "tomorrow UTC" but we don't have that data, so we use today as approximation
    return questionsTodayUtc;
  }
}

/**
 * Check if the user's local day qualifies for a streak based on UTC data.
 *
 * For users behind UTC (Americas), we use OR logic because their local day
 * spans two UTC days. This is intentionally permissive to benefit the user:
 *
 * Example: PST user at 1am local on Tuesday (9am UTC Tuesday):
 * - They answered 5 questions at 11pm Monday local (7am UTC Tuesday)
 * - yesterdayQualifies (Monday UTC) = true (from the 11pm activity)
 * - todayQualifies (Tuesday UTC) = false (no activity yet in current UTC day)
 * - Result: true (they qualified during their Monday local day)
 *
 * This may occasionally credit a user for the "wrong" local day near boundaries,
 * but precise tracking would require per-question timestamps rather than daily
 * aggregates. The current approach errs on the side of the user.
 *
 * @param todayUtc - The current UTC date (YYYY-MM-DD)
 * @param todayQualifiesUtc - Whether today UTC qualifies
 * @param yesterdayQualifiesUtc - Whether yesterday UTC qualifies
 * @returns Whether the user's local day qualifies for the streak
 */
export function checkLocalDayQualifies(
  todayUtc: string,
  todayQualifiesUtc: boolean,
  yesterdayQualifiesUtc: boolean
): boolean {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset(); // minutes, positive = behind UTC

  if (timezoneOffset > 0) {
    // User is behind UTC - their local day spans yesterday + today UTC
    // If either qualifies, consider local day as qualifying (benefits user)
    return todayQualifiesUtc || yesterdayQualifiesUtc;
  } else {
    // User is at or ahead of UTC
    return todayQualifiesUtc;
  }
}

/**
 * Get a human-readable string for when the streak day resets in local time.
 *
 * @returns A string like "4:00 PM" indicating when midnight UTC is in local time
 */
export function getStreakResetTimeLocal(): string {
  // Create a date for midnight UTC today
  const now = new Date();
  const tomorrowUtc = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));

  // Format in local time
  return tomorrowUtc.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
