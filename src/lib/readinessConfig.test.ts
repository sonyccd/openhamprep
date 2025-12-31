import { describe, it, expect } from 'vitest';
import {
  READINESS_CONFIG,
  calculateReadinessLevel,
  getReadinessMessage,
  getReadinessTitle,
  getReadinessProgress,
} from './readinessConfig';

describe('readinessConfig', () => {
  describe('READINESS_CONFIG', () => {
    it('has all readiness levels defined', () => {
      expect(READINESS_CONFIG['not-started']).toBeDefined();
      expect(READINESS_CONFIG['needs-work']).toBeDefined();
      expect(READINESS_CONFIG['getting-close']).toBeDefined();
      expect(READINESS_CONFIG['ready']).toBeDefined();
    });

    it('has correct progress values', () => {
      expect(READINESS_CONFIG['not-started'].progress).toBe(0);
      expect(READINESS_CONFIG['needs-work'].progress).toBe(33);
      expect(READINESS_CONFIG['getting-close'].progress).toBe(66);
      expect(READINESS_CONFIG['ready'].progress).toBe(100);
    });
  });

  describe('calculateReadinessLevel', () => {
    it('returns not-started when no tests taken', () => {
      expect(calculateReadinessLevel(0, 0, 0, 0)).toBe('not-started');
    });

    it('returns ready when score >= 85% and 3+ passes in recent tests', () => {
      expect(calculateReadinessLevel(5, 90, 4, 5)).toBe('ready');
    });

    it('returns ready when score >= 85% and passes equal min(3, testCount)', () => {
      // With only 2 tests, need 2 passes (min(3, 2) = 2)
      expect(calculateReadinessLevel(2, 88, 2, 2)).toBe('ready');
    });

    it('returns getting-close when score >= 74% with at least 1 pass', () => {
      expect(calculateReadinessLevel(3, 78, 1, 3)).toBe('getting-close');
    });

    it('returns needs-work when tests taken but not meeting criteria', () => {
      expect(calculateReadinessLevel(3, 65, 0, 3)).toBe('needs-work');
    });

    it('returns needs-work when high score but no passes', () => {
      expect(calculateReadinessLevel(3, 80, 0, 3)).toBe('needs-work');
    });
  });

  describe('getReadinessMessage', () => {
    it('returns correct message for not-started', () => {
      expect(getReadinessMessage('not-started')).toBe(
        'Take some practice tests to see your readiness'
      );
    });

    it('returns correct message for needs-work', () => {
      expect(getReadinessMessage('needs-work')).toBe(
        'Keep practicing to improve your scores'
      );
    });

    it('returns correct message for getting-close', () => {
      expect(getReadinessMessage('getting-close')).toBe(
        "Almost there! A few more passing scores and you'll be ready"
      );
    });

    it('returns correct message for ready', () => {
      expect(getReadinessMessage('ready')).toBe(
        "You're ready to take the real exam!"
      );
    });
  });

  describe('getReadinessTitle', () => {
    it('returns correct title for not-started', () => {
      expect(getReadinessTitle('not-started')).toBe('Test Readiness Unknown');
    });

    it('returns correct title for needs-work', () => {
      expect(getReadinessTitle('needs-work')).toBe('Not Ready Yet');
    });

    it('returns correct title for getting-close', () => {
      expect(getReadinessTitle('getting-close')).toBe('Almost Ready!');
    });

    it('returns correct title for ready', () => {
      expect(getReadinessTitle('ready')).toBe('Ready to Pass!');
    });
  });

  describe('getReadinessProgress', () => {
    it('returns 0 for not-started', () => {
      expect(getReadinessProgress('not-started')).toBe(0);
    });

    it('returns 40 for needs-work', () => {
      expect(getReadinessProgress('needs-work')).toBe(40);
    });

    it('returns 75 for getting-close', () => {
      expect(getReadinessProgress('getting-close')).toBe(75);
    });

    it('returns 100 for ready', () => {
      expect(getReadinessProgress('ready')).toBe(100);
    });
  });
});
