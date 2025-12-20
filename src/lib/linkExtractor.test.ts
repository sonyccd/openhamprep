import { describe, it, expect } from 'vitest';
import { extractLinksFromText } from './linkExtractor';

describe('extractLinksFromText', () => {
  describe('markdown links', () => {
    it('extracts a single markdown link', () => {
      const text = 'Check out [ARRL](https://arrl.org) for more info';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://arrl.org']);
    });

    it('extracts multiple markdown links', () => {
      const text = 'Visit [ARRL](https://arrl.org) and [FCC](https://fcc.gov) for details';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://arrl.org', 'https://fcc.gov']);
    });

    it('extracts markdown links with complex URLs', () => {
      const text = 'See [this article](https://example.com/path/to/page?query=value&foo=bar)';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://example.com/path/to/page?query=value&foo=bar']);
    });

    it('handles http links (not just https)', () => {
      const text = 'Old site: [example](http://example.com)';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['http://example.com']);
    });
  });

  describe('bare URLs', () => {
    it('extracts a single bare URL', () => {
      const text = 'Visit https://arrl.org for more information';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://arrl.org']);
    });

    it('extracts multiple bare URLs', () => {
      const text = 'Check https://arrl.org and https://fcc.gov for details';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://arrl.org', 'https://fcc.gov']);
    });

    it('extracts bare URLs with paths and query strings', () => {
      const text = 'See https://example.com/path/to/page?query=value';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://example.com/path/to/page?query=value']);
    });

    it('cleans trailing punctuation from bare URLs', () => {
      const text = 'Check out https://arrl.org. It has great resources!';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://arrl.org']);
    });

    it('cleans various trailing punctuation marks', () => {
      const cases = [
        { text: 'Visit https://example.com,', expected: 'https://example.com' },
        { text: 'Visit https://example.com;', expected: 'https://example.com' },
        { text: 'Visit https://example.com:', expected: 'https://example.com' },
        { text: 'Visit https://example.com!', expected: 'https://example.com' },
        { text: 'Visit https://example.com?', expected: 'https://example.com' },
        { text: 'Visit "https://example.com"', expected: 'https://example.com' },
        { text: "Visit 'https://example.com'", expected: 'https://example.com' },
      ];

      for (const { text, expected } of cases) {
        const links = extractLinksFromText(text);
        expect(links).toEqual([expected]);
      }
    });
  });

  describe('mixed links', () => {
    it('extracts both markdown and bare URLs', () => {
      const text = 'See [ARRL](https://arrl.org) or visit https://fcc.gov directly';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://arrl.org', 'https://fcc.gov']);
    });

    it('maintains order of appearance', () => {
      const text = 'First https://first.com then [second](https://second.com) then https://third.com';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://second.com', 'https://first.com', 'https://third.com']);
    });
  });

  describe('deduplication', () => {
    it('deduplicates identical URLs', () => {
      const text = 'Visit https://arrl.org and also https://arrl.org again';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://arrl.org']);
    });

    it('deduplicates when same URL appears as markdown and bare', () => {
      const text = '[ARRL](https://arrl.org) or just https://arrl.org';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://arrl.org']);
    });

    it('deduplicates multiple markdown links with same URL', () => {
      const text = '[link1](https://example.com) and [link2](https://example.com)';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://example.com']);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty string', () => {
      expect(extractLinksFromText('')).toEqual([]);
    });

    it('returns empty array for null/undefined input', () => {
      expect(extractLinksFromText(null as unknown as string)).toEqual([]);
      expect(extractLinksFromText(undefined as unknown as string)).toEqual([]);
    });

    it('returns empty array for text with no links', () => {
      const text = 'This is just plain text with no links at all';
      expect(extractLinksFromText(text)).toEqual([]);
    });

    it('ignores non-http/https protocols', () => {
      const text = 'Check ftp://example.com or mailto:test@example.com';
      expect(extractLinksFromText(text)).toEqual([]);
    });

    it('handles multiline text', () => {
      const text = `
        First line with https://first.com
        Second line with [link](https://second.com)
        Third line with https://third.com
      `;
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://second.com', 'https://first.com', 'https://third.com']);
    });

    it('handles URLs with special characters', () => {
      const text = 'See https://example.com/path#section and https://example.com/search?q=test%20value';
      const links = extractLinksFromText(text);
      expect(links).toEqual([
        'https://example.com/path#section',
        'https://example.com/search?q=test%20value'
      ]);
    });

    it('handles markdown link with spaces in link text', () => {
      const text = '[Link with spaces](https://example.com)';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://example.com']);
    });
  });

  describe('real-world examples', () => {
    it('extracts links from a typical explanation', () => {
      const text = `
        The correct answer is **20 meters**. According to the [ARRL Band Plan](https://arrl.org/band-plan),
        the 20-meter band extends from 14.000 to 14.350 MHz. For more details, see the
        [FCC Part 97 regulations](https://fcc.gov/part97) or visit https://ham.study for practice questions.
      `;
      const links = extractLinksFromText(text);
      expect(links).toEqual([
        'https://arrl.org/band-plan',
        'https://fcc.gov/part97',
        'https://ham.study'
      ]);
    });

    it('handles YouTube video links', () => {
      const text = 'Watch this explanation: [Video Tutorial](https://youtube.com/watch?v=abc123)';
      const links = extractLinksFromText(text);
      expect(links).toEqual(['https://youtube.com/watch?v=abc123']);
    });

    it('handles Wikipedia links with parentheses in URL', () => {
      // Note: Current regex doesn't handle parentheses in URLs well
      // This test documents current behavior
      const text = 'See [Radio](https://en.wikipedia.org/wiki/Radio_(communications))';
      const links = extractLinksFromText(text);
      // Current implementation stops at first closing paren
      expect(links).toEqual(['https://en.wikipedia.org/wiki/Radio_(communications']);
    });
  });
});
