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

  // Get UTC midnight for today's UTC date
  const utcMidnight = new Date(todayUtc + 'T00:00:00Z');

  // Get local midnight for today
  const localNow = new Date();
  const localMidnight = new Date(
    localNow.getFullYear(),
    localNow.getMonth(),
    localNow.getDate(),
    0, 0, 0, 0
  );

  // If local midnight is after UTC midnight, we're "behind" UTC
  // meaning part of our local "today" is in "yesterday UTC"
  // If local midnight is before UTC midnight, we're "ahead" of UTC
  // meaning part of our local "today" is in "today UTC" and "tomorrow UTC"

  const localOffsetMs = localMidnight.getTime() - utcMidnight.getTime();
  const hoursOffset = localOffsetMs / (1000 * 60 * 60);

  // For simplicity, we use a heuristic:
  // - If user's timezone is behind UTC (negative offset, e.g., Americas),
  //   their local "today" includes some of "yesterday UTC" + some of "today UTC"
  // - If user's timezone is ahead of UTC (positive offset, e.g., Asia/Australia),
  //   their local "today" includes some of "today UTC" + some of "tomorrow UTC"
  //
  // Since we only have yesterday and today UTC data, for users ahead of UTC,
  // we just use today's UTC data as an approximation.

  const timezoneOffset = now.getTimezoneOffset(); // minutes, positive = behind UTC

  if (timezoneOffset > 0) {
    // User is behind UTC (e.g., Americas)
    // Their local day includes activity from yesterday UTC (after their local midnight)
    // and today UTC (before their local midnight)
    // For accurate tracking, we'd need timestamps, but with daily aggregates,
    // we return the sum as a reasonable approximation when it's late in their day
    const hoursIntoLocalDay = now.getHours() + now.getMinutes() / 60;
    const utcHoursOffset = timezoneOffset / 60;

    // If we're past the UTC day boundary in local time, include yesterday's UTC activity
    if (hoursIntoLocalDay >= (24 - utcHoursOffset)) {
      // We're in the portion of local day that falls into "today UTC"
      return questionsTodayUtc;
    } else {
      // We're in the portion of local day that was "yesterday UTC"
      // This is an approximation - ideally we'd have hourly data
      return questionsYesterdayUtc + questionsTodayUtc;
    }
  } else {
    // User is ahead of or at UTC
    // Their local "today" is mostly "today UTC"
    return questionsTodayUtc;
  }
}

/**
 * Check if the user's local day qualifies for a streak based on UTC data.
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
    // User is behind UTC - their local day may span yesterday + today UTC
    // If either qualifies, consider local day as qualifying
    // This is a conservative approach that benefits the user
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
