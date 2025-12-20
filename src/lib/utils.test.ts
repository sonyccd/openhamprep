import { describe, it, expect } from 'vitest';
import { cn, getSafeUrl } from './utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const showBar = false;
    const showBarTrue = true;
    expect(cn('foo', showBar && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', showBarTrue && 'bar', 'baz')).toBe('foo bar baz');
  });

  it('should handle undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should merge tailwind classes correctly', () => {
    // Later classes should override earlier ones
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
  });

  it('should handle array of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle object syntax', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});

describe('getSafeUrl - XSS prevention', () => {
  describe('safe protocols', () => {
    it('should allow https URLs', () => {
      expect(getSafeUrl('https://forum.openhamprep.com/t/topic/123')).toBe(
        'https://forum.openhamprep.com/t/topic/123'
      );
    });

    it('should allow http URLs', () => {
      expect(getSafeUrl('http://localhost:4200/t/topic/123')).toBe(
        'http://localhost:4200/t/topic/123'
      );
    });
  });

  describe('dangerous protocols - XSS prevention', () => {
    it('should reject javascript: protocol', () => {
      expect(getSafeUrl("javascript:alert('XSS')")).toBeNull();
    });

    it('should reject javascript: with encoding', () => {
      expect(getSafeUrl('javascript:alert(document.cookie)')).toBeNull();
    });

    it('should reject data: protocol', () => {
      expect(getSafeUrl("data:text/html,<script>alert('XSS')</script>")).toBeNull();
    });

    it('should reject vbscript: protocol', () => {
      expect(getSafeUrl("vbscript:msgbox('XSS')")).toBeNull();
    });

    it('should reject file: protocol', () => {
      expect(getSafeUrl('file:///etc/passwd')).toBeNull();
    });

    it('should reject ftp: protocol', () => {
      expect(getSafeUrl('ftp://ftp.example.com/file')).toBeNull();
    });
  });

  describe('invalid inputs', () => {
    it('should return null for null input', () => {
      expect(getSafeUrl(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getSafeUrl(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getSafeUrl('')).toBeNull();
    });

    it('should return null for non-URL strings', () => {
      expect(getSafeUrl('not a url')).toBeNull();
    });

    it('should return null for relative paths', () => {
      expect(getSafeUrl('/t/topic/123')).toBeNull();
    });
  });
});
