/**
 * Mapbox Geocoding Utility
 *
 * Provides geocoding functionality with built-in quota protection
 * to ensure we never exceed the free tier (100k requests/month).
 *
 * Usage is tracked in the database (mapbox_usage table) so it's
 * shared across all users and browsers.
 *
 * SECURITY NOTE: The VITE_MAPBOX_ACCESS_TOKEN is exposed in the client bundle.
 * This is acceptable for geocoding (read-only) but the token should be:
 * - Restricted to production domain in Mapbox dashboard
 * - Limited to geocoding-only permissions (no write/modify)
 */

import { supabase } from '@/integrations/supabase/client';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

/** Mapbox free tier is 100k/month. We stop at 95k to leave a 5k safety buffer. */
export const MAPBOX_MONTHLY_LIMIT = 95000;

/** Rate limiting delay between requests in milliseconds (~400 req/min max). */
export const GEOCODE_DELAY_MS = 150;

/** Threshold for warning user about significant quota usage (50% of remaining). */
export const QUOTA_WARNING_THRESHOLD = 0.5;

export interface GeocodingResult {
  latitude: number;
  longitude: number;
}

/**
 * Get current year_month key for database partitioning.
 * Format: "YYYY_MM" (e.g., "2026_01")
 *
 * This key is used to track monthly usage. When a new month starts,
 * a new key is generated, effectively resetting the quota automatically.
 *
 * @returns Current year and month in "YYYY_MM" format
 */
export function getYearMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}_${month}`;
}

/**
 * Get current month's Mapbox API usage count from database.
 *
 * @returns Current month's request count, or 0 if no record exists
 */
export async function getMonthlyUsageFromDb(): Promise<number> {
  const yearMonth = getYearMonthKey();

  const { data, error } = await supabase
    .from('mapbox_usage')
    .select('request_count')
    .eq('year_month', yearMonth)
    .single();

  if (error || !data) {
    // No record yet means 0 usage
    return 0;
  }

  return data.request_count;
}

/**
 * Increment the monthly usage counter in database.
 * Uses an atomic upsert operation to prevent race conditions.
 *
 * @returns The new count after incrementing
 * @throws Error if the database operation fails
 */
export async function incrementUsageInDb(): Promise<number> {
  const yearMonth = getYearMonthKey();

  const { data, error } = await supabase
    .rpc('increment_mapbox_usage', { p_year_month: yearMonth });

  if (error) {
    console.error('Failed to increment Mapbox usage:', error);
    throw error;
  }

  // Validate that we received a number
  if (typeof data !== 'number') {
    console.warn('Unexpected response from increment_mapbox_usage:', data);
    return 0;
  }

  return data;
}

/**
 * Get remaining quota for this month.
 *
 * @returns Number of requests remaining before hitting the monthly limit
 */
export async function getRemainingQuotaFromDb(): Promise<number> {
  const usage = await getMonthlyUsageFromDb();
  return Math.max(0, MAPBOX_MONTHLY_LIMIT - usage);
}

/**
 * Check if we can make another request without exceeding quota.
 *
 * @returns true if quota is available, false if limit reached
 */
export async function canMakeRequestFromDb(): Promise<boolean> {
  const usage = await getMonthlyUsageFromDb();
  return usage < MAPBOX_MONTHLY_LIMIT;
}

/**
 * Check if Mapbox is configured with an access token.
 *
 * @returns true if VITE_MAPBOX_ACCESS_TOKEN is set
 */
export function isMapboxConfigured(): boolean {
  return !!MAPBOX_ACCESS_TOKEN;
}

/**
 * Geocode an address using Mapbox API.
 *
 * This function:
 * 1. Validates that Mapbox is configured
 * 2. Makes the API request to Mapbox
 * 3. Increments the usage counter (always, to prevent retry storms on errors)
 * 4. Parses and returns the coordinates
 *
 * @param address - Street address (e.g., "123 Main St")
 * @param city - City name (e.g., "Raleigh")
 * @param state - State abbreviation (e.g., "NC")
 * @param zip - ZIP code (e.g., "27601")
 * @returns Coordinates {latitude, longitude} or null if geocoding failed
 */
export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<GeocodingResult | null> {
  // Check configuration
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error('Mapbox access token not configured');
    return null;
  }

  // Build the search query
  const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=us&access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;

  let apiCallMade = false;

  try {
    const response = await fetch(url);
    apiCallMade = true;

    if (!response.ok) {
      console.error(`Geocoding failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lon, lat] = data.features[0].center;
      return { latitude: lat, longitude: lon };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  } finally {
    // Always increment usage if API call was made, even on errors
    // This prevents retry storms from exhausting quota without tracking
    if (apiCallMade) {
      try {
        await incrementUsageInDb();
      } catch (incrementError) {
        // Log but don't throw - we don't want to lose the geocoding result
        console.error('Failed to increment usage after geocoding:', incrementError);
      }
    }
  }
}

/**
 * Delay helper for rate limiting between API requests.
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
