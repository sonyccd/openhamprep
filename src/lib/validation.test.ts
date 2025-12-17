import { describe, it, expect } from 'vitest';
import { validateForumUsername, FORUM_USERNAME_REGEX, FORUM_USERNAME_ERROR } from './validation';

describe('validateForumUsername', () => {
  describe('valid usernames', () => {
    it('accepts alphanumeric usernames', () => {
      expect(validateForumUsername('testuser123')).toEqual({ valid: true });
    });

    it('accepts usernames with underscores', () => {
      expect(validateForumUsername('test_user')).toEqual({ valid: true });
    });

    it('accepts usernames with hyphens', () => {
      expect(validateForumUsername('test-user')).toEqual({ valid: true });
    });

    it('accepts minimum length username (3 chars)', () => {
      expect(validateForumUsername('abc')).toEqual({ valid: true });
    });

    it('accepts maximum length username (20 chars)', () => {
      expect(validateForumUsername('a'.repeat(20))).toEqual({ valid: true });
    });

    it('accepts mixed case usernames', () => {
      expect(validateForumUsername('TestUser123')).toEqual({ valid: true });
    });

    it('trims whitespace before validation', () => {
      expect(validateForumUsername('  testuser  ')).toEqual({ valid: true });
    });
  });

  describe('invalid usernames', () => {
    it('rejects empty string', () => {
      const result = validateForumUsername('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Forum username cannot be empty');
    });

    it('rejects whitespace-only string', () => {
      const result = validateForumUsername('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Forum username cannot be empty');
    });

    it('rejects usernames shorter than 3 characters', () => {
      const result = validateForumUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(FORUM_USERNAME_ERROR);
    });

    it('rejects usernames longer than 20 characters', () => {
      const result = validateForumUsername('a'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.error).toBe(FORUM_USERNAME_ERROR);
    });

    it('rejects usernames with spaces', () => {
      const result = validateForumUsername('test user');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(FORUM_USERNAME_ERROR);
    });

    it('rejects usernames with special characters', () => {
      const result = validateForumUsername('test@user');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(FORUM_USERNAME_ERROR);
    });

    it('rejects usernames with emoji', () => {
      const result = validateForumUsername('test😀user');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(FORUM_USERNAME_ERROR);
    });

    it('rejects usernames with periods', () => {
      const result = validateForumUsername('test.user');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(FORUM_USERNAME_ERROR);
    });

    it('rejects SQL injection attempts', () => {
      const result = validateForumUsername("'; DROP TABLE users; --");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(FORUM_USERNAME_ERROR);
    });

    it('rejects XSS attempts', () => {
      const result = validateForumUsername('<script>alert("xss")</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(FORUM_USERNAME_ERROR);
    });

    it('rejects usernames with only underscores', () => {
      const result = validateForumUsername('___');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(FORUM_USERNAME_ERROR);
    });

    it('rejects usernames with only hyphens', () => {
      const result = validateForumUsername('---');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(FORUM_USERNAME_ERROR);
    });

    it('rejects usernames with only underscores and hyphens', () => {
      const result = validateForumUsername('_-_-_');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(FORUM_USERNAME_ERROR);
    });
  });
});

describe('FORUM_USERNAME_REGEX', () => {
  it('is exported and matches expected pattern', () => {
    expect(FORUM_USERNAME_REGEX).toBeDefined();
    expect(FORUM_USERNAME_REGEX.test('valid_user-123')).toBe(true);
    expect(FORUM_USERNAME_REGEX.test('invalid user')).toBe(false);
  });
});
