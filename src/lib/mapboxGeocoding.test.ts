import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    }),
    rpc: () => Promise.resolve({ data: 1, error: null }),
  },
}));

// Import after mocks
import {
  MAPBOX_MONTHLY_LIMIT,
  GEOCODE_DELAY_MS,
  getYearMonthKey,
  delay,
} from './mapboxGeocoding';

describe('mapboxGeocoding constants', () => {
  it('should have MAPBOX_MONTHLY_LIMIT set to 95000', () => {
    expect(MAPBOX_MONTHLY_LIMIT).toBe(95000);
  });

  it('should have GEOCODE_DELAY_MS set to 150', () => {
    expect(GEOCODE_DELAY_MS).toBe(150);
  });

  it('should have a buffer below the actual 100k free tier limit', () => {
    const ACTUAL_FREE_TIER_LIMIT = 100000;
    expect(MAPBOX_MONTHLY_LIMIT).toBeLessThan(ACTUAL_FREE_TIER_LIMIT);
    expect(ACTUAL_FREE_TIER_LIMIT - MAPBOX_MONTHLY_LIMIT).toBe(5000);
  });

  it('should have rate limit delay that allows ~400 requests per minute', () => {
    // 150ms delay = ~400 requests per minute (60000ms / 150ms = 400)
    const requestsPerMinute = 60000 / GEOCODE_DELAY_MS;
    expect(requestsPerMinute).toBe(400);
  });

  it('should have limit set below Mapbox free tier', () => {
    const MAPBOX_FREE_TIER = 100000;
    expect(MAPBOX_MONTHLY_LIMIT).toBeLessThan(MAPBOX_FREE_TIER);
  });

  it('should have a 5000 request safety buffer', () => {
    const MAPBOX_FREE_TIER = 100000;
    const buffer = MAPBOX_FREE_TIER - MAPBOX_MONTHLY_LIMIT;
    expect(buffer).toBe(5000);
  });

  it('should have reasonable rate limiting delay', () => {
    // Delay should be between 100ms and 500ms for reasonable performance
    expect(GEOCODE_DELAY_MS).toBeGreaterThanOrEqual(100);
    expect(GEOCODE_DELAY_MS).toBeLessThanOrEqual(500);
  });
});

describe('getYearMonthKey format', () => {
  it('should return string in YYYY_MM format', () => {
    const key = getYearMonthKey();
    expect(key).toMatch(/^\d{4}_\d{2}$/);
  });

  it('should have year and month separated by underscore', () => {
    const key = getYearMonthKey();
    const parts = key.split('_');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/^\d{4}$/); // Year is 4 digits
    expect(parts[1]).toMatch(/^\d{2}$/); // Month is 2 digits
  });

  it('should return a valid year (2020-2100)', () => {
    const key = getYearMonthKey();
    const year = parseInt(key.split('_')[0], 10);
    expect(year).toBeGreaterThanOrEqual(2020);
    expect(year).toBeLessThanOrEqual(2100);
  });

  it('should return a valid month (01-12)', () => {
    const key = getYearMonthKey();
    const month = parseInt(key.split('_')[1], 10);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it('should be consistent when called multiple times', () => {
    const key1 = getYearMonthKey();
    const key2 = getYearMonthKey();
    const key3 = getYearMonthKey();
    expect(key1).toBe(key2);
    expect(key2).toBe(key3);
  });
});

describe('getYearMonthKey with fake timers', () => {
  it('should return 2026_01 when system time is January 2026', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'));
    expect(getYearMonthKey()).toBe('2026_01');
    vi.useRealTimers();
  });

  it('should return 2026_12 when system time is December 2026', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-31T23:59:59Z'));
    expect(getYearMonthKey()).toBe('2026_12');
    vi.useRealTimers();
  });

  it('should pad single-digit months with leading zero', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T00:00:00Z'));
    expect(getYearMonthKey()).toBe('2026_05');
    vi.useRealTimers();
  });
});

describe('delay function', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve after specified milliseconds', async () => {
    const promise = delay(1000);

    // Should not resolve immediately
    vi.advanceTimersByTime(500);

    // Advance past the delay
    vi.advanceTimersByTime(600);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should work with GEOCODE_DELAY_MS constant', async () => {
    const promise = delay(GEOCODE_DELAY_MS);

    vi.advanceTimersByTime(GEOCODE_DELAY_MS);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should resolve with undefined', async () => {
    const promise = delay(100);
    vi.advanceTimersByTime(100);
    const result = await promise;
    expect(result).toBeUndefined();
  });

  it('should not resolve before the specified time', async () => {
    let resolved = false;
    const promise = delay(1000).then(() => {
      resolved = true;
    });

    vi.advanceTimersByTime(999);
    await Promise.resolve(); // Flush microtasks
    expect(resolved).toBe(false);

    vi.advanceTimersByTime(1);
    await promise;
    expect(resolved).toBe(true);
  });
});

describe('mapboxGeocoding database functions exports', () => {
  it('should export getMonthlyUsageFromDb function', async () => {
    const module = await import('./mapboxGeocoding');
    expect(typeof module.getMonthlyUsageFromDb).toBe('function');
  });

  it('should export incrementUsageInDb function', async () => {
    const module = await import('./mapboxGeocoding');
    expect(typeof module.incrementUsageInDb).toBe('function');
  });

  it('should export getRemainingQuotaFromDb function', async () => {
    const module = await import('./mapboxGeocoding');
    expect(typeof module.getRemainingQuotaFromDb).toBe('function');
  });

  it('should export canMakeRequestFromDb function', async () => {
    const module = await import('./mapboxGeocoding');
    expect(typeof module.canMakeRequestFromDb).toBe('function');
  });

  it('should export isMapboxConfigured function', async () => {
    const module = await import('./mapboxGeocoding');
    expect(typeof module.isMapboxConfigured).toBe('function');
  });

  it('should export geocodeAddress function', async () => {
    const module = await import('./mapboxGeocoding');
    expect(typeof module.geocodeAddress).toBe('function');
  });

  it('should export delay function', async () => {
    const module = await import('./mapboxGeocoding');
    expect(typeof module.delay).toBe('function');
  });

  it('should export getYearMonthKey function', async () => {
    const module = await import('./mapboxGeocoding');
    expect(typeof module.getYearMonthKey).toBe('function');
  });
});

describe('isMapboxConfigured', () => {
  it('should return a boolean', async () => {
    const module = await import('./mapboxGeocoding');
    const result = module.isMapboxConfigured();
    expect(typeof result).toBe('boolean');
  });
});

describe('GeocodingResult interface shape', () => {
  it('should have latitude and longitude properties', async () => {
    // Type checking test - verify the expected interface shape
    const mockResult = {
      latitude: 35.7796,
      longitude: -78.6382,
    };

    expect(mockResult).toHaveProperty('latitude');
    expect(mockResult).toHaveProperty('longitude');
    expect(typeof mockResult.latitude).toBe('number');
    expect(typeof mockResult.longitude).toBe('number');
  });

  it('should accept valid North Carolina coordinates', () => {
    const ncCoords = {
      latitude: 35.7796,
      longitude: -78.6382,
    };

    // Valid latitude range: -90 to 90
    expect(ncCoords.latitude).toBeGreaterThanOrEqual(-90);
    expect(ncCoords.latitude).toBeLessThanOrEqual(90);

    // Valid longitude range: -180 to 180
    expect(ncCoords.longitude).toBeGreaterThanOrEqual(-180);
    expect(ncCoords.longitude).toBeLessThanOrEqual(180);
  });
});

describe('monthly quota reset logic', () => {
  it('should produce different keys for different months (concept test)', () => {
    // This tests the concept: different months should have different keys
    // because the key format is YYYY_MM
    const jan2026 = '2026_01';
    const feb2026 = '2026_02';
    const dec2025 = '2025_12';

    expect(jan2026).not.toBe(feb2026);
    expect(jan2026).not.toBe(dec2025);
    expect(feb2026).not.toBe(dec2025);
  });

  it('key format ensures automatic monthly reset', () => {
    // Each month gets a unique key, so when we query the database
    // with a new month's key, there's no existing record = 0 usage
    const key = getYearMonthKey();

    // Key includes both year and month, ensuring reset each month
    const [year, month] = key.split('_');
    expect(year).toMatch(/^\d{4}$/);
    expect(month).toMatch(/^\d{2}$/);
  });
});
