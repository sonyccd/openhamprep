import { describe, it, expect } from 'vitest';
import { describeNextRun, formatTimeAbbrev, MONITOR_INTERVAL_MS } from './alertPresentation';
import type { MonitorRun } from '@/hooks/useAlerts';

const runAt = (startedAt: number): MonitorRun =>
  ({ id: 'r', started_at: new Date(startedAt).toISOString(), status: 'completed' }) as MonitorRun;

describe('formatTimeAbbrev', () => {
  it('shortens every unit, singular and plural', () => {
    const now = Date.now();
    expect(formatTimeAbbrev(new Date(now - 1_000))).toBe('1s ago');
    expect(formatTimeAbbrev(new Date(now - 29 * 60_000))).toBe('29m ago');
    expect(formatTimeAbbrev(new Date(now - 60 * 60_000))).toBe('1h ago');
    expect(formatTimeAbbrev(new Date(now - 2 * 24 * 60 * 60_000))).toBe('2d ago');
  });

  it('keeps the suffix direction for future times', () => {
    expect(formatTimeAbbrev(new Date(Date.now() + 3 * 60_000))).toBe('in 3m');
  });
});

describe('describeNextRun', () => {
  it('counts down to the next scheduled run', () => {
    const now = Date.now();
    expect(describeNextRun(runAt(now - 2 * 60_000), now)).toBe('in 3m');
  });

  it('says "soon" once the schedule has slipped', () => {
    const now = Date.now();
    expect(describeNextRun(runAt(now - MONITOR_INTERVAL_MS - 1), now)).toBe('soon');
  });
});
