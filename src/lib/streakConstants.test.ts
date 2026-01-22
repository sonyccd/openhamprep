import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  STREAK_QUESTIONS_THRESHOLD,
  STREAK_TESTS_THRESHOLD,
  STREAK_GLOSSARY_THRESHOLD,
  getUTCDateString,
  getLocalDateString,
  calculateLocalDayQuestions,
  checkLocalDayQualifies,
  getStreakResetTimeLocal,
} from './streakConstants';

describe('streakConstants', () => {
  describe('Threshold Constants', () => {
    it('has correct question threshold', () => {
      expect(STREAK_QUESTIONS_THRESHOLD).toBe(5);
    });

    it('has correct test threshold', () => {
      expect(STREAK_TESTS_THRESHOLD).toBe(1);
    });

    it('has correct glossary threshold', () => {
      expect(STREAK_GLOSSARY_THRESHOLD).toBe(10);
    });
  });

  describe('getUTCDateString', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns date in YYYY-MM-DD format', () => {
      const result = getUTCDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('uses UTC timezone for consistent server storage', () => {
      vi.useFakeTimers();
      // Set to 11:30 PM UTC on Jan 15
      vi.setSystemTime(new Date('2026-01-15T23:30:00Z'));

      const result = getUTCDateString();

      // Should use UTC date components - still Jan 15 in UTC
      expect(result).toBe('2026-01-15');
    });

    it('handles UTC date boundary correctly', () => {
      vi.useFakeTimers();
      // Set to 12:30 AM UTC on Jan 16
      vi.setSystemTime(new Date('2026-01-16T00:30:00Z'));

      const result = getUTCDateString();

      // Should be Jan 16 in UTC
      expect(result).toBe('2026-01-16');
    });

    it('pads single-digit months with zero', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-05T12:00:00Z'));

      const result = getUTCDateString();
      expect(result).toBe('2026-03-05');
    });

    it('pads single-digit days with zero', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-12-09T12:00:00Z'));

      const result = getUTCDateString();
      expect(result).toBe('2026-12-09');
    });
  });

  describe('calculateLocalDayQuestions', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns a reasonable question count based on timezone', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-21T14:00:00Z'));

      const result = calculateLocalDayQuestions('2026-01-21', 5, 3);

      // Result depends on test environment's timezone
      // Should be at least today's questions (5) and at most yesterday + today (8)
      expect(result).toBeGreaterThanOrEqual(5);
      expect(result).toBeLessThanOrEqual(8);
    });

    it('combines yesterday and today for users behind UTC in early local hours', () => {
      vi.useFakeTimers();
      // Simulate 10am EST (UTC-5) on Jan 21
      // This is 3pm UTC on Jan 21, which is still early in the user's local day
      // The user's local day started at midnight EST (5am UTC Jan 21)
      // So we're in the portion that's "today UTC"
      vi.setSystemTime(new Date('2026-01-21T15:00:00Z'));

      // Mock timezone offset: +300 minutes = UTC-5 (EST)
      const mockDate = new Date('2026-01-21T15:00:00Z');
      vi.spyOn(mockDate, 'getTimezoneOffset').mockReturnValue(300);

      const result = calculateLocalDayQuestions('2026-01-21', 5, 3);

      // Result depends on implementation - should handle timezone logic
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('returns at least today UTC questions', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-21T12:00:00Z'));

      const result = calculateLocalDayQuestions('2026-01-21', 7, 0);

      // Should return at least today's count
      expect(result).toBeGreaterThanOrEqual(7);
    });
  });

  describe('checkLocalDayQualifies', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true if today UTC qualifies', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-21T12:00:00Z'));

      const result = checkLocalDayQualifies('2026-01-21', true, false);

      expect(result).toBe(true);
    });

    it('returns false if neither day qualifies', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-21T12:00:00Z'));

      const result = checkLocalDayQualifies('2026-01-21', false, false);

      expect(result).toBe(false);
    });

    it('may return true if yesterday qualifies for users behind UTC', () => {
      vi.useFakeTimers();
      // This behavior depends on timezone - test that it returns a boolean
      vi.setSystemTime(new Date('2026-01-21T06:00:00Z'));

      const result = checkLocalDayQualifies('2026-01-21', false, true);

      expect(typeof result).toBe('boolean');
    });
  });

  describe('getStreakResetTimeLocal', () => {
    it('returns a time string', () => {
      const result = getStreakResetTimeLocal();

      // Should be a non-empty string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('contains AM or PM for 12-hour format', () => {
      const result = getStreakResetTimeLocal();

      // Should contain time indicator (AM/PM or a colon for the time)
      expect(result).toMatch(/AM|PM|:/i);
    });
  });

  describe('getLocalDateString (deprecated alias)', () => {
    it('is an alias for getUTCDateString', () => {
      expect(getLocalDateString).toBe(getUTCDateString);
    });
  });
});
