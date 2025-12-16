import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  STATUSPAGE_URL,
  STATUSPAGE_EMBED_SCRIPT,
  isStatusPageAvailable,
  openStatusWidget,
  getStatusPageUrl,
} from './statuspage';

describe('statuspage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up any existing statusEmbedTest
    delete (window as Window).statusEmbedTest;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as Window).statusEmbedTest;
  });

  describe('constants', () => {
    it('should have correct STATUSPAGE_URL', () => {
      expect(STATUSPAGE_URL).toBe('https://openhamprep.statuspage.io');
    });

    it('should have correct STATUSPAGE_EMBED_SCRIPT', () => {
      expect(STATUSPAGE_EMBED_SCRIPT).toBe('https://openhamprep.statuspage.io/embed/script.js');
    });

    it('should not contain old incorrect URL', () => {
      expect(STATUSPAGE_URL).not.toContain('openhamprep1');
      expect(STATUSPAGE_EMBED_SCRIPT).not.toContain('openhamprep1');
    });
  });

  describe('isStatusPageAvailable', () => {
    it('should return false when statusEmbedTest is not defined', () => {
      expect(isStatusPageAvailable()).toBe(false);
    });

    it('should return false when statusEmbedTest is not a function', () => {
      (window as Window & { statusEmbedTest?: unknown }).statusEmbedTest = 'not a function';
      expect(isStatusPageAvailable()).toBe(false);
    });

    it('should return true when statusEmbedTest is a function', () => {
      window.statusEmbedTest = vi.fn();
      expect(isStatusPageAvailable()).toBe(true);
    });
  });

  describe('openStatusWidget', () => {
    it('should return false when widget is not available', () => {
      const result = openStatusWidget();
      expect(result).toBe(false);
    });

    it('should call statusEmbedTest and return true when available', () => {
      const mockStatusEmbedTest = vi.fn();
      window.statusEmbedTest = mockStatusEmbedTest;

      const result = openStatusWidget();

      expect(result).toBe(true);
      expect(mockStatusEmbedTest).toHaveBeenCalledTimes(1);
    });

    it('should not throw when widget is not available', () => {
      expect(() => openStatusWidget()).not.toThrow();
    });
  });

  describe('getStatusPageUrl', () => {
    it('should return the correct status page URL', () => {
      expect(getStatusPageUrl()).toBe('https://openhamprep.statuspage.io');
    });
  });
});

describe('index.html statuspage script', () => {
  const indexHtmlPath = resolve(__dirname, '../../index.html');
  let indexHtmlContent: string;

  beforeEach(() => {
    indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');
  });

  it('should contain the statuspage embed script', () => {
    expect(indexHtmlContent).toContain('statuspage.io/embed/script.js');
  });

  it('should use correct statuspage subdomain (openhamprep, not openhamprep1)', () => {
    expect(indexHtmlContent).toContain('https://openhamprep.statuspage.io/embed/script.js');
    expect(indexHtmlContent).not.toContain('openhamprep1.statuspage.io');
  });

  it('should have script tag matching STATUSPAGE_EMBED_SCRIPT constant', () => {
    expect(indexHtmlContent).toContain(STATUSPAGE_EMBED_SCRIPT);
  });
});
