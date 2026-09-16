import { describe, it, expect } from 'vitest';
import { MAX_PATTERN_LENGTH, isValidRegexPattern } from './regexSafety';

/**
 * These patterns are stored and then run server-side by the alert monitor
 * against error text, so one that backtracks catastrophically stalls that job
 * rather than the admin's own tab. This is the only validator here a user can
 * actually reach — the numeric fields are held in range by their parse floor
 * and by native min constraints before any of this runs.
 */
describe('isValidRegexPattern', () => {
  describe('accepts what an admin realistically wants', () => {
    it.each([
      'timeout',
      'timeout|timed out|deadline exceeded',
      'database|connection',
      '^ERROR: ',
      '\\bECONNREFUSED\\b',
      'status [45]\\d\\d',
      'failed to (fetch|parse)',
    ])('accepts %s', (pattern) => {
      expect(isValidRegexPattern(pattern)).toEqual({ valid: true });
    });
  });

  describe('turns away catastrophic backtracking', () => {
    it.each([
      ['nested quantifier', '(a+)+'],
      ['nested star-plus', '(a*)+'],
      ['quantified alternation', '(a|a)+'],
      ['overlapping alternation', '(a|ab)+'],
      ['repeated wildcard', '(.*)+'],
      ['doubly nested', '((a+))+'],
      ['stacked quantifiers', 'a++'],
      ['quantified backreference', '(a)\\1+'],
    ])('rejects %s', (_label, pattern) => {
      const result = isValidRegexPattern(pattern);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/performance issues/);
    });
  });

  it('requires a pattern at all', () => {
    expect(isValidRegexPattern('')).toEqual({
      valid: false,
      error: 'Pattern is required',
    });
  });

  it('caps the length before doing any work', () => {
    const result = isValidRegexPattern('a'.repeat(MAX_PATTERN_LENGTH + 1));

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/max 200 characters/);
  });

  it('accepts a pattern right at the cap', () => {
    expect(isValidRegexPattern('a'.repeat(MAX_PATTERN_LENGTH)).valid).toBe(true);
  });

  it('reports unparseable syntax as such, not as a performance risk', () => {
    expect(isValidRegexPattern('([unclosed')).toEqual({
      valid: false,
      error: 'Invalid regex syntax',
    });
  });

  /**
   * The length cap is checked first, so an over-long dangerous pattern is
   * reported as too long — the cheaper check should not be skipped just
   * because a later one would also reject it.
   */
  it('checks length before the construct scan', () => {
    const result = isValidRegexPattern('(a+)+' + 'b'.repeat(MAX_PATTERN_LENGTH));

    expect(result.error).toMatch(/too long/);
  });
});
