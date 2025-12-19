import { describe, it, expect } from 'vitest';
import {
  isCrawler,
  escapeHtml,
  isValidQuestionId,
  getLicenseName,
  buildQuestionUrl,
  buildOpenGraphHtml,
  CRAWLER_PATTERNS,
} from './opengraph';

describe('opengraph utilities', () => {
  describe('isCrawler', () => {
    it('returns false for null user agent', () => {
      expect(isCrawler(null)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isCrawler('')).toBe(false);
    });

    it('returns false for regular browser user agents', () => {
      const browserUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      ];

      browserUserAgents.forEach(ua => {
        expect(isCrawler(ua)).toBe(false);
      });
    });

    it('detects Discourse bot', () => {
      expect(isCrawler('Discoursebot/1.0')).toBe(true);
      expect(isCrawler('Mozilla/5.0 (compatible; Discoursebot/1.0)')).toBe(true);
    });

    it('detects Facebook crawler', () => {
      expect(isCrawler('facebookexternalhit/1.1')).toBe(true);
      expect(isCrawler('Facebot')).toBe(true);
    });

    it('detects Twitter bot', () => {
      expect(isCrawler('Twitterbot/1.0')).toBe(true);
    });

    it('detects LinkedIn bot', () => {
      expect(isCrawler('LinkedInBot/1.0')).toBe(true);
    });

    it('detects Slack bot', () => {
      expect(isCrawler('Slackbot-LinkExpanding 1.0')).toBe(true);
    });

    it('detects Google bot', () => {
      expect(isCrawler('Googlebot/2.1')).toBe(true);
      expect(isCrawler('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
    });

    it('detects Telegram bot', () => {
      expect(isCrawler('TelegramBot (like TwitterBot)')).toBe(true);
    });

    it('detects WhatsApp', () => {
      expect(isCrawler('WhatsApp/2.19.81')).toBe(true);
    });

    it('is case insensitive', () => {
      expect(isCrawler('GOOGLEBOT/2.1')).toBe(true);
      expect(isCrawler('googlebot/2.1')).toBe(true);
      expect(isCrawler('DISCOURSEBOT')).toBe(true);
    });

    it('detects all known crawler patterns', () => {
      CRAWLER_PATTERNS.forEach(pattern => {
        expect(isCrawler(pattern)).toBe(true);
        expect(isCrawler(`Mozilla/5.0 (compatible; ${pattern})`)).toBe(true);
      });
    });
  });

  describe('escapeHtml', () => {
    it('escapes ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('escapes less than signs', () => {
      expect(escapeHtml('a < b')).toBe('a &lt; b');
    });

    it('escapes greater than signs', () => {
      expect(escapeHtml('a > b')).toBe('a &gt; b');
    });

    it('escapes double quotes', () => {
      expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
    });

    it('escapes single quotes', () => {
      expect(escapeHtml("It's fine")).toBe("It&#039;s fine");
    });

    it('handles multiple special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
      );
    });

    it('returns empty string for empty input', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('leaves regular text unchanged', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('isValidQuestionId', () => {
    it('accepts valid Technician question IDs', () => {
      expect(isValidQuestionId('T1A01')).toBe(true);
      expect(isValidQuestionId('T9Z99')).toBe(true);
      expect(isValidQuestionId('t1a01')).toBe(true); // lowercase
    });

    it('accepts valid General question IDs', () => {
      expect(isValidQuestionId('G1A01')).toBe(true);
      expect(isValidQuestionId('G9Z99')).toBe(true);
      expect(isValidQuestionId('g2b03')).toBe(true); // lowercase
    });

    it('accepts valid Extra question IDs', () => {
      expect(isValidQuestionId('E1A01')).toBe(true);
      expect(isValidQuestionId('E9Z99')).toBe(true);
      expect(isValidQuestionId('e3c12')).toBe(true); // lowercase
    });

    it('rejects invalid prefixes', () => {
      expect(isValidQuestionId('A1A01')).toBe(false);
      expect(isValidQuestionId('X1A01')).toBe(false);
      expect(isValidQuestionId('11A01')).toBe(false);
    });

    it('rejects invalid formats', () => {
      expect(isValidQuestionId('T1A1')).toBe(false); // too short
      expect(isValidQuestionId('T1A001')).toBe(false); // too long
      expect(isValidQuestionId('TAA01')).toBe(false); // letter instead of number
      expect(isValidQuestionId('T1101')).toBe(false); // number instead of letter
      expect(isValidQuestionId('T1A0A')).toBe(false); // letter at end
    });

    it('rejects empty string', () => {
      expect(isValidQuestionId('')).toBe(false);
    });

    it('rejects strings with spaces', () => {
      expect(isValidQuestionId('T1A 01')).toBe(false);
      expect(isValidQuestionId(' T1A01')).toBe(false);
    });
  });

  describe('getLicenseName', () => {
    it('returns Technician for T prefix', () => {
      expect(getLicenseName('T1A01')).toBe('Technician');
      expect(getLicenseName('t1a01')).toBe('Technician');
    });

    it('returns General for G prefix', () => {
      expect(getLicenseName('G2B03')).toBe('General');
      expect(getLicenseName('g2b03')).toBe('General');
    });

    it('returns Extra for E prefix', () => {
      expect(getLicenseName('E3C12')).toBe('Extra');
      expect(getLicenseName('e3c12')).toBe('Extra');
    });

    it('returns Amateur Radio for unknown prefix', () => {
      expect(getLicenseName('X1A01')).toBe('Amateur Radio');
      expect(getLicenseName('A1A01')).toBe('Amateur Radio');
    });
  });

  describe('buildQuestionUrl', () => {
    it('builds correct URL with lowercase question ID', () => {
      expect(buildQuestionUrl('T1A01', 'https://example.com')).toBe(
        'https://example.com/questions/t1a01'
      );
    });

    it('handles already lowercase IDs', () => {
      expect(buildQuestionUrl('t1a01', 'https://example.com')).toBe(
        'https://example.com/questions/t1a01'
      );
    });

    it('works with different site URLs', () => {
      expect(buildQuestionUrl('G2B03', 'https://openhamprep.app')).toBe(
        'https://openhamprep.app/questions/g2b03'
      );
    });
  });

  describe('buildOpenGraphHtml', () => {
    const defaultParams = {
      questionId: 'T1A01',
      questionText: 'What is the purpose of the FCC rules?',
      siteUrl: 'https://openhamprep.app',
      siteName: 'Open Ham Prep',
      imageUrl: 'https://openhamprep.app/icons/icon-512.png',
    };

    it('generates valid HTML document', () => {
      const html = buildOpenGraphHtml(defaultParams);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
    });

    it('includes correct og:title', () => {
      const html = buildOpenGraphHtml(defaultParams);

      expect(html).toContain('<meta property="og:title" content="Question T1A01 | Open Ham Prep">');
    });

    it('includes correct og:description with question text', () => {
      const html = buildOpenGraphHtml(defaultParams);

      expect(html).toContain(
        '<meta property="og:description" content="What is the purpose of the FCC rules?">'
      );
    });

    it('includes correct og:url', () => {
      const html = buildOpenGraphHtml(defaultParams);

      expect(html).toContain(
        '<meta property="og:url" content="https://openhamprep.app/questions/t1a01">'
      );
    });

    it('includes og:image', () => {
      const html = buildOpenGraphHtml(defaultParams);

      expect(html).toContain(
        '<meta property="og:image" content="https://openhamprep.app/icons/icon-512.png">'
      );
    });

    it('includes Twitter card meta tags', () => {
      const html = buildOpenGraphHtml(defaultParams);

      expect(html).toContain('<meta name="twitter:card" content="summary">');
      expect(html).toContain('<meta name="twitter:title"');
      expect(html).toContain('<meta name="twitter:description"');
      expect(html).toContain('<meta name="twitter:image"');
    });

    it('includes canonical link', () => {
      const html = buildOpenGraphHtml(defaultParams);

      expect(html).toContain(
        '<link rel="canonical" href="https://openhamprep.app/questions/t1a01">'
      );
    });

    it('includes article:section with license name', () => {
      const html = buildOpenGraphHtml(defaultParams);

      expect(html).toContain(
        '<meta property="article:section" content="Technician License Exam">'
      );
    });

    it('escapes HTML in question text', () => {
      const html = buildOpenGraphHtml({
        ...defaultParams,
        questionText: 'What does "P < 10W" mean?',
      });

      expect(html).toContain('&quot;P &lt; 10W&quot;');
      expect(html).not.toContain('"P < 10W"');
    });

    it('includes body content for accessibility', () => {
      const html = buildOpenGraphHtml(defaultParams);

      expect(html).toContain('<h1>Question T1A01 | Open Ham Prep</h1>');
      expect(html).toContain('<p>What is the purpose of the FCC rules?</p>');
      expect(html).toContain('View this question on Open Ham Prep');
    });

    it('handles General license questions', () => {
      const html = buildOpenGraphHtml({
        ...defaultParams,
        questionId: 'G2B03',
      });

      expect(html).toContain('Question G2B03');
      expect(html).toContain('General License Exam');
    });

    it('handles Extra license questions', () => {
      const html = buildOpenGraphHtml({
        ...defaultParams,
        questionId: 'E3C12',
      });

      expect(html).toContain('Question E3C12');
      expect(html).toContain('Extra License Exam');
    });
  });
});
