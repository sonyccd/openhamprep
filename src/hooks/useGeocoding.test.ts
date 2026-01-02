import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useGeocodeResumableProgress,
  useMapboxUsage,
  useClientGeocoding,
  clearGeocodeProgress,
  type GeocodeProgressState,
} from './useGeocoding';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock mapbox geocoding functions
const mockGetMonthlyUsageFromDb = vi.fn();
const mockGetRemainingQuotaFromDb = vi.fn();
const mockCanMakeRequestFromDb = vi.fn();
const mockGeocodeAddress = vi.fn();
const mockIsMapboxConfigured = vi.fn();

vi.mock('@/lib/mapboxGeocoding', () => ({
  getMonthlyUsageFromDb: () => mockGetMonthlyUsageFromDb(),
  getRemainingQuotaFromDb: () => mockGetRemainingQuotaFromDb(),
  canMakeRequestFromDb: () => mockCanMakeRequestFromDb(),
  geocodeAddress: (...args: unknown[]) => mockGeocodeAddress(...args),
  isMapboxConfigured: () => mockIsMapboxConfigured(),
  delay: () => Promise.resolve(),
  GEOCODE_DELAY_MS: 150,
  MAPBOX_MONTHLY_LIMIT: 95000,
}));

// Mock supabase for database updates
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate,
    })),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useGeocoding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // Default mock implementations
    mockGetMonthlyUsageFromDb.mockResolvedValue(0);
    mockGetRemainingQuotaFromDb.mockResolvedValue(95000);
    mockCanMakeRequestFromDb.mockResolvedValue(true);
    mockIsMapboxConfigured.mockReturnValue(true);
    mockGeocodeAddress.mockResolvedValue({ latitude: 35.7796, longitude: -78.6382 });

    // Database update chain
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('clearGeocodeProgress', () => {
    it('should remove progress from localStorage', () => {
      localStorageMock.setItem(
        'geocode_progress',
        JSON.stringify({ processedIds: ['1', '2'], lastProcessedAt: new Date().toISOString(), totalAtStart: 5 })
      );

      clearGeocodeProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('geocode_progress');
    });
  });

  describe('useGeocodeResumableProgress', () => {
    it('should return null when no progress is saved', () => {
      const { result } = renderHook(() => useGeocodeResumableProgress(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeNull();
    });

    it('should return saved progress from localStorage', async () => {
      const savedProgress: GeocodeProgressState = {
        processedIds: ['session-1', 'session-2'],
        lastProcessedAt: '2026-01-02T10:00:00Z',
        totalAtStart: 10,
      };
      localStorageMock.setItem('geocode_progress', JSON.stringify(savedProgress));

      const { result } = renderHook(() => useGeocodeResumableProgress(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current?.processedIds).toEqual(['session-1', 'session-2']);
      expect(result.current?.totalAtStart).toBe(10);
    });

    it('should return null when localStorage has invalid JSON', () => {
      localStorageMock.setItem('geocode_progress', 'invalid json');

      const { result } = renderHook(() => useGeocodeResumableProgress(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeNull();
    });
  });

  describe('useMapboxUsage', () => {
    it('should return default values when loading', () => {
      const { result } = renderHook(() => useMapboxUsage(), {
        wrapper: createWrapper(),
      });

      // Initial values before query completes
      expect(result.current.limit).toBe(95000);
      expect(typeof result.current.current).toBe('number');
      expect(typeof result.current.remaining).toBe('number');
    });

    it('should return usage data from database', async () => {
      mockGetMonthlyUsageFromDb.mockResolvedValue(5000);

      const { result } = renderHook(() => useMapboxUsage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.current).toBe(5000);
      });

      expect(result.current.remaining).toBe(90000);
      expect(result.current.limit).toBe(95000);
    });

    it('should return isConfigured status', async () => {
      mockIsMapboxConfigured.mockReturnValue(true);

      const { result } = renderHook(() => useMapboxUsage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isConfigured).toBe(true);
      });
    });

    it('should return isConfigured as false when not configured', async () => {
      mockIsMapboxConfigured.mockReturnValue(false);

      const { result } = renderHook(() => useMapboxUsage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isConfigured).toBe(false);
      });
    });

    it('should provide refreshUsage function', async () => {
      const { result } = renderHook(() => useMapboxUsage(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refreshUsage).toBe('function');
    });
  });

  describe('useClientGeocoding', () => {
    const mockSessions = [
      {
        id: 'session-1',
        address: '123 Main St',
        city: 'Raleigh',
        state: 'NC',
        zip: '27601',
        latitude: null,
        longitude: null,
      },
      {
        id: 'session-2',
        address: '456 Oak Ave',
        city: 'Durham',
        state: 'NC',
        zip: '27701',
        latitude: null,
        longitude: null,
      },
    ];

    it('should provide mutate function', () => {
      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.mutate).toBe('function');
      expect(typeof result.current.mutateAsync).toBe('function');
    });

    it('should throw error when Mapbox is not configured', async () => {
      mockIsMapboxConfigured.mockReturnValue(false);

      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ sessions: mockSessions as any });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Mapbox access token not configured');
    });

    it('should throw error when quota is exceeded', async () => {
      mockGetRemainingQuotaFromDb.mockResolvedValue(1); // Only 1 request allowed

      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({ sessions: mockSessions as any }); // 2 sessions need geocoding
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Not enough Mapbox quota');
    });

    it('should geocode sessions and update database', async () => {
      const onProgress = vi.fn();

      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          sessions: mockSessions as any,
          onProgress,
        });
      });

      // Should have called geocodeAddress for each session
      expect(mockGeocodeAddress).toHaveBeenCalledTimes(2);

      // Should have called progress callback
      expect(onProgress).toHaveBeenCalled();
    });

    it('should skip sessions that already have coordinates', async () => {
      const sessionsWithCoords = [
        {
          id: 'session-1',
          address: '123 Main St',
          city: 'Raleigh',
          state: 'NC',
          zip: '27601',
          latitude: 35.7796,
          longitude: -78.6382,
        },
        {
          id: 'session-2',
          address: '456 Oak Ave',
          city: 'Durham',
          state: 'NC',
          zip: '27701',
          latitude: null,
          longitude: null,
        },
      ];

      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ sessions: sessionsWithCoords as any });
      });

      // Should only geocode the second session (missing coords)
      expect(mockGeocodeAddress).toHaveBeenCalledTimes(1);
      expect(mockGeocodeAddress).toHaveBeenCalledWith('456 Oak Ave', 'Durham', 'NC', '27701');
    });

    it('should skip sessions missing address info', async () => {
      const incompleteSessions = [
        {
          id: 'session-1',
          address: null, // Missing address
          city: 'Raleigh',
          state: 'NC',
          zip: '27601',
          latitude: null,
          longitude: null,
        },
        {
          id: 'session-2',
          address: '456 Oak Ave',
          city: null, // Missing city
          state: 'NC',
          zip: '27701',
          latitude: null,
          longitude: null,
        },
      ];

      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ sessions: incompleteSessions as any });
      });

      // Neither session should be geocoded
      expect(mockGeocodeAddress).not.toHaveBeenCalled();
    });

    it('should save progress to localStorage during geocoding', async () => {
      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ sessions: mockSessions as any });
      });

      // Progress should have been saved
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'geocode_progress',
        expect.any(String)
      );
    });

    it('should clear progress after successful completion', async () => {
      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ sessions: mockSessions as any });
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('geocode_progress');
    });

    it('should resume from saved progress', async () => {
      // Save progress indicating session-1 was already processed
      const savedProgress: GeocodeProgressState = {
        processedIds: ['session-1'],
        lastProcessedAt: new Date().toISOString(),
        totalAtStart: 2,
      };
      localStorageMock.setItem('geocode_progress', JSON.stringify(savedProgress));

      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ sessions: mockSessions as any });
      });

      // Should only geocode session-2 (session-1 already processed)
      expect(mockGeocodeAddress).toHaveBeenCalledTimes(1);
      expect(mockGeocodeAddress).toHaveBeenCalledWith('456 Oak Ave', 'Durham', 'NC', '27701');
    });

    it('should force geocode all sessions when forceAll is true', async () => {
      const sessionsWithCoords = [
        {
          id: 'session-1',
          address: '123 Main St',
          city: 'Raleigh',
          state: 'NC',
          zip: '27601',
          latitude: 35.7796,
          longitude: -78.6382,
        },
      ];

      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          sessions: sessionsWithCoords as any,
          forceAll: true,
        });
      });

      // Should geocode even though it has coordinates (forceAll)
      expect(mockGeocodeAddress).toHaveBeenCalledTimes(1);
    });

    it('should ignore saved progress when forceAll is true', async () => {
      // Save progress indicating session-1 was processed
      const savedProgress: GeocodeProgressState = {
        processedIds: ['session-1'],
        lastProcessedAt: new Date().toISOString(),
        totalAtStart: 2,
      };
      localStorageMock.setItem('geocode_progress', JSON.stringify(savedProgress));

      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          sessions: mockSessions as any,
          forceAll: true,
        });
      });

      // Should geocode both sessions, ignoring saved progress
      expect(mockGeocodeAddress).toHaveBeenCalledTimes(2);
    });

    it('should handle geocoding failures gracefully', async () => {
      // First call succeeds, second fails
      mockGeocodeAddress
        .mockResolvedValueOnce({ latitude: 35.7796, longitude: -78.6382 })
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const data = await result.current.mutateAsync({ sessions: mockSessions as any });
        expect(data.processed).toBe(1);
        expect(data.skipped).toBe(1);
      });
    });

    it('should stop if quota is exhausted mid-process', async () => {
      // First check passes, subsequent checks fail
      mockCanMakeRequestFromDb
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ sessions: mockSessions as any });
        } catch (error: any) {
          expect(error.message).toContain('Monthly geocoding limit reached');
        }
      });
    });

    it('should return correct counts on success', async () => {
      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const data = await result.current.mutateAsync({ sessions: mockSessions as any });

        expect(data).toEqual({
          processed: 2,
          skipped: 0,
          total: 2,
        });
      });
    });

    it('should call onProgress with correct values', async () => {
      const onProgress = vi.fn();

      const { result } = renderHook(() => useClientGeocoding(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          sessions: mockSessions as any,
          onProgress,
        });
      });

      // Check progress was called with expected structure
      expect(onProgress).toHaveBeenCalled();
      const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
      expect(lastCall).toHaveProperty('processed');
      expect(lastCall).toHaveProperty('remaining');
      expect(lastCall).toHaveProperty('total');
      expect(lastCall).toHaveProperty('monthlyUsage');
      expect(lastCall).toHaveProperty('monthlyLimit');
    });
  });
});

describe('useGeocoding localStorage persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('should persist processedIds array', () => {
    const progress: GeocodeProgressState = {
      processedIds: ['a', 'b', 'c'],
      lastProcessedAt: '2026-01-02T12:00:00Z',
      totalAtStart: 5,
    };

    localStorageMock.setItem('geocode_progress', JSON.stringify(progress));
    const stored = JSON.parse(localStorageMock.getItem('geocode_progress') || '{}');

    expect(stored.processedIds).toEqual(['a', 'b', 'c']);
  });

  it('should persist lastProcessedAt timestamp', () => {
    const timestamp = '2026-01-02T12:00:00Z';
    const progress: GeocodeProgressState = {
      processedIds: ['a'],
      lastProcessedAt: timestamp,
      totalAtStart: 1,
    };

    localStorageMock.setItem('geocode_progress', JSON.stringify(progress));
    const stored = JSON.parse(localStorageMock.getItem('geocode_progress') || '{}');

    expect(stored.lastProcessedAt).toBe(timestamp);
  });

  it('should persist totalAtStart count', () => {
    const progress: GeocodeProgressState = {
      processedIds: [],
      lastProcessedAt: new Date().toISOString(),
      totalAtStart: 100,
    };

    localStorageMock.setItem('geocode_progress', JSON.stringify(progress));
    const stored = JSON.parse(localStorageMock.getItem('geocode_progress') || '{}');

    expect(stored.totalAtStart).toBe(100);
  });
});
