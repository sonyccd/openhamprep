import { describe, it, expect } from 'vitest';
import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  // ===========================================================================
  // Structure & Consistency
  // ===========================================================================
  describe('structure', () => {
    it('has all expected domain namespaces', () => {
      const domains = Object.keys(queryKeys);
      expect(domains).toEqual(
        expect.arrayContaining([
          'questions',
          'bookmarks',
          'progress',
          'readiness',
          'topics',
          'lessons',
          'glossary',
          'examSessions',
          'targetExam',
          'examAttempts',
          'arrlChapters',
          'auth',
          'alerts',
          'feedback',
          'hamRadioTools',
          'discourse',
          'geocoding',
          'adminStats',
        ])
      );
    });
  });

  // ===========================================================================
  // Questions Domain
  // ===========================================================================
  describe('questions', () => {
    it('.root returns base key array', () => {
      expect(queryKeys.questions.root).toEqual(['questions']);
    });

    it('.all() without params matches .root for hierarchical invalidation', () => {
      expect(queryKeys.questions.all()).toEqual(queryKeys.questions.root);
    });

    it('.all(testType) includes the test type', () => {
      expect(queryKeys.questions.all('technician')).toEqual(['questions', 'technician']);
      expect(queryKeys.questions.all('general')).toEqual(['questions', 'general']);
      expect(queryKeys.questions.all('extra')).toEqual(['questions', 'extra']);
    });

    it('.detail(id) uses singular "question" prefix', () => {
      expect(queryKeys.questions.detail('q-123')).toEqual(['question', 'q-123']);
    });

    it('.byIds sorts IDs for cache consistency', () => {
      const key1 = queryKeys.questions.byIds(['c', 'a', 'b']);
      const key2 = queryKeys.questions.byIds(['b', 'a', 'c']);
      expect(key1).toEqual(key2);
      expect(key1).toEqual(['questions-by-ids', ['a', 'b', 'c']]);
    });

    it('.admin() follows same pattern as .all()', () => {
      expect(queryKeys.questions.admin()).toEqual(['admin-questions']);
      expect(queryKeys.questions.admin('technician')).toEqual(['admin-questions', 'technician']);
    });
  });

  // ===========================================================================
  // Bookmarks Domain
  // ===========================================================================
  describe('bookmarks', () => {
    it('.all(userId) includes user scope', () => {
      expect(queryKeys.bookmarks.all('user-1')).toEqual(['bookmarks', 'user-1']);
    });

    it('different users get different keys', () => {
      expect(queryKeys.bookmarks.all('user-1')).not.toEqual(
        queryKeys.bookmarks.all('user-2')
      );
    });
  });

  // ===========================================================================
  // Progress Domain
  // ===========================================================================
  describe('progress', () => {
    it('each user-scoped key includes userId', () => {
      const uid = 'user-abc';
      expect(queryKeys.progress.streak(uid)).toContain(uid);
      expect(queryKeys.progress.attempts(uid)).toContain(uid);
      expect(queryKeys.progress.testResults(uid)).toContain(uid);
      expect(queryKeys.progress.profileStats(uid)).toContain(uid);
      expect(queryKeys.progress.weeklyGoals(uid)).toContain(uid);
    });

    it('progress keys use distinct prefixes to avoid collisions', () => {
      const uid = 'u1';
      const prefixes = [
        queryKeys.progress.streak(uid)[0],
        queryKeys.progress.attempts(uid)[0],
        queryKeys.progress.testResults(uid)[0],
        queryKeys.progress.profileStats(uid)[0],
        queryKeys.progress.weeklyGoals(uid)[0],
      ];
      // All prefixes should be unique
      expect(new Set(prefixes).size).toBe(prefixes.length);
    });
  });

  // ===========================================================================
  // Readiness Domain
  // ===========================================================================
  describe('readiness', () => {
    it('.score() includes user and exam type', () => {
      expect(queryKeys.readiness.score('u1', 'technician')).toEqual([
        'readiness', 'u1', 'technician',
      ]);
    });

    it('.byUser() is a prefix of .score() for hierarchical invalidation', () => {
      const byUser = queryKeys.readiness.byUser('u1');
      const score = queryKeys.readiness.score('u1', 'technician');
      // byUser should be a prefix of score
      expect(score.slice(0, byUser.length)).toEqual(byUser);
    });

    it('.snapshotsByUser() is a prefix of .snapshots()', () => {
      const byUser = queryKeys.readiness.snapshotsByUser('u1');
      const full = queryKeys.readiness.snapshots('u1', 'general', 30);
      expect(full.slice(0, byUser.length)).toEqual(byUser);
    });
  });

  // ===========================================================================
  // Alerts Domain
  // ===========================================================================
  describe('alerts', () => {
    it('.all() without status is prefix of .all(status)', () => {
      const root = queryKeys.alerts.all();
      const filtered = queryKeys.alerts.all('active');
      expect(root).toEqual(['alerts']);
      expect(filtered).toEqual(['alerts', 'active']);
      expect(filtered.slice(0, root.length)).toEqual(root);
    });

    it('.unacknowledgedCount() nests under alerts prefix', () => {
      expect(queryKeys.alerts.unacknowledgedCount()).toEqual([
        'alerts', 'unacknowledged-count',
      ]);
    });
  });

  // ===========================================================================
  // Cross-domain key uniqueness
  // ===========================================================================
  describe('cross-domain uniqueness', () => {
    it('root prefixes across domains do not collide', () => {
      // Collect all "root" or base keys from each domain
      const rootKeys = [
        queryKeys.questions.root[0],
        queryKeys.bookmarks.all('x')[0],
        queryKeys.progress.root[0],
        queryKeys.readiness.score('x', 'technician')[0],
        queryKeys.topics.all()[0],
        queryKeys.lessons.all()[0],
        queryKeys.glossary.terms()[0],
        queryKeys.examSessions.all()[0],
        queryKeys.arrlChapters.all()[0],
        queryKeys.alerts.all()[0],
        queryKeys.feedback.forQuestion('q', 'u')[0],
        queryKeys.hamRadioTools.categories()[0],
        queryKeys.discourse.overview()[0],
        queryKeys.geocoding.usage()[0],
        queryKeys.adminStats.questions()[0],
      ];

      // All should be unique strings
      expect(new Set(rootKeys).size).toBe(rootKeys.length);
    });
  });

  // ===========================================================================
  // Type safety (compile-time checks surfaced as runtime)
  // ===========================================================================
  describe('type safety', () => {
    it('keys are readonly arrays (as const)', () => {
      const key = queryKeys.questions.all('technician');
      // TypeScript `as const` makes arrays readonly at compile time.
      // At runtime we can verify the array contents are correct.
      expect(Object.isFrozen(key)).toBe(false); // as const doesn't freeze at runtime
      expect(key).toEqual(['questions', 'technician']);
    });
  });
});
