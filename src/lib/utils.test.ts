import { describe, it, expect } from 'vitest';
import { getSafeUrl } from './utils';

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
