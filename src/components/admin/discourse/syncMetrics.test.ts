import { describe, it, expect } from 'vitest';
import { countDiscrepancies, syncedPercent } from './syncMetrics';
import type { VerifyResult } from '@/hooks/useDiscourseSyncStatus';

const withDiscrepancies = (d: Partial<VerifyResult['discrepancies']>): VerifyResult =>
  ({ discrepancies: { orphanedInDiscourse: [], brokenForumUrl: [], missingStatus: [], ...d } }) as VerifyResult;

describe('syncedPercent', () => {
  it('is the synced share out of 100', () => {
    expect(syncedPercent(5, 10)).toBe(50);
    expect(syncedPercent(10, 10)).toBe(100);
  });

  it('is 0 rather than NaN when there is nothing to count', () => {
    expect(syncedPercent(0, 0)).toBe(0);
  });
});

describe('countDiscrepancies', () => {
  it('adds up all three kinds', () => {
    const result = withDiscrepancies({
      orphanedInDiscourse: [{ questionDisplayName: 'T1A01', topicId: 1, topicUrl: 'u' }],
      brokenForumUrl: [
        { questionId: 'a', questionDisplayName: 'T1A02', forumUrl: 'u', error: 'e' },
        { questionId: 'b', questionDisplayName: 'T1A03', forumUrl: 'u', error: 'e' },
      ],
      missingStatus: [{ questionId: 'c', questionDisplayName: 'T1A04', forumUrl: 'u' }],
    });
    expect(countDiscrepancies(result)).toBe(4);
  });

  it('is 0 for a clean verification', () => {
    expect(countDiscrepancies(withDiscrepancies({}))).toBe(0);
  });
});
