import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  STREAK_QUESTIONS_THRESHOLD,
  STREAK_TESTS_THRESHOLD,
  STREAK_GLOSSARY_THRESHOLD,
  getUTCDateString,
  getLocalDateString,
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

    it('uses UTC timezone to match server CURRENT_DATE', () => {
      vi.useFakeTimers();
      // Set to 11:30 PM UTC on Jan 15
      vi.setSystemTime(new Date('2026-01-15T23:30:00Z'));

      const result = getUTCDateString();

      // Should use UTC date components - still Jan 15 in UTC
      expect(result).toBe('2026-01-15');
    });

    it('handles UTC date boundary correctly', () => {
      vi.useFakeTimers();
      // Set to 12:30 AM UTC on Jan 16 (which would be Jan 15 in US timezones)
      vi.setSystemTime(new Date('2026-01-16T00:30:00Z'));

      const result = getUTCDateString();

      // Should be Jan 16 in UTC regardless of local timezone
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

    it('handles December correctly', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-12-25T12:00:00Z'));

      const result = getUTCDateString();
      expect(result).toBe('2026-12-25');
    });

    it('handles January correctly', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

      const result = getUTCDateString();
      expect(result).toBe('2026-01-01');
    });
  });

  describe('getLocalDateString (deprecated alias)', () => {
    it('is an alias for getUTCDateString', () => {
      expect(getLocalDateString).toBe(getUTCDateString);
    });
  });
});
