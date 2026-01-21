import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  STREAK_QUESTIONS_THRESHOLD,
  STREAK_TESTS_THRESHOLD,
  STREAK_GLOSSARY_THRESHOLD,
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

  describe('getLocalDateString', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns date in YYYY-MM-DD format', () => {
      const result = getLocalDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('uses local timezone, not UTC', () => {
      // Set a specific time that would be different date in UTC vs local
      // For example, 11:30 PM on Jan 15 in UTC-5 would be Jan 16 in UTC
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-15T23:30:00'));

      const result = getLocalDateString();

      // Should use local date components, not UTC
      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      expect(result).toBe(expected);
    });

    it('pads single-digit months with zero', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-05T12:00:00'));

      const result = getLocalDateString();
      expect(result).toBe('2026-03-05');
    });

    it('pads single-digit days with zero', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-12-09T12:00:00'));

      const result = getLocalDateString();
      expect(result).toBe('2026-12-09');
    });

    it('handles December correctly', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-12-25T12:00:00'));

      const result = getLocalDateString();
      expect(result).toBe('2026-12-25');
    });

    it('handles January correctly', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T12:00:00'));

      const result = getLocalDateString();
      expect(result).toBe('2026-01-01');
    });
  });
});
