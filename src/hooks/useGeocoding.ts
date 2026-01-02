/**
 * Client-side geocoding hook with localStorage persistence for resume
 * and database persistence for usage tracking.
 *
 * Allows geocoding to resume if the user closes the tab/browser.
 * Tracks Mapbox API usage in database to prevent exceeding the free tier
 * across all users.
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  geocodeAddress,
  delay,
  GEOCODE_DELAY_MS,
  getMonthlyUsageFromDb,
  getRemainingQuotaFromDb,
  canMakeRequestFromDb,
  MAPBOX_MONTHLY_LIMIT,
  isMapboxConfigured,
} from '@/lib/mapboxGeocoding';
import type { ExamSession } from '@/hooks/useExamSessions';

const PROGRESS_STORAGE_KEY = 'geocode_progress';

/** Polling interval for usage updates during geocoding (ms) */
const USAGE_POLL_INTERVAL_MS = 2000;

export interface GeocodeProgressState {
  processedIds: string[];
  lastProcessedAt: string;
  totalAtStart: number;
}

export interface GeocodeProgress {
  processed: number;
  remaining: number;
  total: number;
  currentAddress?: string;
  monthlyUsage: number;
  monthlyLimit: number;
}

/**
 * Load persisted progress from localStorage.
 * Returns null if no progress exists or if data is corrupted.
 */
function loadProgress(): GeocodeProgressState | null {
  const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch (error) {
    // Log corrupted data for debugging
    console.warn('Corrupted geocode progress in localStorage, starting fresh:', error);
    return null;
  }
}

/**
 * Save progress to localStorage for resume capability.
 */
function saveProgress(state: GeocodeProgressState): void {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
}

/**
 * Clear progress from localStorage.
 */
function clearProgress(): void {
  localStorage.removeItem(PROGRESS_STORAGE_KEY);
}

/**
 * Hook to check if there's resumable geocoding progress.
 *
 * @returns Saved progress state or null if none exists
 */
export function useGeocodeResumableProgress(): GeocodeProgressState | null {
  const [progress, setProgress] = useState<GeocodeProgressState | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  return progress;
}

/**
 * Hook to get current Mapbox usage stats from database.
 *
 * @param isGeocoding - Whether geocoding is currently active (enables polling)
 * @returns Usage statistics including current count, remaining, and limit
 */
export function useMapboxUsage(isGeocoding = false) {
  const queryClient = useQueryClient();

  const { data: usageData } = useQuery({
    queryKey: ['mapbox-usage'],
    queryFn: async () => {
      const usage = await getMonthlyUsageFromDb();
      return {
        current: usage,
        remaining: Math.max(0, MAPBOX_MONTHLY_LIMIT - usage),
        limit: MAPBOX_MONTHLY_LIMIT,
        isConfigured: isMapboxConfigured(),
      };
    },
    // Only poll when geocoding is active to reduce database load
    refetchInterval: isGeocoding ? USAGE_POLL_INTERVAL_MS : false,
    staleTime: 1000,
  });

  // Function to manually refresh usage
  const refreshUsage = () => {
    queryClient.invalidateQueries({ queryKey: ['mapbox-usage'] });
  };

  return {
    current: usageData?.current ?? 0,
    remaining: usageData?.remaining ?? MAPBOX_MONTHLY_LIMIT,
    limit: usageData?.limit ?? MAPBOX_MONTHLY_LIMIT,
    isConfigured: usageData?.isConfigured ?? isMapboxConfigured(),
    refreshUsage,
  };
}

/**
 * Clear any saved geocoding progress from localStorage.
 * Call this when starting a fresh geocoding session or when user cancels.
 */
export function clearGeocodeProgress(): void {
  clearProgress();
}

/**
 * Main geocoding mutation hook.
 *
 * Handles batch geocoding of exam sessions with:
 * - Resume capability via localStorage
 * - Real-time progress updates
 * - Quota checking before and during processing
 * - Database updates for each geocoded session
 *
 * @returns TanStack Query mutation with geocoding functionality
 */
export function useClientGeocoding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessions,
      onProgress,
      forceAll = false,
    }: {
      sessions: ExamSession[];
      onProgress?: (progress: GeocodeProgress) => void;
      forceAll?: boolean;
    }) => {
      // Check if Mapbox is configured
      if (!isMapboxConfigured()) {
        throw new Error('Mapbox access token not configured. Add VITE_MAPBOX_ACCESS_TOKEN to your environment.');
      }

      // Load any existing progress (ignored in force mode)
      const storedProgress = forceAll ? null : loadProgress();
      const processedIds = new Set(storedProgress?.processedIds || []);

      // Filter sessions based on mode
      const toProcess = forceAll
        ? sessions.filter((s) => s.address && s.city && s.state)
        : sessions.filter(
            (s) =>
              (!s.latitude || !s.longitude) &&
              s.address &&
              s.city &&
              s.state &&
              !processedIds.has(s.id)
          );

      // Calculate totals
      const alreadyProcessed = forceAll ? 0 : processedIds.size;
      const total = toProcess.length + alreadyProcessed;

      // Check if we have enough quota from database
      const remainingQuota = await getRemainingQuotaFromDb();
      if (toProcess.length > remainingQuota) {
        throw new Error(
          `Not enough Mapbox quota. Need ${toProcess.length} requests but only ${remainingQuota} remaining this month.`
        );
      }

      let successCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];
      let currentUsage = await getMonthlyUsageFromDb();

      for (let i = 0; i < toProcess.length; i++) {
        const session = toProcess[i];

        // Report progress
        onProgress?.({
          processed: alreadyProcessed + i,
          remaining: toProcess.length - i,
          total,
          currentAddress: `${session.address}, ${session.city}, ${session.state}`,
          monthlyUsage: currentUsage,
          monthlyLimit: MAPBOX_MONTHLY_LIMIT,
        });

        // Double-check quota before each request
        if (!(await canMakeRequestFromDb())) {
          throw new Error('Monthly geocoding limit reached. Please try again next month.');
        }

        // Geocode the address (this also increments usage in DB)
        const coords = await geocodeAddress(
          session.address!,
          session.city,
          session.state,
          session.zip
        );

        // Update current usage for progress display
        currentUsage++;

        if (coords) {
          // Update database immediately for persistence
          const { error } = await supabase
            .from('exam_sessions')
            .update({
              latitude: coords.latitude,
              longitude: coords.longitude,
            })
            .eq('id', session.id);

          if (error) {
            const errorMsg = `Failed to update session ${session.id}: ${error.message}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          } else {
            successCount++;
          }
        } else {
          skippedCount++;
        }

        // Mark as processed regardless of success (to avoid retrying bad addresses)
        processedIds.add(session.id);
        saveProgress({
          processedIds: Array.from(processedIds),
          lastProcessedAt: new Date().toISOString(),
          totalAtStart: total,
        });

        // Rate limit between requests
        if (i < toProcess.length - 1) {
          await delay(GEOCODE_DELAY_MS);
        }
      }

      // Clear progress on successful completion
      clearProgress();

      // Final progress update
      onProgress?.({
        processed: total,
        remaining: 0,
        total,
        monthlyUsage: currentUsage,
        monthlyLimit: MAPBOX_MONTHLY_LIMIT,
      });

      // Log accumulated errors if any
      if (errors.length > 0) {
        console.warn(`Geocoding completed with ${errors.length} database update errors:`, errors);
      }

      return { processed: successCount, skipped: skippedCount, total: toProcess.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['mapbox-usage'] });
      if (data.skipped > 0) {
        toast.success(
          `Geocoded ${data.processed} of ${data.total} sessions (${data.skipped} could not be geocoded)`
        );
      } else {
        toast.success(`Geocoded ${data.processed} sessions`);
      }
    },
    onError: (error) => {
      console.error('Geocoding failed:', error);
      toast.error('Geocoding failed: ' + error.message);
    },
  });
}
