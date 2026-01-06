import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { truncateText, isMacOS, getModifierKey } from './searchUtils';

describe('searchUtils', () => {
  describe('truncateText', () => {
    it('returns empty string for empty input', () => {
      expect(truncateText('')).toBe('');
    });

    it('returns empty string for null/undefined input', () => {
      expect(truncateText(null as unknown as string)).toBe('');
      expect(truncateText(undefined as unknown as string)).toBe('');
    });

    it('returns original text when shorter than maxLength', () => {
      const text = 'Hello world';
      expect(truncateText(text, 100)).toBe(text);
    });

    it('returns original text when exactly maxLength', () => {
      const text = 'Hello';
      expect(truncateText(text, 5)).toBe(text);
    });

    it('truncates text and adds ellipsis when longer than maxLength', () => {
      const text = 'This is a long text that should be truncated';
      // The function tries to break at word boundaries in last 20% of string
      // 20 * 0.8 = 16, lastSpace after position 16 is at 18 ("long ")
      expect(truncateText(text, 20)).toBe('This is a long text...');
    });

    it('uses default maxLength of 100 when not specified', () => {
      const text = 'A'.repeat(150);
      const result = truncateText(text);
      // Truncates to 100 chars then adds "..." = 103 total
      expect(result.length).toBe(103);
      expect(result.endsWith('...')).toBe(true);
    });

    it('handles text with special characters', () => {
      const text = 'Test with émojis 🎉 and spëcial chârs';
      // The function truncates to 20 chars then adds "..."
      // Emoji counts as 2 chars, so we get truncated at char 20
      expect(truncateText(text, 20)).toBe('Test with émojis 🎉...');
    });

    it('handles whitespace-only text', () => {
      expect(truncateText('   ', 10)).toBe('   ');
    });

    it('handles single character text', () => {
      expect(truncateText('A', 10)).toBe('A');
      expect(truncateText('A', 1)).toBe('A');
    });

    it('handles maxLength of 3 or less gracefully', () => {
      // With maxLength 3, we get 3 chars + ellipsis
      expect(truncateText('Hello', 3)).toBe('Hel...');
    });

    it('breaks at word boundary when space is in last 20% of text', () => {
      // With maxLength 25 (80% = 20), last space at position 23 ("frequency ")
      const text = 'Measure signal frequency using SWR meter';
      expect(truncateText(text, 25)).toBe('Measure signal frequency...');
    });

    it('does not break at word boundary when space is before 80% mark', () => {
      // With text "AB CD", maxLength 4, 80% = 3.2, space is at position 2
      // Space is before 80% mark, so it doesn't break there
      const text = 'AB CDEFGH';
      expect(truncateText(text, 4)).toBe('AB C...');
    });
  });

  describe('isMacOS', () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      // Restore original navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('returns true for Mac platform', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'MacIntel' },
        writable: true,
      });
      expect(isMacOS()).toBe(true);
    });

    it('returns true for macOS platform variations', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Macintosh' },
        writable: true,
      });
      expect(isMacOS()).toBe(true);
    });

    it('returns false for Windows platform', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Win32' },
        writable: true,
      });
      expect(isMacOS()).toBe(false);
    });

    it('returns false for Linux platform', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Linux x86_64' },
        writable: true,
      });
      expect(isMacOS()).toBe(false);
    });

    it('returns false when navigator is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
      });
      expect(isMacOS()).toBe(false);
    });

    it('handles case insensitive check', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'macintel' },
        writable: true,
      });
      // Implementation uses toUpperCase so it's case-insensitive
      expect(isMacOS()).toBe(true);
    });
  });

  describe('getModifierKey', () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('returns ⌘ for Mac', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'MacIntel' },
        writable: true,
      });
      expect(getModifierKey()).toBe('⌘');
    });

    it('returns Ctrl for Windows', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Win32' },
        writable: true,
      });
      expect(getModifierKey()).toBe('Ctrl');
    });

    it('returns Ctrl for Linux', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Linux x86_64' },
        writable: true,
      });
      expect(getModifierKey()).toBe('Ctrl');
    });
  });
});
